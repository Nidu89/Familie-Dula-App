import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Whitelist oeffentlicher Routen (BUG-19/PROJ-1: Whitelist statt Blacklist)
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/auth',
  '/onboarding',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Session refreshen – wichtig: kein Code zwischen createServerClient und getUser
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 1. Nicht eingeloggt → Login (ausser oeffentliche Routen)
  if (!user && !isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Eingeloggt, E-Mail nicht bestaetigt → Login
  if (user && !user.email_confirmed_at && !isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && user.email_confirmed_at) {
    // 3. Family-Check (BUG-4/PROJ-1)
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('user_id', user.id)
      .single()

    const hasFamiliy = !!profile?.family_id

    // Eingeloggt ohne Familie → /onboarding (ausser bereits dort)
    if (!hasFamiliy && !pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Eingeloggt mit Familie auf oeffentlicher/onboarding Route → /dashboard
    if (hasFamiliy && isPublicRoute(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
