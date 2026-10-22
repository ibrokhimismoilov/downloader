export type QualityId = "best" | "1080" | "720" | "audio";

export type VideoInfo = {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  views: number | null;
  source: string;
};

export type DownloadEvent = {
  status: "starting" | "downloading" | "merging" | "done" | "error";
  progress: number;
  speed?: string;
  eta?: string;
  downloaded?: string;
  total?: string;
  startedAt?: string;
  filepath?: string;
  filename?: string;
  error?: string;
};
