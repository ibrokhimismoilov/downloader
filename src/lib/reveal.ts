import { spawn } from "node:child_process";
import { assertUserFile } from "@/lib/save-folder";

export function revealInFinder(filepath: string) {
  const resolved = assertUserFile(filepath);
  if (process.platform === "win32") {
    spawn("explorer", [`/select,${resolved}`], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  spawn("open", ["-R", resolved], { detached: true, stdio: "ignore" }).unref();
}
