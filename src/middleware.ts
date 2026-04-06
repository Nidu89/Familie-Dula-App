import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Whitelist oeffentlicher Routen (BUG-19/PROJ-1: Whitelist statt Blacklist)
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/auth',
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
    // Optimization: cache family status in cookie to skip DB query on subsequent requests
    const familyCookie = request.cookies.get('x-has-family')?.value

    let hasFamily: boolean

    if (familyCookie === '1' || familyCookie === '0') {
      hasFamily = familyCookie === '1'
    } else {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('[middleware] profile query failed:', profileError.message)
      }

      hasFamily = !!profile?.family_id

      // Cache result for 1 hour
      supabaseResponse.cookies.set('x-has-family', hasFamily ? '1' : '0', {
        maxAge: 3600,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    }

    // Eingeloggt ohne Familie → /onboarding (ausser bereits dort)
    if (!hasFamily && !pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Eingeloggt mit Familie auf oeffentlicher/onboarding Route → /dashboard
    if (hasFamily && (isPublicRoute(pathname) || pathname.startsWith('/onboarding'))) {
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
