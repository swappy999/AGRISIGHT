import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(_request: NextRequest) {
  // Relaxing the Auth Guard temporarily to fix the redirect loop.
  // Standard Supabase JS client uses LocalStorage which Middleware cannot read.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
