"use client";

import { FormEvent, useEffect, useState } from "react";
import { inspectMediaUrl, sites, unsupportedSiteMessage } from "@/lib/sites";

type Quality = "best" | "1080" | "720" | "audio";

type VideoInfo = {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  views: number | null;
  source: string;
};

type DownloadEvent = {
  status: "starting" | "downloading" | "merging" | "done" | "error";
  progress: number;
  speed?: string;
  eta?: string;
  filepath?: string;
  filename?: string;
  error?: string;
};

const qualities: { id: Quality; label: string; hint: string }[] = [
  { id: "best", label: "Eng yaxshi", hint: "Mavjud eng yuqori sifat" },
  { id: "1080", label: "1080p", hint: "To'liq HD" },
  { id: "720", label: "720p", hint: "Yengilroq fayl" },
  { id: "audio", label: "MP3", hint: "Faqat ovoz" },
];

export function Downloader() {
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState<Quality>("best");
  const [loadedInfo, setLoadedInfo] = useState<{ key: string; video: VideoInfo } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [pendingKey, setPendingKey] = useState("");
  const [download, setDownload] = useState<DownloadEvent | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const videoKey = mediaKey(url);
  const info = loadedInfo?.key === videoKey ? loadedInfo.video : null;
  const infoError =
    failure?.key === videoKey ? failure.message : clientUrlMessage(url);
  const infoLoading = pendingKey === videoKey && videoKey !== "";

  useEffect(() => {
    if (!videoKey) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPendingKey(videoKey);
      setFailure((current) => (current?.key === videoKey ? null : current));
      try {
        const response = await fetch("/api/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
          signal: controller.signal,
        });
        const data = await readJson<VideoInfo & { error?: string }>(response);
        if (!response.ok || !data?.id) throw new Error(data?.error || "Video topilmadi.");
        setLoadedInfo({ key: videoKey, video: data });
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadedInfo(null);
        setFailure({
          key: videoKey,
          message: error instanceof Error ? error.message : "Video topilmadi.",
        });
      } finally {
        if (!controller.signal.aborted) {
          setPendingKey((current) => (current === videoKey ? "" : current));
        }
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [videoKey, url]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!videoKey || busy) return;

    setBusy(true);
    setDownloadError(null);
    setDownload({ status: "starting", progress: 0 });

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), quality }),
      });

      if (!response.ok || !response.body) {
        const data = await readJson<{ error?: string }>(response);
        throw new Error(data?.error || "Yuklab olish boshlanmadi.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as DownloadEvent;
          if (event.status === "error") {
            setDownload(null);
            setDownloadError(event.error || "Video yuklanmadi.");
          } else {
            setDownload(event);
          }
        }
      }
    } catch (error) {
      setDownload(null);
      setDownloadError(error instanceof Error ? error.message : "Video yuklanmadi.");
    } finally {
      setBusy(false);
    }
  }

  async function reveal() {
    if (!download?.filepath) return;
    const response = await fetch("/api/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filepath: download.filepath }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setDownloadError(data?.error || "Faylni Finderda ochib bo'lmadi.");
    }
  }

  const done = download?.status === "done";
  const statusText = describeStatus(download, infoLoading);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-[#e23b2f]/20 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-[#d4a85c]/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-[#e23b2f] text-[#fff8f2] shadow-[0_8px_24px_rgba(226,59,47,0.35)]">
              <PlayIcon />
            </span>
            <span className="text-[13px] font-semibold tracking-[0.22em] text-[#f6f1e8]">
              YUKLAB OLISH
            </span>
          </div>
          <span className="text-sm text-[#cbbba6]">Downloads papkasi</span>
        </header>

        <main className="flex flex-1 flex-col justify-center py-14 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#e7b2a8]">
            Video havolasi
          </p>
          <h1 className="mt-3 max-w-xl font-serif text-5xl leading-[1.05] text-[#f6f1e8] sm:text-6xl">
            Video shu kompyuterga tushadi.
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#cbbba6]">
            Havolani qo&apos;ying. Tanlangan sifatdagi fayl sizning Downloads
            papkangizga saqlanadi.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {sites.map((site) => (
              <li
                key={site.id}
                className="rounded-full border border-white/10 px-3 py-1 text-xs tracking-wide text-[#cbbba6]"
              >
                {site.label}
              </li>
            ))}
          </ul>

          <form onSubmit={onSubmit} className="mt-10">
            <label className="block" htmlFor="media-url">
              <span className="sr-only">Video havolasi</span>
              <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-[#1c1815]/90 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur sm:flex-row sm:items-center">
                <input
                  id="media-url"
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    setDownload(null);
                    setDownloadError(null);
                  }}
                  disabled={busy}
                  placeholder="https://..."
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  inputMode="url"
                  className="h-14 w-full bg-transparent px-4 text-base text-[#f6f1e8] outline-none placeholder:text-[#8d8276] disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!videoKey || busy}
                  className="h-14 shrink-0 rounded-[22px] bg-[#f3ecdf] px-6 text-base font-semibold text-[#1a1410] transition hover:bg-white disabled:cursor-not-allowed disabled:bg-[#3a332d] disabled:text-[#8d8276]"
                >
                  {busy ? "Saqlanmoqda" : "Yuklab olish"}
                </button>
              </div>
            </label>

            {infoError && !infoLoading ? (
              <p className="mt-3 px-4 text-sm text-[#ffb4a8]" role="alert">
                {infoError}
              </p>
            ) : null}
            {downloadError ? (
              <p className="mt-3 px-4 text-sm text-[#ffb4a8]" role="alert">
                {downloadError}
              </p>
            ) : null}
          </form>

          <section className="mt-6" aria-live="polite">
            {info || infoLoading || download ? (
              <div className="rise overflow-hidden rounded-[28px] border border-white/10 bg-[#1c1815]/80">
                <div className="grid gap-5 p-4 sm:grid-cols-[220px_1fr] sm:p-5">
                  <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#2a241f] sm:aspect-auto sm:h-full sm:min-h-36">
                    {info?.thumbnail ? (
                      // Thumbnails are remote images chosen by the video site.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={info.thumbnail}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full min-h-36 place-items-center text-sm text-[#8d8276]">
                        {infoLoading ? "Ko'rinish olinmoqda" : "Video"}
                      </div>
                    )}
                    {info?.duration ? (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-1 text-xs font-medium text-white">
                        {info.duration}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex min-w-0 flex-col">
                    <h2 className="truncate font-serif text-2xl text-[#f6f1e8]">
                      {info?.title || (infoLoading ? "Video qidirilmoqda…" : "Video")}
                    </h2>
                    <p className="mt-1 truncate text-sm text-[#cbbba6]">
                      {[info?.channel, info?.source, formatViews(info?.views)]
                        .filter((part, index, parts) => Boolean(part) && parts.indexOf(part) === index)
                        .join(" · ") || "Video"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Sifat">
                      {qualities.map((item) => {
                        const selected = quality === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={busy}
                            onClick={() => setQuality(item.id)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-60 ${
                              selected
                                ? "border-[#f3ecdf] bg-[#f3ecdf] text-[#1a1410]"
                                : "border-white/15 text-[#f6f1e8] hover:border-white/30"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-[#8d8276]">
                      {qualities.find((item) => item.id === quality)?.hint}
                    </p>
                  </div>
                </div>

                {download && download.status !== "error" ? (
                  <div className="border-t border-white/10 px-5 py-4">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#f6f1e8]">{statusText}</span>
                      <span className="font-mono text-[#cbbba6]">
                        {done
                          ? "100%"
                          : download.status === "downloading"
                            ? `${Math.round(download.progress)}%`
                            : download.speed || ""}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full bg-[#e23b2f] transition-[width] duration-300 ${
                          download.status === "merging" || download.status === "starting"
                            ? "animate-pulse"
                            : ""
                        }`}
                        style={{
                          width: `${done ? 100 : Math.max(download.progress, download.status === "starting" ? 6 : 0)}%`,
                        }}
                      />
                    </div>
                    {download.status === "downloading" && (download.speed || download.eta) ? (
                      <p className="mt-2 text-xs text-[#8d8276]">
                        {[download.speed, download.eta ? `${download.eta} qoldi` : ""]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                    {done && download.filename ? (
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="min-w-0 truncate text-sm text-[#d7efe4]">{download.filename}</p>
                        <button
                          type="button"
                          onClick={reveal}
                          className="h-10 shrink-0 rounded-full bg-[#1f6b4a] px-4 text-sm font-semibold text-white"
                        >
                          Finderda ko&apos;rsatish
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : infoError ? null : (
              <p className="px-1 text-sm text-[#8d8276]">
                {siteHint()} havolasini joylashtiring.
              </p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function describeStatus(download: DownloadEvent | null, infoLoading: boolean) {
  if (!download) return infoLoading ? "Ma'lumot olinmoqda" : "";
  if (download.status === "starting") return "Tayyorlanmoqda";
  if (download.status === "downloading") return "Kompyuterga yozilmoqda";
  if (download.status === "merging") return "Video va audio birlashtirilmoqda";
  if (download.status === "done") return "Downloads papkasiga saqlandi";
  return "";
}

function formatViews(views: number | null | undefined) {
  if (views == null) return null;
  return `${new Intl.NumberFormat("uz-UZ").format(views)} marta ko'rilgan`;
}

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function siteHint() {
  const labels = sites.map((site) => site.label);
  const last = labels[labels.length - 1];
  return `${labels.slice(0, -1).join(", ")} yoki ${last}`;
}

function clientUrlMessage(input: string) {
  const inspected = inspectMediaUrl(input);
  if (inspected.ok || inspected.reason === "empty" || inspected.reason === "invalid") return null;
  if (inspected.reason === "incomplete") return null;
  if (inspected.reason === "protocol") return "Faqat http yoki https havola qabul qilinadi.";
  return unsupportedSiteMessage();
}

function mediaKey(input: string) {
  const inspected = inspectMediaUrl(input);
  return inspected.ok ? inspected.link.key : "";
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M4 2.4v9.2l8-4.6-8-4.6Z" fill="currentColor" />
    </svg>
  );
}
