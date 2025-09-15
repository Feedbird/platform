// app/api/oauth/[platform]/route.ts
import { getPlatformOperations } from '@/lib/social/platforms/index'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const platform = pathSegments[pathSegments.length - 1] as string;
  const workspaceId = searchParams.get('workspaceId') || searchParams.get('brandId'); // Support both for backward compatibility
  const method = searchParams.get('method'); // Get connection method from query params

  if (!workspaceId) {
    return new Response('Workspace ID is required', { status: 400 });
  }

  const ops = getPlatformOperations(platform as any, method || undefined);
  if (!ops) return new Response('Unsupported platform', { status: 404 });

  // Include workspaceId and method in state parameter
  const state = method ? `workspaceId:${workspaceId}:method:${method}` : `workspaceId:${workspaceId}`;
  const authUrl = ops.getAuthUrl() + `&state=${state}`;
  return Response.redirect(authUrl, 302);
}
