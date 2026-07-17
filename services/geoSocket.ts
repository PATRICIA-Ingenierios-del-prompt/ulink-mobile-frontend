/**
 * Location MS — STOMP client for real-time geo tracking within events.
 * Native WebSocket STOMP. JWT rides as ?access_token= on the WS upgrade.
 *
 * Backend contract (PATRICIA_Location_Backend):
 *   SEND      /app/geo/{eventId}                     -> position update {latitude, longitude}
 *   SUBSCRIBE /topic/geo/{eventId}                   -> live broadcasts; also triggers a
 *                                                       one-shot snapshot seed for this session
 *   RECEIVE   /user/queue/geo/{eventId}/snapshot     -> the seeded snapshot
 *
 * The snapshot is pushed by the server as a side effect of the SUBSCRIBE to the
 * topic (StompSubscriptionEventListener) — there is no request destination.
 * We therefore subscribe to the snapshot queue BEFORE subscribing to the topic
 * so the session-scoped snapshot is never delivered before its listener exists.
 */

import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { API_URL } from "../config/api";
import { tokenManager } from "./tokenManager";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeoBroadcastMessage {
  userId: string;
  latitude: number;
  longitude: number;
  /** ISO-8601 instant emitted by the backend (`recordedAt`). */
  recordedAt: string;
}

export interface GeoSnapshotMessage {
  eventId: string;
  positions: GeoBroadcastMessage[];
}

// ── Service ───────────────────────────────────────────────────────────────────

const WS_PATH = "/ws/geo";

function buildWsUrl(token: string): string {
  const base = API_URL.replace(/^http/, "ws");
  return `${base}${WS_PATH}?access_token=${encodeURIComponent(token)}`;
}

export interface GeoSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onGeoBroadcast?: (msg: GeoBroadcastMessage) => void;
  onGeoSnapshot?: (snap: GeoSnapshotMessage) => void;
}

export class GeoSocket {
  private client: Client;
  private eventSubs: StompSubscription[] = [];
  private subscribedEvents = new Set<string>();

  constructor(private opts: GeoSocketOptions = {}) {
    this.client = new Client({
      beforeConnect: async () => {
        const token = (await tokenManager.getAccessToken()) ?? "";
        this.client.brokerURL = buildWsUrl(token);
        this.client.connectHeaders = { Authorization: `Bearer ${token}` };
      },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
      onConnect: () => {
        // Re-subscribe to any events that were subscribed before disconnect
        this.subscribedEvents.forEach((eventId) =>
          this._subscribeToEvent(eventId)
        );
        this.opts.onConnect?.();
      },
      onWebSocketClose: () => this.opts.onDisconnect?.(),
    });
  }

  activate(): void {
    this.client.activate();
  }

  get connected(): boolean {
    return this.client.connected;
  }

  async deactivate(): Promise<void> {
    this.eventSubs.forEach((s) => s.unsubscribe());
    this.eventSubs = [];
    this.subscribedEvents.clear();
    await this.client.deactivate();
  }

  subscribeToEvent(eventId: string): void {
    if (this.subscribedEvents.has(eventId)) return;
    this.subscribedEvents.add(eventId);
    if (this.client.connected) {
      this._subscribeToEvent(eventId);
    }
  }

  unsubscribeFromEvent(eventId: string): void {
    this.subscribedEvents.delete(eventId);
    // Individual unsubscribes handled by the subscription objects
  }

  sendPosition(eventId: string, latitude: number, longitude: number): void {
    if (!this.client.connected) {
      console.warn("[GeoSocket] sendPosition ignored: not connected");
      return;
    }
    this.client.publish({
      destination: `/app/geo/${eventId}`,
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  /**
   * Internal: subscribe to snapshot + broadcast for a specific event.
   * Order matters: the snapshot queue must be registered BEFORE the topic
   * subscription that makes the server seed the snapshot, otherwise the
   * session-scoped seed can arrive before its listener exists and be lost.
   */
  private _subscribeToEvent(eventId: string): void {
    const snapshotSub = this.client.subscribe(
      `/user/queue/geo/${eventId}/snapshot`,
      (message: IMessage) => {
        if (message.body) {
          this.opts.onGeoSnapshot?.(JSON.parse(message.body));
        }
      }
    );

    // Subscribing to the topic triggers the server-side snapshot seed.
    const broadcastSub = this.client.subscribe(
      `/topic/geo/${eventId}`,
      (message: IMessage) => {
        if (message.body) {
          this.opts.onGeoBroadcast?.(JSON.parse(message.body));
        }
      }
    );

    this.eventSubs.push(snapshotSub, broadcastSub);
  }
}
