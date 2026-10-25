import { NextResponse, type NextRequest } from "next/server";

// A quick first check that runs before every page and API request:
// if there's no session cookie at all, there's no point rendering the page.
//
// This is only an *optimistic* check (the cookie could be fake or expired).
// The real check happens in lib/auth.ts, which every page, Server Action and
// API route calls before reading or changing data.
const SESSION_COOKIE = "clinic_session";
const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  if (!request.cookies.has(SESSION_COOKIE)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
