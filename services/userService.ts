import { apiClient } from "./apiClient";
import { withCache } from "./cache";
import type {
  PerfilResponse,
  ActualizarPerfilPayload,
  OnboardingPayload,
} from "./types";

const BASE = "/api/v1/usuarios";

export const userService = {
  async getPerfil(userId: string): Promise<PerfilResponse> {
    return withCache(
      `user:perfil:${userId}`,
      () => apiClient.get<PerfilResponse>(`${BASE}/${userId}/perfil`).then((r) => r.data),
      300_000 // 5 min — profiles rarely change mid-session
    );
  },

  async updatePerfil(
    userId: string,
    payload: ActualizarPerfilPayload
  ): Promise<PerfilResponse> {
    const { data } = await apiClient.put<PerfilResponse>(
      `${BASE}/${userId}/perfil`,
      payload
    );
    return data;
  },

  async getIntereses(userId: string): Promise<string[]> {
    const { data } = await apiClient.get<string[]>(
      `${BASE}/${userId}/intereses`
    );
    return data;
  },

  async updateIntereses(userId: string, intereses: string[]): Promise<string[]> {
    const { data } = await apiClient.put<string[]>(
      `${BASE}/${userId}/intereses`,
      { intereses }
    );
    return data;
  },

  async completarOnboarding(
    userId: string,
    payload: OnboardingPayload
  ): Promise<PerfilResponse> {
    const { data } = await apiClient.put<PerfilResponse>(
      `${BASE}/${userId}/perfil`,
      { ...payload, onboardingCompleto: true }
    );
    return data;
  },

  async necesitaOnboarding(userId: string): Promise<boolean> {
    try {
      const perfil = await userService.getPerfil(userId);
      const completo =
        !!perfil.nombre?.trim() &&
        !!perfil.carrera?.trim() &&
        Array.isArray(perfil.intereses) &&
        perfil.intereses.length >= 3;
      return !completo;
    } catch (err: any) {
      if (err?.response?.status === 404) return true;
      return false;
    }
  },
};
