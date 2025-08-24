import { NextRequest, NextResponse } from 'next/server'
import { 
  checkRateLimit, 
  getCorsHeaders, 
  createErrorResponse,
  validateApiKey 
} from '@/lib/api-utils'

/**
 * API Middleware for SEI DLP Core
 * Handles CORS, rate limiting, authentication, and error handling
 */
export async function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: getCorsHeaders()
    })
  }

  // Skip middleware for health check
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.next()
  }

  // Rate limiting
  if (!checkRateLimit(request)) {
    return createErrorResponse(
      'Rate limit exceeded. Please try again later.',
      429,
      { 
        limit: 100,
        window: '1 minute',
        suggestion: 'Consider implementing request batching or caching'
      }
    )
  }

  // API key validation (optional for public endpoints)
  const isPublicEndpoint = isPublicPath(request.nextUrl.pathname)
  if (!isPublicEndpoint && !validateApiKey(request)) {
    return createErrorResponse(
      'Invalid or missing API key',
      401,
      { 
        hint: 'Include X-API-Key header with your request',
        documentation: '/docs/authentication'
      }
    )
  }

  // Add CORS headers to all responses
  const response = NextResponse.next()
  Object.entries(getCorsHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Check if endpoint is public (doesn't require API key)
 */
function isPublicPath(pathname: string): boolean {
  const publicPaths = [
    '/api/health',
    '/api/market/data', // Market data can be public
    '/api/vaults', // Vault listing can be public
  ]
  
  return publicPaths.some(path => pathname.startsWith(path))
}

/**
 * Configure middleware to run on API routes
 */
export const config = {
  matcher: '/api/:path*'
}
