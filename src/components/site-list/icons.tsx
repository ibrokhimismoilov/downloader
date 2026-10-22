import type { Site } from "@/lib/sites";

const iconClass = "size-3.5 shrink-0";

export function SiteIcon({ id }: { id: Site["id"] }) {
  if (id === "youtube") return <YouTubeIcon />;
  if (id === "vk") return <VkIcon />;
  if (id === "facebook") return <FacebookIcon />;
  if (id === "instagram") return <InstagramIcon />;
  if (id === "ok") return <OkIcon />;
  if (id === "tiktok") return <TikTokIcon />;
  return <RutubeIcon />;
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 16 16" className={iconClass} aria-hidden="true">
      <rect x="0.6" y="3" width="14.8" height="10" rx="2.8" fill="currentColor" />
      <path d="M6.6 6v4l4.2-2L6.6 6Z" fill="#ff0000" />
    </svg>
  );
}

function VkIcon() {
  return (
    <svg viewBox="0 0 16 16" className={iconClass} aria-hidden="true">
      <path
        fill="currentColor"
        d="M.8 3.4h2.2L5.2 9.2 7.4 3.4h2.2L6.4 12.6H4.2L.8 3.4Zm8.6 0H11v4.1l2.6-4.1h2.2L12.6 8l3.2 4.6h-2.3l-2.1-3.2-.4.6v2.6H9.4V3.4Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 16 16" className={iconClass} aria-hidden="true">
      <path
        fill="currentColor"
        d="M9.5 14.4V8.8h1.8l.3-2.1H9.5V5.4c0-.6.2-1 1.1-1H11.7V2.3c-.2 0-1-.2-1.8-.2-1.8 0-3 1.1-3 3.1v1.5H5.1v2.1h1.8v5.6h2.6Z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 16 16" className={iconClass} fill="none" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="3.4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11.3" cy="4.7" r="0.7" fill="currentColor" />
    </svg>
  );
}

function OkIcon() {
  return (
    <svg viewBox="0 0 16 16" className={iconClass} fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="6.3" r="1.5" fill="currentColor" />
      <path
        d="M4.9 11.5c.6-1.4 1.7-2.1 3.1-2.1s2.5.7 3.1 2.1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RutubeIcon() {
  return (
    <svg viewBox="0 0 16 16" className={iconClass} aria-hidden="true">
      <path
        fill="currentColor"
        d="M3.1 2.6h5.4c2.2 0 3.6 1.3 3.6 3.2 0 1.4-.7 2.4-1.9 2.9l2.5 4.7h-2.6L7.8 8.9H5.5v4.5H3.1V2.6Zm2.4 1.9v2.6h2.8c.9 0 1.4-.5 1.4-1.3s-.5-1.3-1.4-1.3H5.5Z"
      />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 16 16" className={iconClass} aria-hidden="true">
      <path
        fill="currentColor"
        d="M10.1 2.1c.4 1.5 1.3 2.5 2.8 2.9v2c-1 0-1.9-.3-2.7-.8v4.1A3.5 3.5 0 1 1 7.2 7v2.1a1.5 1.5 0 1 0 1 1.4V2.1h1.9Z"
      />
    </svg>
  );
}
