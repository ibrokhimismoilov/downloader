"use client";

import { FormEvent, useState } from "react";
import type { QualityId } from "@/types/media";
import { UrlForm } from "@/components/url-form/url-form";
import { useDownload } from "./hooks/use-download";
import { useVideoInfo } from "./hooks/use-video-info";
import { VideoCard } from "../video-card/video-card";
import { SiteHint, SiteList } from "../site-list/site-list";
import { PageHeader } from "../page-header/page-header";

export function Downloader() {
  const [url, setUrl] = useState("");
  const [quality, setQuality] = useState<QualityId>("best");
  const [subtitles, setSubtitles] = useState(false);
  const info = useVideoInfo(url);
  const transfer = useDownload();
  const showCard = Boolean(info.info || info.loading || transfer.download);

  function onUrlChange(next: string) {
    setUrl(next);
    transfer.reset();
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!info.videoKey || transfer.busy) return;
    void transfer.start(url, quality, subtitles);
  }

  function onReset() {
    const searching = info.loading;
    transfer.reset();
    if (searching) info.restart();
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-glow-red blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-glow-gold blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-6 md:px-8 md:py-8">
        <PageHeader />
        <main className="flex flex-1 flex-col justify-center py-8 md:py-14 lg:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-eyebrow md:text-sm md:tracking-[0.18em]">
            Video havolasi
          </p>
          <h1 className="mt-3 max-w-xl font-bold text-2xl leading-[1.08] text-ink md:text-3xl lg:text-4xl">
            Video shu kompyuterga tushadi.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted md:text-lg">
            Havolani qo&apos;ying. Tanlangan sifatdagi fayl yuqorida tanlagan papkangizga saqlanadi.
          </p>
          <SiteList />
          <UrlForm
            url={url}
            busy={transfer.busy}
            canSubmit={Boolean(info.videoKey)}
            infoError={info.error}
            downloadError={transfer.error}
            showInfoError={!info.loading}
            showReset={info.loading || transfer.busy}
            onUrlChange={onUrlChange}
            onReset={onReset}
            onSubmit={onSubmit}
          />
          <section className="mt-6" aria-live="polite">
            {showCard ? (
              <VideoCard
                info={info.info}
                loading={info.loading}
                quality={quality}
                busy={transfer.busy}
                download={transfer.download}
                subtitles={subtitles}
                onQuality={setQuality}
                onSubtitles={setSubtitles}
                onReveal={() => void transfer.reveal()}
              />
            ) : info.error ? null : (
              <SiteHint />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
