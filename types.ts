export type ToolId = 'music' | 'video' | 'image' | 'tts' | 'imagen';

export enum GenerationStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export type UserTier = 'FREE' | 'PREMIUM';

export interface UsageLimits {
  video: number;
  music: number;
  image: number;
  tts: number;
  imagen: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  tier: UserTier;
  usage: UsageLimits;
  createdAt: number;
  lastLoginAt: number;
}

export interface GlobalSettings {
  freeLimit: number;
  premiumLimit: number;
  packagePrice?: number;
  promoPrice?: number;
}

export interface GenerationResult {
  id: string;
  type: ToolId;
  url?: string;
  text?: string;
  createdAt: number;
  prompt: string;
}

export interface ShadowApiResponse {
  internal_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  data?: any;
  message?: string;
}

export interface VeoConfig {
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
}

export interface ImageConfig {
  aspectRatio: '1:1' | '3:4' | '4:3' | '16:9';
}
