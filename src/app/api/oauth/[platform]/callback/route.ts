// app/api/oauth/[platform]/callback/route.ts
import { getPlatformOperations } from '@/lib/social/platforms/index'

export async function GET(request: Request): Promise<Response> {
  /* --------------------- derive platform segment -------------------- */
  const { pathname, searchParams } = new URL(request.url)
  //  …/api/oauth/google/callback   →  ['','api','oauth','google','callback']
  let sp: string = pathname.split('/').at(-2) as string
  if (sp === 'googlebusiness') sp = 'google'

  /* --------------------- query-params ------------------------------ */
  const code = searchParams.get('code')
  const err  = searchParams.get('error_description') || searchParams.get('error')

  if (err || !code) {
    return html(`<script>
      window.opener.postMessage({ error: ${JSON.stringify(err)} }, "*"); window.close();
    </script>`)
  }

  try {
    const ops     = getPlatformOperations(sp as any)!
    const account = await ops.connectAccount(code)
    const pages   = await ops.listPages(account)

    return html(`<script>
      window.opener.postMessage({
        platform : ${JSON.stringify(sp)},
        account  : ${JSON.stringify(account)},
        pages    : ${JSON.stringify(pages)},
        empty    : ${pages.length === 0}
      }, "*"); window.close();
    </script>`)
  } catch (e: any) {
    return html(`<script>
      window.opener.postMessage({ error: ${JSON.stringify(e.message)} }, "*"); window.close();
    </script>`)
  }
}

function html(body: string) {
  return new Response(body, { headers: { 'Content-Type': 'text/html' } })
}
