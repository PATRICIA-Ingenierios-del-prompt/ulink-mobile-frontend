import { apiClient } from "./apiClient";
import { withCache } from "./cache";
import type { UUID } from "./types";

const BASE = "/matching";

export interface SugerenciaResponse {
  candidatoId: UUID;
  score: number;
  razon: string;
}

export type DecisionMatching = "LIKE" | "DESCARTE";

export interface DecisionResponse {
  matchConfirmado: boolean;
  matchId?: UUID;
}

export interface MatchResponse {
  matchId: UUID;
  otroUsuarioId: UUID;
  fechaMatch: string;
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
};
