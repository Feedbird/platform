import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export interface AuthenticatedRequest extends NextRequest {
  userId: string;
}

export type AuthHandler = (req: AuthenticatedRequest) => Promise<NextResponse>;

/**
 * Middleware to authenticate API requests
 * @param handler The API handler function
 * @returns Wrapped handler with authentication
 */
export function withAuth(handler: AuthHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Authenticate user
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // 2. Add userId to request object
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.userId = userId;

      // 3. Call the original handler
      return await handler(authenticatedReq);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}
