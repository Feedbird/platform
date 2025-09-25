import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const target = req.nextUrl.searchParams.get("url");
    if (!target) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    // Forward Range for video streaming support
    const range = req.headers.get('range') || undefined;
    const headers: Record<string, string> = {};
    if (range) headers['Range'] = range;

    const upstream = await fetch(target, {
      cache: "no-store",
      headers,
    });

    // Relay upstream status (200/206) and headers including content-range, length, type
    const passthroughHeaders: Record<string, string> = {};
    const copyHeader = (name: string) => {
      const v = upstream.headers.get(name);
      if (v) passthroughHeaders[name] = v;
    };
    copyHeader('content-type');
    copyHeader('content-length');
    copyHeader('content-range');
    copyHeader('accept-ranges');
    passthroughHeaders['Cache-Control'] = 'public, max-age=31536000, immutable';

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: passthroughHeaders,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Proxy error", message: e?.message || "unknown" },
      { status: 500 }
    );
  }
}


