import { apiClient } from "./apiClient";
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

const pageParams = (p?: Pageable) => ({
  page: p?.page ?? 0,
  size: p?.size ?? 200,
});

export const eventService = {
  async get(eventId: string): Promise<EventResponse> {
    const { data } = await apiClient.get<EventResponse>(
      `${BASE}/${eventId}`
    );
    return data;
  },

  async publicMap(page?: Pageable): Promise<Page<EventMapResponse>> {
    const { data } = await apiClient.get<Page<EventMapResponse>>(
      `${BASE}/map`,
      { params: pageParams(page) }
    );
    return data;
  },

  async myJoinedEvents(page?: Pageable): Promise<Page<EventMapResponse>> {
    const { data } = await apiClient.get<Page<EventMapResponse>>(
      `${BASE}/me`,
      { params: pageParams(page) }
    );
    return data;
  },

  async myParchesEvents(page?: Pageable): Promise<Page<EventMapResponse>> {
    const { data } = await apiClient.get<Page<EventMapResponse>>(
      `${BASE}/me/parches/events`,
      { params: pageParams(page) }
    );
    return data;
  },

  async join(eventId: string): Promise<void> {
    await apiClient.post(`${BASE}/${eventId}/join`);
  },
};
