/**
 * Location MS — STOMP client for real-time geo tracking within events.
 * Native WebSocket STOMP. JWT rides as ?access_token= on the WS upgrade.
 *
 * CRITICAL: subscribe to /topic/geo/{eventId} BEFORE subscribing to
 * /user/queue/geo/{eventId}/snapshot to avoid a race condition where
 * the snapshot is sent before the subscription is ready.
 */

import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { API_URL } from "../config/api";
import { tokenManager } from "./tokenManager";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeoBroadcastMessage {
  type: "POSITION" | "JOIN" | "LEAVE";
  userId: string;
  username?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface GeoSnapshotMessage {
  users: GeoBroadcastMessage[];
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
   * Internal: subscribe to broadcast + snapshot for a specific event.
   * Order matters: broadcast subscription must be registered before
   * requesting the snapshot so the snapshot is not missed.
   */
  private _subscribeToEvent(eventId: string): void {
    const broadcastSub = this.client.subscribe(
      `/topic/geo/${eventId}`,
      (message: IMessage) => {
        if (message.body) {
          this.opts.onGeoBroadcast?.(JSON.parse(message.body));
        }
      }
    );

    // Snapshot request after broadcast subscription is in place
    this.client.publish({
      destination: `/app/geo/${eventId}/snapshot`,
      body: "{}",
    });

    const snapshotSub = this.client.subscribe(
      `/user/queue/geo/${eventId}/snapshot`,
      (message: IMessage) => {
        if (message.body) {
          this.opts.onGeoSnapshot?.(JSON.parse(message.body));
        }
      }
    );

    this.eventSubs.push(broadcastSub, snapshotSub);
  }
}
