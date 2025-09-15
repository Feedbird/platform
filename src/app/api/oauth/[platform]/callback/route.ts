// app/api/oauth/[platform]/callback/route.ts
import { getPlatformOperations } from '@/lib/social/platforms/index'
import { socialAccountApi } from '@/lib/api/social-accounts'

export async function GET(request: Request): Promise<Response> {
  /* --------------------- derive platform segment -------------------- */
  const { pathname, searchParams } = new URL(request.url)
  //  …/api/oauth/google/callback   →  ['','api','oauth','google','callback']
  let sp: string = pathname.split('/').at(-2) as string
  if (sp === 'googlebusiness') sp = 'google'

  /* --------------------- query-params ------------------------------ */
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const workspaceId = state?.split('workspaceId:')[1]?.split(':')[0] || state?.split('brandId:')[1]?.split(':')[0] // Support both for backward compatibility
  const method = state?.includes('method:') ? state?.split('method:')[1] : undefined
  const err  = searchParams.get('error_description') || searchParams.get('error')

  if (err || !code || !workspaceId) {
    return html(`<script>
      window.opener.postMessage({ 
        error: ${JSON.stringify(err || 'Missing parameters')}
      }, "*"); 
      window.close();
    </script>`)
  }

  try {
    // 1. Exchange code for tokens
    const ops     = getPlatformOperations(sp as any, method)!
    const account = await ops.connectAccount(code)
    const pages   = await ops.listPages(account)

    // 2. Save to database FIRST
    const savedData = await socialAccountApi.saveSocialAccount({
      workspaceId: workspaceId!,
      platform: sp,
      account,
      pages
    });

    // 3. Return success with database IDs
    return html(`<script>
      window.opener.postMessage({
        success: true,
        workspaceId: ${JSON.stringify(workspaceId)},
        accountId: ${JSON.stringify(savedData.account.id)},
        pages: ${JSON.stringify(savedData.pages)}
      }, "*");
      window.close();
    </script>`)
  } catch (e: any) {
    return html(`<script>
      window.opener.postMessage({ 
        error: ${JSON.stringify(e.message)}
      }, "*");
      window.close();
    </script>`)
  }
}

function html(body: string) {
  return new Response(body, { headers: { 'Content-Type': 'text/html' } })
}
