import { apiClient } from "./apiClient";
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
    const { data } = await apiClient.get<SugerenciaResponse[]>(
      `${BASE}/sugerencias`,
      { params: { limite } }
    );
    return data;
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
    const { data } = await apiClient.get<MatchResponse[]>(`${BASE}/matches`);
    return data;
  },

  async solicitudesRecibidas(): Promise<UUID[]> {
    const { data } = await apiClient.get<UUID[]>(
      `${BASE}/solicitudes-recibidas`
    );
    return data;
  },
};
