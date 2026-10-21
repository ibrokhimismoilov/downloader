import { revealInFinder } from "@/lib/youtube";

export async function POST(request: Request) {
  let filepath = "";
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "filepath" in body) {
      filepath = String((body as { filepath: unknown }).filepath ?? "");
    }
  } catch {
    return Response.json({ error: "So'rov noto'g'ri." }, { status: 400 });
  }

  try {
    revealInFinder(filepath);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fayl ochilmadi.";
    return Response.json({ error: message }, { status: 400 });
  }
}
