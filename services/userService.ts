import { apiClient } from "./apiClient";
import { withCache } from "./cache";
import type {
  PerfilResponse,
  FotoUploadResponse,
  ActualizarPerfilPayload,
  OnboardingPayload,
} from "./types";

const BASE = "/api/v1/usuarios";

/** Normalise the backend's `urlFotoPerfil` field to `foto` so the rest of
 *  the app can read `perfil.foto` uniformly (mirrors web userService). */
function normaliseFoto<T extends PerfilResponse>(data: T): T {
  return { ...data, foto: data.foto ?? data.urlFotoPerfil };
}

export const userService = {
  async getPerfil(userId: string): Promise<PerfilResponse> {
    return withCache(
      `user:perfil:${userId}`,
      () =>
        apiClient
          .get<PerfilResponse>(`${BASE}/${userId}/perfil`)
          .then((r) => normaliseFoto(r.data)),
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
    return normaliseFoto(data);
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
    return normaliseFoto(data);
  },

  async necesitaOnboarding(userId: string): Promise<boolean> {
    try {
      const perfil = await userService.getPerfil(userId);
      return !perfil.onboardingCompleto;
    } catch (err: any) {
      if (err?.response?.status === 404) return true;
      return false;
    }
  },

  // ── Profile photo ─────────────────────────────────────────────────────────

  /**
   * Upload a profile photo as a base64 data-URL.
   * POST /api/v1/usuarios/{id}/foto/base64
   *
   * The response includes `tienePersonaEnFoto` — if false the photo was
   * rejected by the AI person-detection model and the user must retry.
   */
  async subirFotoPerfil(
    userId: string,
    dataUrl: string
  ): Promise<FotoUploadResponse> {
    const { data } = await apiClient.post<FotoUploadResponse>(
      `${BASE}/${userId}/foto/base64`,
      { dataUrl }
    );
    return normaliseFoto(data);
  },
};
