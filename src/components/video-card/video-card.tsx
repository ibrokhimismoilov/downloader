"use client";

import type { DownloadEvent, QualityId, VideoInfo } from "@/types/media";
import { DownloadStatus } from "@/components/download-status/download-status";

type Props = {
  info: VideoInfo | null;
  loading: boolean;
  quality: QualityId;
  busy: boolean;
  download: DownloadEvent | null;
  onQuality: (quality: QualityId) => void;
  onReveal: () => void;
};

export function VideoCard({ info, loading, quality, busy, download, onQuality, onReveal }: Props) {
  const views =
    info?.views == null
      ? null
      : `${new Intl.NumberFormat("uz-UZ").format(info.views)} marta ko'rilgan`;
  const meta = [info?.channel, info?.source, views]
    .filter((part, index, parts) => Boolean(part) && parts.indexOf(part) === index)
    .join(" · ");

  return (
    <div className="rise panel-shadow overflow-hidden rounded-[28px] border border-line bg-surface">
      <div className="grid gap-5 p-4 sm:grid-cols-[220px_1fr] sm:p-5">
        <Thumbnail info={info} loading={loading} />
        <div className="flex min-w-0 flex-col">
          <h2 className="truncate font-serif text-xl text-ink md:text-2xl">
            {info?.title || (loading ? "Video qidirilmoqda…" : "Video")}
          </h2>
          <p className="mt-1 truncate text-sm text-muted">{meta || "Video"}</p>
          <QualityPicker quality={quality} busy={busy} onQuality={onQuality} />
        </div>
      </div>
      {download ? <DownloadStatus download={download} loading={loading} onReveal={onReveal} /> : null}
    </div>
  );
}

function Thumbnail({ info, loading }: { info: VideoInfo | null; loading: boolean }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-thumb sm:aspect-auto sm:h-full sm:min-h-36">
      {info?.thumbnail ? (
        // Thumbnails are remote images chosen by the video site.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={info.thumbnail} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full min-h-36 place-items-center text-sm text-faint">
          {loading ? "Ko'rinish olinmoqda" : "Video"}
        </div>
      )}
      {info?.duration ? (
        <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-1 text-xs font-medium text-white">
          {info.duration}
        </span>
      ) : null}
    </div>
  );
}

function QualityPicker({
  quality,
  busy,
  onQuality,
}: {
  quality: QualityId;
  busy: boolean;
  onQuality: (quality: QualityId) => void;
}) {
  const options = [
    { id: "best" as const, label: "Eng yaxshi", hint: "Mavjud eng yuqori sifat" },
    { id: "1080" as const, label: "1080p", hint: "To'liq HD" },
    { id: "720" as const, label: "720p", hint: "Yengilroq fayl" },
    { id: "audio" as const, label: "MP3", hint: "Faqat ovoz" },
  ];
  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Sifat">
        {options.map((item) => {
          const selected = quality === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={busy}
              onClick={() => onQuality(item.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-60 ${
                selected
                  ? "border-button bg-button text-button-ink"
                  : "border-line-strong text-ink hover:border-ink"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-faint">
        {options.find((item) => item.id === quality)?.hint}
      </p>
    </>
  );
}
