import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = url.pathname.replace(/^\/(uz|ru|en)(?=\/|$)/, "") || "/";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/uz", "/uz/:path*", "/ru", "/ru/:path*", "/en", "/en/:path*"],
};
