import { apiClient } from "./apiClient";
import type { EventMapResponse } from "./eventService";

const BASE = "/api/locations";

export interface LiveParticipant {
  userId: string;
  username: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export const locationService = {
  async liveSnapshot(eventId: string): Promise<LiveParticipant[]> {
    const { data } = await apiClient.get<LiveParticipant[]>(`${BASE}/${eventId}/live`);
    return data;
  },

  async nearbyEvents(latitude: number, longitude: number, radiusKm: number = 5): Promise<EventMapResponse[]> {
    const { data } = await apiClient.get<EventMapResponse[]>("/api/events/nearby", {
      params: { latitude, longitude, radius: radiusKm },
    });
    return data;
  },
};