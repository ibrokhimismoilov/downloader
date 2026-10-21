import path from "node:path";
import { pickSaveDir } from "@/lib/save-folder";

export async function POST() {
  try {
    const dir = await pickSaveDir();
    if (!dir) return Response.json({ cancelled: true });
    return Response.json({ path: dir, name: path.basename(dir) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Papka tanlanmadi.";
    return Response.json({ error: message }, { status: 400 });
  }
}
