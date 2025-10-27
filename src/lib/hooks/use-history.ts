'use client'
import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(url).then(async r => {
    const ct = r.headers.get('content-type') || ''
    if (!ct.includes('application/json'))
      throw new Error(`expected JSON from ${url}, got ${ct}`)
    return r.json()
  })

export function useHistory(platform = '') {
  const { data, error, isLoading } = useSWR(
    `/api/ayrshare/history${platform ? `?platform=${platform}` : ''}`,
    fetcher,
  )
  return {
    posts    : (data ?? []) as Awaited<ReturnType<typeof fetcher>>,
    isError  : !!error,
    isLoading,
  }
}
