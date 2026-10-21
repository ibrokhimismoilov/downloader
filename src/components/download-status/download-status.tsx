import type { DownloadEvent } from "@/types/media";

type Props = {
  download: DownloadEvent;
  loading: boolean;
  onReveal: () => void;
};

export function DownloadStatus({ download, loading, onReveal }: Props) {
  if (download.status === "error") return null;
  const done = download.status === "done";
  const width = done
    ? 100
    : Math.max(download.progress, download.status === "starting" ? 6 : 0);

  return (
    <div className="border-t border-line px-5 py-4">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-ink">{describeStatus(download, loading)}</span>
        <span className="font-mono text-muted">{percentLabel(download, done)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-track">
        <div
          className={`h-full rounded-full bg-[#e23b2f] transition-[width] duration-300 ${
            download.status === "merging" || download.status === "starting" ? "animate-pulse" : ""
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
      {download.status === "downloading" && (download.speed || download.eta) ? (
        <p className="mt-2 text-xs text-faint">
          {[download.speed, download.eta ? `${download.eta} qoldi` : ""].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {done && download.filename ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 truncate text-sm text-ok">{download.filename}</p>
          <button
            type="button"
            onClick={onReveal}
            className="h-10 shrink-0 rounded-full bg-[#1f6b4a] px-4 text-sm font-semibold text-white"
          >
            Faylni ko&apos;rsatish
          </button>
        </div>
      ) : null}
    </div>
  );
}

function percentLabel(download: DownloadEvent, done: boolean) {
  if (done) return "100%";
  if (download.status === "downloading") return `${Math.round(download.progress)}%`;
  return download.speed || "";
}

function describeStatus(download: DownloadEvent | null, loading: boolean) {
  if (!download) return loading ? "Ma'lumot olinmoqda" : "";
  if (download.status === "starting") return "Tayyorlanmoqda";
  if (download.status === "downloading") return "Kompyuterga yozilmoqda";
  if (download.status === "merging") return "Video va audio birlashtirilmoqda";
  if (download.status === "done") return "Tanlangan papkaga saqlandi";
  return "";
}
