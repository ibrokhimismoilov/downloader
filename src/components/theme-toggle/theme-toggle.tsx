"use client";

import { useTheme } from "./hooks/use-theme";
import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggle() {
  const { light, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Qorong'i rejim" : "Yorug' rejim"}
      aria-pressed={light}
      className="grid size-9 place-items-center rounded-full border border-line text-ink transition hover:border-line-strong"
    >
      {light ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
