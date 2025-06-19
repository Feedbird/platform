// app/api/oauth/[platform]/route.ts
import { getPlatformOperations } from '@/lib/social/platforms/index'

export async function GET(request: Request): Promise<Response> {
  /* platform is the last segment before this route file */
  const platform = request.url.split('/').at(-1) as string

  const ops = getPlatformOperations(platform as any)
  if (!ops) return new Response('Unsupported platform', { status: 404 })

  return Response.redirect(ops.getAuthUrl(), 302)
}
