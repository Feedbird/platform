'use client'

import { useState, useMemo, Suspense } from 'react'
import { Users, FileText, Eye, MousePointerClick, BarChart2, Share } from 'lucide-react'
import { format, addDays, startOfDay } from 'date-fns'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { InfoAlert } from '@/components/analytics/info-alert'
import { MetricCard, MetricData } from '@/components/analytics/metric-card'
import { MetricChart } from '@/components/analytics/metric-chart'
import { TopPostCard, TopPost } from '@/components/analytics/top-post-card'
import { ContentTable } from '@/components/analytics/content-table'
import { PeriodSelector, Period } from '@/components/analytics/period-selector'
import { SocialAccountsTable, SocialAccount } from '@/components/analytics/social-accounts-table'
import { SocialSelector, SocialAccountOption } from '@/components/analytics/social-selector'
import { CircleChart } from '@/components/analytics/circle-chart'
import type { Metric } from '@/components/analytics/metric-card'
import { DynamicTitle } from '@/components/layout/dynamic-title'

export default function AnalyticsPage() {
  const [showAlert] = useState(true)
  const [activeMetric, setActiveMetric] = useState<Metric>('followers')
  const [topMode, setTopMode] = useState<'impressions' | 'engagement'>('impressions')
  const [period, setPeriod] = useState<Period>('7D')
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date }>()
  const [selectedSocialAccount, setSelectedSocialAccount] = useState<string>('account1')

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

  const socialAccounts: SocialAccount[] = useMemo(() => [
    {
      id: 'account1',
      platform: 'instagram',
      name: 'JuscoSmoothies',
      handle: 'juscosmoothies',
      totalFollowersGained: 1245,
      impressions: 45600,
      engagement: 3420,
      followerGrowthPercent: 8.5,
      engagementRate: 7.5,
    },
    {
      id: 'account2',
      platform: 'facebook',
      name: 'Jusco Smoothies',
      handle: 'jusco.smoothies',
      totalFollowersGained: 892,
      impressions: 32100,
      engagement: 2180,
      followerGrowthPercent: 6.2,
      engagementRate: 6.8,
    },
    {
      id: 'account3',
      platform: 'linkedin',
      name: 'Jusco Health Foods',
      handle: 'jusco-health-foods',
      totalFollowersGained: 567,
      impressions: 18900,
      engagement: 1250,
      followerGrowthPercent: 4.1,
      engagementRate: 6.6,
    },
  ], [])

  const socialAccountOptions: SocialAccountOption[] = useMemo(() => 
    socialAccounts.map(acc => ({
      id: acc.id,
      platform: acc.platform,
      name: acc.name,
      handle: acc.handle,
    })), [socialAccounts]
  )

  const circleChartData = useMemo(() => [
    { name: 'Instagram', value: 45600, color: '#E1306C' },
    { name: 'Facebook', value: 32100, color: '#1877F2' },
    { name: 'LinkedIn', value: 18900, color: '#0A66C2' },
  ], [])

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

  const handlePeriodChange = (newPeriod: Period, range?: { from: Date; to: Date }) => {
    setPeriod(newPeriod)
    if (range) {
      setCustomRange(range)
    }
  }

  return (
    <>
      <DynamicTitle />
      <Suspense fallback={null}>
        <div className="w-full h-full overflow-y-auto bg-gray-50">
          {/* Topbar */}
          <div className="h-12 flex items-center justify-between px-4 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="cursor-pointer shrink-0" />
              <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
            </div>
          </div>

          <div className="p-4">
            <div className="container mx-auto px-4 max-w-[960px] space-y-4">
              {showAlert && <InfoAlert />}

              {/* Connected Social Accounts Overview section with period selector and share button */}
              <div className="flex items-center justify-between">
                <PeriodSelector 
                  value={period} 
                  onChange={handlePeriodChange}
                  customRange={customRange}
                />
                <Button variant="default" size="sm" className="flex items-center gap-2">
                  <Share className="w-4 h-4" />
                  Share
                </Button>
              </div>

              {/* Five metric cards */}
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

              {/* Connected Social Accounts Overview */}
              <div className="bg-white rounded-xl p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Social Accounts Overview</h3>
                <SocialAccountsTable data={socialAccounts} />
              </div>

              {/* Chart card */}
              <div className="bg-white rounded-xl p-6 shadow">
                <div className="flex items-center justify-between mb-6">
                  <SocialSelector 
                    accounts={socialAccountOptions}
                    selected={selectedSocialAccount}
                    onChange={setSelectedSocialAccount}
                  />
                  <PeriodSelector 
                    value={period} 
                    onChange={handlePeriodChange}
                    customRange={customRange}
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Circle chart */}
                  <div className="h-[300px]">
                    <CircleChart 
                      data={circleChartData} 
                      title="Platform Distribution" 
                    />
                  </div>
                  
                  {/* Metric chart */}
                  <div className="h-[300px]">
                    <MetricChart metric={activeMetric} data={chartData} />
                  </div>
                </div>
              </div>

              {/* Top performing content */}
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

              {/* Content table */}
              <div className="bg-white rounded-xl p-4 shadow">
                <h4 className="text-sm font-medium text-black">Content</h4>
                <ContentTable data={allPosts} />
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </>
  )
} 