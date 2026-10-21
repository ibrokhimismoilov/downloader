import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { FolderButton } from "./folder-button";
import { PlayIcon } from "./play-icon";

export function PageHeader() {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e23b2f] text-[#fff8f2] shadow-[0_8px_24px_rgba(226,59,47,0.35)]">
          <PlayIcon />
        </span>
        <span className="truncate text-sm font-semibold uppercase tracking-[0.14em] text-ink md:tracking-[0.22em]">
          Yuklab ol!
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <FolderButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
