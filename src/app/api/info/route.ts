import { cleanYtError, getVideoInfo } from "@/lib/youtube";

export async function POST(request: Request) {
  const body = await readJson(request);
  const url = typeof body?.url === "string" ? body.url : "";

  try {
    const info = await getVideoInfo(url);
    return Response.json(info);
  } catch (error) {
    const message = error instanceof Error ? cleanYtError(error.message) : "Video topilmadi.";
    return Response.json({ error: message }, { status: 400 });
  }
}

async function readJson(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return null;
    return body as { url?: unknown; quality?: unknown; filepath?: unknown };
  } catch {
    return null;
  }
}
