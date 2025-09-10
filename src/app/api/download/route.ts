export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const filename = searchParams.get('filename') || 'attachment';
    const contentTypeOverride = searchParams.get('contentType') || undefined;

    if (!url) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Basic safety: only allow http(s)
    if (!/^https?:\/\//i.test(url)) {
      return new Response('Invalid url', { status: 400 });
    }

    const upstream = await fetch(url, { cache: 'no-store' });
    if (!upstream.ok || !upstream.body) {
      return new Response('Failed to fetch resource', { status: 502 });
    }

    const contentType = contentTypeOverride || upstream.headers.get('content-type') || 'application/octet-stream';

    // Stream response to client with attachment headers
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response('Server error', { status: 500 });
  }
}


