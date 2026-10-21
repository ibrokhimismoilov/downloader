"use client";

import { FormEvent } from "react";
import { siteNames } from "@/lib/sites";

type Props = {
  url: string;
  busy: boolean;
  canSubmit: boolean;
  infoError: string | null;
  downloadError: string | null;
  showInfoError: boolean;
  onUrlChange: (url: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export function UrlForm({
  url,
  busy,
  canSubmit,
  infoError,
  downloadError,
  showInfoError,
  onUrlChange,
  onSubmit,
}: Props) {
  const names = siteNames();
  const infoText = infoError?.replaceAll("{sites}", names) ?? "";
  const downloadText = downloadError?.replaceAll("{sites}", names) ?? "";

  return (
    <form onSubmit={onSubmit} className="mt-10">
      <label className="block" htmlFor="media-url">
        <span className="sr-only">Video havolasi</span>
        <div className="panel-shadow flex flex-col gap-3 rounded-[28px] border border-line bg-surface p-2 backdrop-blur sm:flex-row sm:items-center">
          <input
            id="media-url"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            disabled={busy}
            placeholder="https://..."
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            inputMode="url"
            className="h-14 w-full min-w-0 bg-transparent px-4 text-base text-ink outline-none placeholder:text-faint disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!canSubmit || busy}
            className="h-14 shrink-0 rounded-[22px] bg-button px-6 text-base font-semibold text-button-ink transition hover:bg-button-hover disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-ink"
          >
            {busy ? "Saqlanmoqda" : "Yuklab olish"}
          </button>
        </div>
      </label>
      {showInfoError && infoText ? <Alert>{infoText}</Alert> : null}
      {downloadText ? <Alert>{downloadText}</Alert> : null}
    </form>
  );
}

function Alert({ children }: { children: string }) {
  return (
    <p className="mt-3 px-4 text-sm text-danger" role="alert">
      {children}
    </p>
  );
}
