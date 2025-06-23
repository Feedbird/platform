import { NextResponse } from 'next/server';
import { LinkedInPlatform } from '@/lib/social/platforms/linkedin';
import type { SocialPage } from '@/lib/social/platforms/platform-types';

export async function POST(req: Request) {
  try {
    // Note: In a real app, you would get these from a secure config store
    // based on the authenticated user's credentials.
    const env = {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirectUri: process.env.LINKEDIN_REDIRECT_URI || '',
    };

    if (!env.clientId || !env.clientSecret) {
      throw new Error('LinkedIn API credentials are not configured.');
    }

    const { page, limit } = (await req.json()) as { page: SocialPage; limit?: number };

    if (!page) {
      return NextResponse.json({ error: 'Page data is required' }, { status: 400 });
    }

    const linkedin = new LinkedInPlatform(env);
    const history = await linkedin.getPostHistory(page, limit);

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('[API/LINKEDIN/HISTORY]', error);
    return NextResponse.json(
      { error: 'Failed to fetch LinkedIn post history', details: error.message },
      { status: 500 }
    );
  }
} 