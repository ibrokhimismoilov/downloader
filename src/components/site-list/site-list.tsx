import type { CSSProperties } from "react";
import { sitePhrase, sites, type Site } from "@/lib/sites";
import { SiteIcon } from "./icons";

const tagStyle: Record<Site["id"], CSSProperties> = {
  youtube: { background: "#ff0000", color: "#ffffff" },
  vk: { background: "#0077ff", color: "#ffffff" },
  facebook: { background: "#1877f2", color: "#ffffff" },
  instagram: {
    background: "linear-gradient(90deg, #f9ce34 0%, #ee2a7b 52%, #6228d7 100%)",
    color: "#ffffff",
  },
  ok: { background: "#ee8208", color: "#ffffff" },
  tiktok: {
    background:
      "linear-gradient(#161616, #161616) padding-box, linear-gradient(90deg, #25f4ee, #fe2c55) border-box",
    color: "#ffffff",
    border: "1px solid transparent",
  },
  rutube: { background: "#100943", color: "#ffffff" },
};

export function SiteList() {
  return (
    <ul className="mt-5 flex flex-wrap gap-2">
      {sites.map((site) => (
        <li
          key={site.id}
          style={tagStyle[site.id]}
          aria-label={site.label}
          className="grid size-8 place-items-center rounded-full"
        >
          <SiteIcon id={site.id} />
        </li>
      ))}
    </ul>
  );
}

export function SiteHint() {
  return <p className="px-1 text-sm text-faint">{sitePhrase()} havolasini joylashtiring.</p>;
}
