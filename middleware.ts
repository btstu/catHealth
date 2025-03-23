import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;
  
  // Clone the request headers to pass to the supabase client
  const cookieStore = cookies();
  
  // Create a response
  const response = NextResponse.next();
  
  // Skip the middleware if this isn't an auth page
  if (!pathname.startsWith('/diagnose')) {
    return response;
  }

  try {
    // Create a Supabase client
    const supabase = createClient(cookieStore);
    
    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if user is authenticated
    if (!session) {
      // If no session, redirect to login
      const redirectUrl = new URL('/signin', request.url);
      redirectUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Allow the request to continue
    return response;
  } catch (e) {
    // If there's an error, redirect to login
    console.error('Auth error:', e);
    const redirectUrl = new URL('/signin', request.url);
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: ['/diagnose/:path*'],
}; 