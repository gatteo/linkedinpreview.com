import { type NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - ingest (PostHog proxy)
         * - favicon.ico, sitemap.xml, robots.txt
         * - common static file extensions
         */
        '/((?!_next/static|_next/image|ingest|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
    ],
}
