import { apiClient } from "./apiClient";
import { cache, withCache } from "./cache";
import type { UUID } from "./types";

const BASE = "/matching";

/** Mirrors SugerenciaResponse from the Matching MS. */
export interface SugerenciaResponse {
  candidatoId: UUID;
  scoreTotal: number;
  scoreIntereses: number;
  scoreAcademico: number;
  scoreDisponibilidad: number;
  calculadoEn: string;
}

export type DecisionMatching = "LIKE" | "DESCARTE";

/** Mirrors MatchResponse from the Matching MS. */
export interface MatchResponse {
  matchId: UUID;
  otroUsuarioId: UUID;
  scoreTotal: number;
  confirmadoEn: string;
}

/** Mirrors DecisionResponse from the Matching MS. */
export interface DecisionResponse {
  matchConfirmado: boolean;
  match: MatchResponse | null;
}

export const matchingService = {
  async obtenerSugerencias(limite = 20): Promise<SugerenciaResponse[]> {
    return withCache(
      `matching:sugerencias:${limite}`,
      () => apiClient.get<SugerenciaResponse[]>(`${BASE}/sugerencias`, { params: { limite } }).then((r) => r.data),
      120_000 // 2 min — suggestions don't change that fast
    );
  },

  async decidir(
    candidatoId: UUID,
    decision: DecisionMatching
  ): Promise<DecisionResponse> {
    const { data } = await apiClient.post<DecisionResponse>(
      `${BASE}/decisiones`,
      { candidatoId, decision }
    );
    // A decision changes the suggestion queue and possibly matches/requests —
    // drop everything so the next read reflects the backend state.
    cache.invalidatePrefix("matching:");
    return data;
  },

  async listarMatches(): Promise<MatchResponse[]> {
    return withCache(
      `matching:matches`,
      () => apiClient.get<MatchResponse[]>(`${BASE}/matches`).then((r) => r.data),
      60_000 // 1 min
    );
  },

  async solicitudesRecibidas(): Promise<UUID[]> {
    const { data } = await apiClient.get<UUID[]>(
      `${BASE}/solicitudes-recibidas`
    );
    return data;
  },

  /** Force a fresh read of the suggestion queue (e.g. pull-to-refresh). */
  invalidarSugerencias(): void {
    cache.invalidatePrefix("matching:sugerencias");
  },
};
