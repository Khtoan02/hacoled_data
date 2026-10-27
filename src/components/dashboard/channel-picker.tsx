"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AtSign,
  Camera,
  Check,
  ChevronDown,
  Globe2,
  Hash,
  Music2,
  Play,
} from "lucide-react";
import {
  SOCIAL_PLATFORMS,
  type SocialChannel,
  type SocialPlatform,
} from "../../lib/social";

export function channelIdentifier(
  channel: Pick<SocialChannel, "handle" | "url">,
) {
  const handle = channel.handle.trim();
  if (handle) return handle.startsWith("@") ? handle : `@${handle}`;
  try {
    return new URL(channel.url).hostname.replace(/^www\./, "");
  } catch {
    return "Chưa có định danh";
  }
}

export function ChannelPlatformIcon({
  platform,
  compact = false,
}: {
  platform: SocialPlatform;
  compact?: boolean;
}) {
  const size = compact ? 16 : 21;
  let mark: React.ReactNode;
  switch (platform) {
    case "facebook":
      mark = <span className="social-platform-letter facebook-mark">f</span>;
      break;
    case "instagram":
      mark = <Camera size={size} strokeWidth={2} />;
      break;
    case "tiktok":
      mark = <Music2 size={size} strokeWidth={2.2} />;
      break;
    case "youtube":
      mark = <Play size={size} strokeWidth={2.2} fill="currentColor" />;
      break;
    case "zalo":
      mark = <span className="social-platform-letter zalo-mark">Z</span>;
      break;
    case "linkedin":
      mark = <span className="social-platform-letter linkedin-mark">in</span>;
      break;
    case "threads":
      mark = <AtSign size={size} strokeWidth={2} />;
      break;
    case "website":
      mark = <Globe2 size={size} strokeWidth={2} />;
      break;
    default:
      mark = <Hash size={size} strokeWidth={2} />;
  }
  return (
    <span
      className={`social-platform-icon platform-${platform} ${compact ? "compact" : ""}`}
      aria-hidden="true"
    >
      {mark}
    </span>
  );
}

export function ChannelIdentity({
  channel,
  compact = false,
}: {
  channel: Pick<
    SocialChannel,
    "name" | "platform" | "handle" | "url" | "active"
  >;
  compact?: boolean;
}) {
  return (
    <span className={`channel-identity ${compact ? "compact" : ""}`}>
      <ChannelPlatformIcon platform={channel.platform} compact={compact} />
      <span className="channel-identity-copy">
        <strong>{channel.name}</strong>
        <small>
          {SOCIAL_PLATFORMS[channel.platform]} · {channelIdentifier(channel)}
          {!channel.active ? " · Lưu trữ" : ""}
        </small>
      </span>
    </span>
  );
}

type SpecialOption = { value: string; label: string };
export function ChannelSelect({
  value,
  channels,
  onChange,
  ariaLabel,
  placeholder = "Chọn kênh",
  specialOptions = [],
  disabled = false,
}: {
  value: string;
  channels: SocialChannel[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  specialOptions?: SpecialOption[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = channels.find((channel) => channel.id === value);
  const special = specialOptions.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div className={`channel-picker ${open ? "is-open" : ""}`} ref={root}>
      <button
        type="button"
        className="channel-picker-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        {selected ? (
          <ChannelIdentity channel={selected} compact />
        ) : (
          <span className="channel-picker-placeholder">
            {special?.label || placeholder}
          </span>
        )}
        <ChevronDown size={16} className="channel-picker-chevron" />
      </button>
      {open && (
        <div className="channel-picker-menu" id={listId} role="listbox">
          {specialOptions.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={value === option.value}
              className="channel-picker-special"
              key={option.value}
              onClick={() => choose(option.value)}
            >
              <span>{option.label}</span>
              {value === option.value && <Check size={15} />}
            </button>
          ))}
          {channels.map((channel) => (
            <button
              type="button"
              role="option"
              aria-selected={value === channel.id}
              key={channel.id}
              onClick={() => choose(channel.id)}
            >
              <ChannelIdentity channel={channel} compact />
              {value === channel.id && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
