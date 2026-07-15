export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/* ── Spring pagination ── */
export type UUID = string;

export interface Pageable {
  page?: number;
  size?: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

/* ── User / Profile ── */
export interface PerfilResponse {
  id?: string;
  usuarioId?: string;
  bio?: string;
  carrera?: string;
  segundaCarrera?: string;
  semestre?: number | string;
  intereses?: string[];
  nombre?: string;
  apellidos?: string;
  email?: string;
  foto?: string;
  genero?: string;
  fechaNacimiento?: string;
  onboardingCompleto?: boolean;
}

export interface ActualizarPerfilPayload {
  bio?: string;
  carrera?: string;
  segundaCarrera?: string;
  semestre?: number | string;
  intereses?: string[];
  disponibilidad?: unknown;
}

export interface OnboardingPayload {
  nombre: string;
  apellidos: string;
  carrera: string;
  segundaCarrera?: string;
  semestre: number;
  fechaNacimiento?: string;
  genero?: string;
  foto?: string;
  intereses: string[];
}

/* ── Parches ── */
export type ParcheCategory =
  | "SPORT"
  | "ENTERTAINMENT"
  | "MUSIC"
  | "ART"
  | "TECHNOLOGY"
  | "STUDY"
  | "VARIETY";

export type Visibility = "PUBLIC" | "PRIVATE";
export type ParcheStatus = "PENDING_PROVISIONING" | "READY";

export interface CreateParcheRequest {
  name: string;
  description: string;
  category: ParcheCategory;
  maxCapacity: number;
  visibility: Visibility;
  pictureUrl?: string;
}

export interface CreateParcheResponse {
  parcheId: UUID;
  name: string;
  description: string;
  visibility: Visibility;
  status: ParcheStatus;
  pictureUrl: string;
}

export interface CommunicationChannels {
  chatId: UUID | null;
  voiceId: UUID | null;
}

export interface ParcheResponse {
  name: string;
  description: string;
  category: ParcheCategory;
  visibility: Visibility;
  status: ParcheStatus;
  maxCapacity: number;
  memberCount: number;
  pictureUrl: string;
  communication: CommunicationChannels | null;
}

export interface ParcheSummaryResponse {
  parcheId: UUID;
  name: string;
  description: string;
  category: ParcheCategory;
  visibility: Visibility;
  status: ParcheStatus;
  maxCapacity: number;
  memberCount: number;
  pictureUrl: string;
}

export interface CreateInviteRequest {
  parcheId: UUID;
}

export interface InviteTokenResponse {
  token: string;
  expiresInSeconds: number;
}

export interface PictureUploadRequest {
  contentType: string;
  fileSize?: number | null;
}

export interface PictureUploadResponse {
  uploadUrl: string;
  fields: Record<string, string>;
  publicUrl: string;
  objectKey: string;
}
