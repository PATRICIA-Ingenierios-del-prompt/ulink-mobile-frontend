import { apiClient } from "./apiClient";
import { withCache } from "./cache";
import type { Page, Pageable } from "./types";

const BASE = "/api/events";

export interface EventMapResponse {
  eventId: string;
  parcheId: string;
  title: string;
  description: string;
  category: string;
  locationName: string;
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
  visibility: string;
}

export interface EventResponse extends EventMapResponse {
  ownerId: string;
  ownerName: string;
  parcheName: string;
  pictureUrl: string;
}

/** Matches the backend `LocationDto`. */
export interface LocationDto {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  placeId?: string | null;
}

/**
 * Matches the backend `CreateEventRequest` (POST /api/events).
 * Dates/times are strings in the backend-declared formats.
 */
export interface CreateEventRequest {
  name: string;
  description: string;
  category: string; // backend Category enum
  maxCapacity: number;
  eventDate: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  meetingPoint?: LocationDto | null;
  destination?: LocationDto | null;
  pictureUrl?: string | null;
}

/** Matches the backend `CreateEventResponse`. */
export interface CreateEventResponse {
  eventId: string;
  name: string;
  description: string;
  category: string;
  parcheId: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  pictureUrl: string | null;
}

const pageParams = (p?: Pageable) => ({
  page: p?.page ?? 0,
  size: p?.size ?? 50, // Reduced default from 200 to 50 for performance
});

export const eventService = {
  async get(eventId: string): Promise<EventResponse> {
    return withCache(
      `event:detail:${eventId}`,
      () => apiClient.get<EventResponse>(`${BASE}/${eventId}`).then((r) => r.data),
      120_000 // 2 min cache
    );
  },

  async publicMap(page?: Pageable): Promise<Page<EventMapResponse>> {
    const p = pageParams(page);
    return withCache(
      `event:map:${p.page}:${p.size}`,
      () => apiClient.get<Page<EventMapResponse>>(`${BASE}/map`, { params: p }).then((r) => r.data),
      45_000 // 45 s cache for map events
    );
  },

  async myJoinedEvents(page?: Pageable): Promise<Page<EventMapResponse>> {
    const p = pageParams(page);
    return withCache(
      `event:joined:${p.page}:${p.size}`,
      () => apiClient.get<Page<EventMapResponse>>(`${BASE}/me`, { params: p }).then((r) => r.data),
      30_000 // 30 s cache
    );
  },

  async myParchesEvents(page?: Pageable): Promise<Page<EventMapResponse>> {
    const p = pageParams(page);
    return withCache(
      `event:parches:${p.page}:${p.size}`,
      () => apiClient.get<Page<EventMapResponse>>(`${BASE}/me/parches/events`, { params: p }).then((r) => r.data),
      30_000 // 30 s cache
    );
  },

  async createEvent(body: CreateEventRequest): Promise<CreateEventResponse> {
    const { data } = await apiClient.post<CreateEventResponse>(BASE, body);
    return data;
  },

  async join(eventId: string): Promise<void> {
    await apiClient.post(`${BASE}/${eventId}/join`);
  },

  async createReport(eventId: string, body: { reportType: string; description: string }): Promise<void> {
    await apiClient.post(`${BASE}/${eventId}/reports`, body);
  },
};
