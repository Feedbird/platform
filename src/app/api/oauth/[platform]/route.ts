// app/api/oauth/[platform]/route.ts
import { getPlatformOperations } from '@/lib/social/platforms/index'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const platform = pathSegments[pathSegments.length - 1] as string;
  const brandId = searchParams.get('brandId'); // Get brandId from query params

  if (!brandId) {
    return new Response('Brand ID is required', { status: 400 });
  }

  const ops = getPlatformOperations(platform as any);
  if (!ops) return new Response('Unsupported platform', { status: 404 });

  // Include brandId in state parameter
  const authUrl = ops.getAuthUrl() + `&state=brandId:${brandId}`;
  return Response.redirect(authUrl, 302);
}
