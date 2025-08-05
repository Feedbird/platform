'use client'

import { useState, useMemo, Suspense } from 'react'
import { Users, FileText, Eye, MousePointerClick, BarChart2 } from 'lucide-react'
import { format, addDays, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { InfoAlert } from '@/components/analytics/info-alert'
import { MetricCard, MetricData } from '@/components/analytics/metric-card'
import { MetricChart } from '@/components/analytics/metric-chart'
import { TopPostCard, TopPost } from '@/components/analytics/top-post-card'
import { ContentTable } from '@/components/analytics/content-table'
import type { Metric } from '@/components/analytics/metric-card'
import { DynamicTitle } from '@/components/layout/dynamic-title'

export default function AnalyticsPage() {
  const [showAlert] = useState(true)
  const [activeMetric, setActiveMetric] = useState<Metric>('followers')
  const [topMode, setTopMode] = useState<'impressions' | 'engagement'>('impressions')

  const rawMetrics: MetricData[] = useMemo(
    () => [
      {
        metric: 'followers',
        label: 'Followers',
        icon: Users,
        value: 226,
        description: 'The total number of followers of your Page. This is calculated as the number of follows minus the number of unfollows over the lifetime of your Page.',
      },
      {
        metric: 'posts',
        label: 'Posts',
        icon: FileText,
        value: 58,
        description: 'The number of posts you published in the selected time range.',
      },
      {
        metric: 'impressions',
        label: 'Impressions',
        icon: Eye,
        value: 73400,
        description: 'How many times your content was seen: posts, stories, ads, as well as other info on your Page.',
      },
      {
        metric: 'engagement',
        label: 'Engagement',
        icon: MousePointerClick,
        value: 4060,
        description: 'Number of times people engaged (reactions, comments, shares, clicks).',
      },
      {
        metric: 'views',
        label: 'Page views',
        icon: BarChart2,
        value: 28200,
        description: 'The number of times your Page\'s profile has been viewed by both logged-in and logged-out people.',
      },
    ],
    []
  )

  const metricDiffs = useMemo(() => {
    return rawMetrics.map(() => {
      const sign = Math.random() > 0.5 ? 1 : -1
      return sign * Math.floor(Math.random() * 50)
    })
  }, [rawMetrics])

  const chartData = useMemo(() => {
    const startDate = new Date(2025, 3, 20)
    const arr: { day: string; value: number }[] = []
    for (let i = 0; i < 30; i++) {
      const d = addDays(startOfDay(startDate), i)
      arr.push({
        day: format(d, 'MMM d'),
        value: Math.floor(Math.random() * 100),
      })
    }
    return arr
  }, [])

  const topPosts: TopPost[] = [
    {
      id: 't1',
      caption: 'Our newest watermelon flavor is simply hypnotic! #JuscoSmoothies 🍉',
      imgUrl: 'https://media2.giphy.com/media/l0ExuOAGoJ9MdBeTe/giphy.gif',
      video: true,
      date: 'May 18, 2025',
      impressions: 9770,
      engagement: 886,
      plays: 0,
      reacts: 118,
      comments: 221,
      shares: 55,
    },
    {
      id: 't2',
      caption: 'Open. 🍋  Sip. 🍊 Smile. 😀  Repeat.',
      imgUrl: 'https://farm3.staticflickr.com/2220/1572613671_7311098b76_z_d.jpg',
      video: false,
      date: 'May 18, 2025',
      impressions: 8240,
      engagement: 1630,
      plays: 0,
      reacts: 164,
      comments: 932,
      shares: 45,
    },
    {
      id: 't3',
      caption: 'Jusco Pineapple Queen 🍍 - #DrinkTheSummer',
      imgUrl: 'https://farm2.staticflickr.com/1090/4595137268_0e3f2b9aa7_z_d.jpg',
      video: false,
      date: 'May 18, 2025',
      impressions: 5150,
      engagement: 1160,
      plays: 0,
      reacts: 170,
      comments: 403,
      shares: 58,
    },
  ]

  const allPosts: TopPost[] = [
    {
      id: 'p1',
      caption: 'Our newest watermelon flavor is simply hypnotic! 🍉',
      imgUrl: 'https://media2.giphy.com/media/l0ExuOAGoJ9MdBeTe/giphy.gif',
      video: true,
      date: 'May 18, 2025',
      impressions: 9770,
      engagement: 886,
      plays: 0,
      reacts: 118,
      comments: 221,
      shares: 55,
    },
    {
      id: 'p2',
      caption: 'Open. 🍋 Sip. 🍊 Smile. 😀  Repeat.',
      imgUrl: 'https://farm2.staticflickr.com/1090/4595137268_0e3f2b9aa7_z_d.jpg',
      video: false,
      date: 'May 18, 2025',
      impressions: 8240,
      engagement: 1630,
      plays: 0,
      reacts: 164,
      comments: 932,
      shares: 45,
    },
    {
      id: 'p3',
      caption: 'Jusco Pineapple Queen 🍍 - 100% juice. 100% magic.',
      imgUrl: 'https://farm4.staticflickr.com/3075/3168662394_7d7103de7d_z_d.jpg',
      video: false,
      date: 'May 18, 2025',
      impressions: 5150,
      engagement: 1160,
      plays: 0,
      reacts: 170,
      comments: 403,
      shares: 58,
    },
    {
      id: 'p4',
      caption: 'Check out our new reel for summer drinks!',
      imgUrl: 'https://farm9.staticflickr.com/8505/8441256181_4e98d8bff5_z_d.jpg',
      video: false,
      date: 'May 20, 2025',
      impressions: 7680,
      engagement: 920,
      plays: 2100,
      reacts: 320,
      comments: 80,
      shares: 12,
    },
  ]

  return (
    <>
      <DynamicTitle />
      <Suspense fallback={null}>
        <div className="w-full h-screen overflow-y-auto p-4 bg-gray-50">
        <div className="container mx-auto px-4 max-w-[960px] space-y-4">
          {showAlert && <InfoAlert />}

          <div className="flex flex-col items-center bg-white rounded-xl p-4 shadow">
            <div className="flex flex-wrap gap-4 w-full">
              {rawMetrics.map((m, idx) => (
                <div
                  key={m.metric}
                  className="flex-1 min-w-[140px] max-w-[220px]"
                >
                  <MetricCard
                    data={m}
                    diff={metricDiffs[idx]}
                    active={activeMetric === m.metric}
                    onClick={() => setActiveMetric(m.metric)}
                  />
                </div>
              ))}
            </div>

            <MetricChart metric={activeMetric} data={chartData} />
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-black">Top performing content</h4>
              <div className="inline-flex border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => setTopMode('impressions')}
                  className={cn(
                    'px-3 py-1 text-sm font-medium',
                    topMode === 'impressions' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-700',
                    'border-r border-gray-200'
                  )}
                >
                  Impressions
                </button>
                <button
                  onClick={() => setTopMode('engagement')}
                  className={cn(
                    'px-3 py-1 text-sm font-medium',
                    topMode === 'engagement' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-700',
                    'border-l border-gray-200'
                  )}
                >
                  Engagement
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {topPosts.map((p) => (
                <TopPostCard key={p.id} post={p} highlightMode={topMode} />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <h4 className="text-sm font-medium text-black">Content</h4>
            <ContentTable data={allPosts} />
          </div>
        </div>
      </div>
    </Suspense>
    </>
  )
} 