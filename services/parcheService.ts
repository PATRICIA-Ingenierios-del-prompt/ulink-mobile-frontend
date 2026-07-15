import { apiClient } from "./apiClient";
import { withCache, cache } from "./cache";
import type {
  CreateInviteRequest,
  CreateParcheRequest,
  CreateParcheResponse,
  InviteTokenResponse,
  Page,
  Pageable,
  ParcheCategory,
  ParcheResponse,
  ParcheSummaryResponse,
  PictureUploadRequest,
  PictureUploadResponse,
  UUID,
  Visibility,
} from "./types";

const BASE = "/api/parches";
const INVITES = "/api/invites";

// Reduced to 30 so the first render is fast; load more pages on demand
const pageParams = (p?: Pageable) => ({
  page: p?.page ?? 0,
  size: p?.size ?? 30,
});

export const parcheService = {
  /* ── mutations ── */
  async create(body: CreateParcheRequest): Promise<CreateParcheResponse> {
    const { data } = await apiClient.post<CreateParcheResponse>(BASE, body);
    cache.invalidatePrefix("parches:"); // bust cached lists after create
    return data;
  },

  async remove(parcheId: UUID): Promise<void> {
    await apiClient.delete(`${BASE}/${parcheId}`);
    cache.invalidatePrefix("parches:"); // bust cached lists after delete
  },

  async join(parcheId: UUID): Promise<void> {
    await apiClient.post(`${BASE}/${parcheId}/join`);
  },

  async removeMember(parcheId: UUID, memberId: UUID): Promise<void> {
    await apiClient.delete(`${BASE}/${parcheId}/members/${memberId}`);
  },

  /* ── queries ── */
  async get(parcheId: UUID): Promise<ParcheResponse> {
    const { data } = await apiClient.get<ParcheResponse>(`${BASE}/${parcheId}`);
    return data;
  },

  async getEvents(parcheId: UUID): Promise<UUID[]> {
    const { data } = await apiClient.get<UUID[]>(`${BASE}/${parcheId}/events`);
    return data;
  },

  async byCategory(
    category: ParcheCategory,
    page?: Pageable
  ): Promise<Page<ParcheSummaryResponse>> {
    const p = pageParams(page);
    return withCache(
      `parches:cat:${category}:${p.page}`,
      () => apiClient.get<Page<ParcheSummaryResponse>>(`${BASE}/category`, { params: { category, ...p } }).then((r) => r.data),
      30_000 // 30 s
    );
  },

  async byVisibility(
    visibility: Visibility,
    page?: Pageable
  ): Promise<Page<ParcheSummaryResponse>> {
    const p = pageParams(page);
    return withCache(
      `parches:vis:${visibility}:${p.page}`,
      () => apiClient.get<Page<ParcheSummaryResponse>>(`${BASE}/visibility`, { params: { visibility, ...p } }).then((r) => r.data),
      30_000
    );
  },

  async openSpots(
    page?: Pageable
  ): Promise<Page<ParcheSummaryResponse>> {
    const { data } = await apiClient.get<Page<ParcheSummaryResponse>>(
      `${BASE}/capacity`,
      { params: pageParams(page) }
    );
    return data;
  },

  async byName(
    name: string,
    page?: Pageable
  ): Promise<Page<ParcheSummaryResponse>> {
    const { data } = await apiClient.get<Page<ParcheSummaryResponse>>(
      `${BASE}/name`,
      { params: { name, ...pageParams(page) } }
    );
    return data;
  },

  async mine(
    page?: Pageable
  ): Promise<Page<ParcheSummaryResponse>> {
    const p = pageParams(page);
    return withCache(
      `parches:mine:${p.page}`,
      () => apiClient.get<Page<ParcheSummaryResponse>>(`${BASE}/me`, { params: p }).then((r) => r.data),
      45_000 // 45 s — user's own parches change less often
    );
  },

  /* ── invites ── */
  async createInvite(body: CreateInviteRequest): Promise<InviteTokenResponse> {
    const { data } = await apiClient.post<InviteTokenResponse>(INVITES, body);
    return data;
  },

  async acceptInvite(token: string): Promise<void> {
    await apiClient.post(`${INVITES}/accept`, null, { params: { token } });
  },

  /* ── picture upload (presigned S3) ── */
  async requestPictureUpload(
    body: PictureUploadRequest
  ): Promise<PictureUploadResponse> {
    const { data } = await apiClient.post<PictureUploadResponse>(
      `${BASE}/picture-upload-url`,
      body
    );
    return data;
  },
};
