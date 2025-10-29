import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Public API routes that must remain unauthenticated (e.g., webhooks)
const isPublicApiRoute = createRouteMatcher([
  '/api/webhooks(.*)',
])

// Per-method rate limits per 60s window
const RATE_LIMITS_PER_MINUTE: Record<string, number> = {
  GET: 120,
  POST: 40,
  PUT: 40,
  PATCH: 40,
  DELETE: 30,
}
const WINDOW_SECONDS = 60

function parseSizeToBytes(limit: string | undefined): number {
  const fallback = 2 * 1024 * 1024 // 2MB
  if (!limit) return fallback
  const trimmed = limit.trim().toLowerCase()
  const match = trimmed.match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)?$/)
  if (!match) return fallback
  const value = parseFloat(match[1])
  const unit = match[2] || 'b'
  switch (unit) {
    case 'gb':
      return Math.floor(value * 1024 * 1024 * 1024)
    case 'mb':
      return Math.floor(value * 1024 * 1024)
    case 'kb':
      return Math.floor(value * 1024)
    default:
      return Math.floor(value)
  }
}

function getClientIp(req: Request): string {
  // Prefer x-forwarded-for, then cf-connecting-ip, then fallback
  const xff = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim()
  if (xff) return xff
  const cf = req.headers.get('cf-connecting-ip')
  if (cf) return cf
  // @ts-ignore - ip may exist on some platforms
  const direct = (req as any).ip
  if (direct) return String(direct)
  return '0.0.0.0'
}

type RateLimitResult = { success: boolean; remaining: number; reset: number }

// Upstash (if configured) or in-memory fallback
async function limitRequest(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const hasUpstash = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  if (hasUpstash) {
    try {
      // Lazy init singletons across hot reloads
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g: any = globalThis as any
      if (!g.__upstashRedis || !g.__upstashRatelimiter) {
        const { Redis } = await import('@upstash/redis')
        const { Ratelimit } = await import('@upstash/ratelimit')
        g.__upstashRedis = new Redis({
          url: process.env.KV_REST_API_URL!,
          token: process.env.KV_REST_API_TOKEN!,
        })
        g.__upstashRatelimiter = new Ratelimit({
          redis: g.__upstashRedis,
          limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
          analytics: true,
        })
      }
      const result = await g.__upstashRatelimiter.limit(key)
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
      }
    } catch {
      // Fall through to in-memory on any failure
    }
  }

  // In-memory fallback (per instance)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g: any = globalThis as any
  if (!g.__inMemoryRateBucket) {
    g.__inMemoryRateBucket = new Map<string, { count: number; windowStart: number }>()
  }
  const store: Map<string, { count: number; windowStart: number }> = g.__inMemoryRateBucket
  const now = Date.now()
  const windowStart = now - windowSeconds * 1000
  const entry = store.get(key)
  if (!entry || entry.windowStart < windowStart) {
    store.set(key, { count: 1, windowStart: now })
    return { success: true, remaining: Math.max(0, limit - 1), reset: now + windowSeconds * 1000 }
  }
  if (entry.count < limit) {
    entry.count += 1
    return { success: true, remaining: Math.max(0, limit - entry.count), reset: entry.windowStart + windowSeconds * 1000 }
  }
  return { success: false, remaining: 0, reset: entry.windowStart + windowSeconds * 1000 }
}

export default clerkMiddleware(async (auth, req) => {
  const url = (req as any).nextUrl as URL
  const pathname = url.pathname

  // Always allow CORS preflight
  if (req.method === 'OPTIONS') {
    return NextResponse.next()
  }

  // Enforce size limits based on Content-Length for mutating requests
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const maxBytes = parseSizeToBytes(process.env.API_MAX_BODY || process.env.NEXT_PUBLIC_API_MAX_BODY || '2mb')
    const contentLength = req.headers.get('content-length')
    if (contentLength) {
      const size = parseInt(contentLength, 10)
      if (!Number.isNaN(size) && size > maxBytes) {
        return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
      }
    }
  }

  // Rate limiting: key on IP + method + path
  const clientIp = getClientIp(req)
  const perMinute = RATE_LIMITS_PER_MINUTE[req.method] ?? 60
  const rateKey = `${clientIp}:${req.method}:${pathname}`
  const rl = await limitRequest(rateKey, perMinute, WINDOW_SECONDS)
  if (!rl.success) {
    const res = NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
    // Provide Retry-After in seconds when possible
    const retryAfterSeconds = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))
    res.headers.set('Retry-After', String(retryAfterSeconds))
    return res
  }

  // Require authentication for protected API routes
  if (pathname.startsWith('/api') && !isPublicApiRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}