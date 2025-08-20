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
  const brandId = state?.split('brandId:')[1]
  const err  = searchParams.get('error_description') || searchParams.get('error')

  if (err || !code || !brandId) {
    return html(`<script>
      window.opener.postMessage({ 
        error: ${JSON.stringify(err || 'Missing parameters')}
      }, "*"); 
      window.close();
    </script>`)
  }

  try {
    // 1. Exchange code for tokens
    const ops     = getPlatformOperations(sp as any)!
    const account = await ops.connectAccount(code)
    const pages   = await ops.listPages(account)

    // 2. Save to database FIRST
    const savedData = await socialAccountApi.saveSocialAccount({
      brandId,
      platform: sp,
      account,
      pages
    });

    // 3. Return success with database IDs
    return html(`<script>
      window.opener.postMessage({
        success: true,
        brandId: ${JSON.stringify(brandId)},
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
