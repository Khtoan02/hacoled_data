export const SOCIAL_PLATFORMS = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  zalo: "Zalo",
  linkedin: "LinkedIn",
  threads: "Threads",
  website: "Website",
  other: "Khác",
} as const;
export type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;
export interface SocialChannel {
  id: string;
  name: string;
  platform: SocialPlatform;
  url: string;
  handle: string;
  notes: string;
  active: boolean;
  has_credentials: boolean;
  can_view_credentials: boolean;
  version: number;
  updated_at: string;
}
export const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
