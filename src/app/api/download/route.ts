import {
  cleanYtError,
  downloadVideo,
  isQuality,
  type DownloadEvent,
} from "@/lib/youtube";

export async function POST(request: Request) {
  const body = await readJson(request);
  const url = typeof body?.url === "string" ? body.url : "";
  const quality = isQuality(body?.quality) ? body.quality : "best";
  const encoder = new TextEncoder();
  const abort = new AbortController();
  if (request.signal.aborted) abort.abort();
  else request.signal.addEventListener("abort", () => abort.abort(), { once: true });

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: DownloadEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          closed = true;
        }
      };

      try {
        await downloadVideo(url, quality, send, abort.signal);
      } catch (error) {
        const message =
          error instanceof Error ? cleanYtError(error.message) : "Video yuklanmadi.";
        send({ status: "error", progress: 0, error: message });
      } finally {
        if (!closed) {
          try {
            controller.close();
          } catch {
            closed = true;
          }
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

async function readJson(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return null;
    return body as { url?: unknown; quality?: unknown };
  } catch {
    return null;
  }
}
