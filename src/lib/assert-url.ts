import { inspectMediaUrl } from "@/lib/sites";

export function assertMediaUrl(input: string) {
  const inspected = inspectMediaUrl(input);
  if (inspected.ok) return inspected.link;

  if (inspected.reason === "protocol") {
    throw new Error("Faqat http yoki https havola qabul qilinadi.");
  }
  if (inspected.reason === "unsupported") {
    throw new Error("Hozircha {sites} havolalari qabul qilinadi.");
  }
  if (inspected.reason === "incomplete") throw new Error("Video havolasini to'liq qo'ying.");
  throw new Error("Havola noto'g'ri. To'liq video manzilini qo'ying.");
}
