export function cleanYtError(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const errorLine = [...lines].reverse().find((line) => line.startsWith("ERROR:"));
  const message = (errorLine ?? lines.at(-1) ?? "Video yuklanmadi.").replace(/^ERROR:\s*/, "");

  if (/unsupported version of python/i.test(message)) {
    return "yt-dlp ishga tushmadi. `npm install` ni qayta ishga tushiring.";
  }
  if (/connection reset|timed out|network is unreachable|unable to download|failed to establish|nodename nor servname/i.test(message)) {
    return "Sayt bilan aloqa uzildi. Internetda bu sayt ochilishini tekshiring va qayta urinib ko'ring.";
  }
  if (/login required|cookies|sign in|private video|video unavailable|not available/i.test(message)) {
    return "Bu video yopiq yoki hisob talab qiladi. Ommaviy havolani qo'ying.";
  }
  if (/live event|is live/i.test(message)) return "Jonli efirni yuklab bo'lmaydi.";

  return message;
}
