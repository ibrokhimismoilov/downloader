import { inspectMediaUrl } from "@/lib/sites";

export function mediaKey(input: string) {
  const inspected = inspectMediaUrl(input);
  return inspected.ok ? inspected.link.key : "";
}

export function clientUrlMessage(input: string) {
  const inspected = inspectMediaUrl(input);
  if (inspected.ok || inspected.reason === "empty" || inspected.reason === "invalid") {
    return null;
  }
  if (inspected.reason === "incomplete") return null;
  if (inspected.reason === "protocol") return "Faqat http yoki https havola qabul qilinadi.";
  return "Hozircha {sites} havolalari qabul qilinadi.";
}

export async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
