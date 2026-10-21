export const sites = [
  {
    id: "youtube",
    label: "YouTube",
    domains: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
  },
  {
    id: "vk",
    label: "VK",
    domains: ["vk.com", "vk.ru", "vkvideo.ru", "vkontakte.ru"],
  },
  {
    id: "facebook",
    label: "Facebook",
    domains: ["facebook.com", "fb.com", "fb.watch"],
  },
  {
    id: "instagram",
    label: "Instagram",
    domains: ["instagram.com", "instagr.am"],
  },
  {
    id: "ok",
    label: "OK",
    domains: ["ok.ru", "odnoklassniki.ru"],
  },
  {
    id: "tiktok",
    label: "TikTok",
    domains: ["tiktok.com"],
  },
] as const;

export type Site = (typeof sites)[number];

export type MediaLink = {
  url: string;
  key: string;
  site: Site;
};

export type MediaUrlIssue = "empty" | "invalid" | "protocol" | "unsupported" | "incomplete";

const supportedLabels = sites.map((site) => site.label).join(", ");

export function unsupportedSiteMessage() {
  return `Hozircha ${supportedLabels} havolalari qabul qilinadi.`;
}

export function matchSite(hostname: string): Site | null {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return (
    sites.find((site) =>
      site.domains.some((domain) => host === domain || host.endsWith(`.${domain}`)),
    ) ?? null
  );
}

export function inspectMediaUrl(
  input: string,
): { ok: true; link: MediaLink } | { ok: false; reason: MediaUrlIssue } {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, reason: "empty" };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (url.username || url.password || (url.protocol !== "https:" && url.protocol !== "http:")) {
    return { ok: false, reason: "protocol" };
  }

  const site = matchSite(url.hostname);
  if (!site) return { ok: false, reason: "unsupported" };
  if (!hasVideoTarget(url, site.id)) return { ok: false, reason: "incomplete" };

  url.hash = "";
  const normalized = url.toString();
  return { ok: true, link: { url: normalized, key: normalized, site } };
}

function hasVideoTarget(url: URL, siteId: Site["id"]) {
  if (siteId === "youtube") return Boolean(youtubeId(url));
  if (siteId === "instagram") return /^\/(p|reel|reels|tv|share)\//.test(url.pathname);
  if (siteId === "facebook") {
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "fb.watch" || host.endsWith(".fb.watch")) {
      return url.pathname.replace(/\//g, "").length >= 3;
    }
    return (
      /\/(reel|reels|videos|watch|share)\b/.test(url.pathname) ||
      url.searchParams.has("v") ||
      url.searchParams.has("story_fbid")
    );
  }
  if (siteId === "vk") {
    return /video|clip|wall|video_ext/i.test(`${url.pathname}${url.search}`);
  }
  if (siteId === "ok") {
    return (
      /\/(video|videoembed|live)\b/i.test(url.pathname) ||
      url.searchParams.has("st.vpl.id")
    );
  }
  if (siteId === "tiktok") {
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "vm.tiktok.com" || host === "vt.tiktok.com") {
      return url.pathname.replace(/\//g, "").length >= 4;
    }
    return /\/video\/\d{6,}/.test(url.pathname) || /^\/t\/[\w-]+/.test(url.pathname);
  }
  return false;
}

function youtubeId(url: URL) {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return id.length >= 6 ? id : "";
  }

  if (url.pathname === "/watch") {
    const id = url.searchParams.get("v") ?? "";
    return id.length >= 6 ? id : "";
  }

  const [kind, id = ""] = url.pathname.split("/").filter(Boolean);
  if ((kind === "shorts" || kind === "embed" || kind === "live" || kind === "v") && id.length >= 6) {
    return id;
  }
  return "";
}
