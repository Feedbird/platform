'use client'

import { useState, useMemo, Suspense } from 'react'
import { Share } from 'lucide-react'
import { format, addDays, startOfDay } from 'date-fns'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { MetricCard, MetricData, formatNumber } from '@/components/analytics/metric-card'
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
  const [reachContentType, setReachContentType] = useState<'posts' | 'reels' | 'stories'>('posts')

  // Helper function to get metric title
  const getMetricTitle = (metric: Metric): string => {
    const metricData = rawMetrics.find(m => m.metric === metric)
    return metricData?.label || metric
  }

  const rawMetrics: MetricData[] = useMemo(
    () => [
      {
        metric: 'followers',
        label: 'Followers',
        icon: <img src="/images/analytics/user-plus.svg" alt="Followers" />,
        value: 226,
      },
      {
        metric: 'reach',
        label: 'Reach',
        icon: <img src="/images/analytics/announcement.svg" alt="Reach" />,
        value: 58,
      },
      {
        metric: 'impressions',
        label: 'Impressions',
        icon: <img src="/images/analytics/eye.svg" alt="Impressions" />,
        value: 73400,
      },
      {
        metric: 'engagements',
        label: 'Engagements',
        icon: <img src="/images/analytics/lightning.svg" alt="Engagements" />,
        value: 4060,
      },
      {
        metric: 'views',
        label: 'Page views',
        icon: <img src="/images/analytics/bar-chart.svg" alt="Page views" />,
        value: 28200,
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

  // Generate chart data based on selected period
  const generateChartData = (selectedPeriod: Period, customRange?: { from: Date; to: Date }) => {
    let startDate: Date
    let endDate: Date
    let dataPoints: number

    // Calculate date range and data points based on period
    switch (selectedPeriod) {
      case '7D':
        endDate = new Date()
        startDate = addDays(endDate, -6)
        // Special case for 7D - show all dates without sampling
        const arr: { day: string; value: number }[] = []
        for (let i = 0; i < 7; i++) {
          const d = addDays(startOfDay(startDate), i)
          arr.push({
            day: format(d, 'MMM d'),
            value: Math.floor(Math.random() * 100),
          })
        }
        return arr
      case '1M':
        endDate = new Date()
        startDate = addDays(endDate, -29)
        dataPoints = 30
        break
      case '3M':
        endDate = new Date()
        startDate = addDays(endDate, -89)
        dataPoints = 30 // Sample every 3rd day
        break
      case '1Y':
        endDate = new Date()
        startDate = addDays(endDate, -364)
        dataPoints = 52 // Weekly data points
        break
      case 'All-time':
        endDate = new Date()
        startDate = addDays(endDate, -364) // Default to 1 year for demo
        dataPoints = 52
        break
      case 'Custom':
        if (customRange?.from && customRange?.to) {
          startDate = customRange.from
          endDate = customRange.to
          const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          dataPoints = Math.min(daysDiff, 52) // Max 52 data points for performance
        } else {
          // Fallback to 7D
          endDate = new Date()
          startDate = addDays(endDate, -6)
          dataPoints = 7
        }
        break
      default:
        endDate = new Date()
        startDate = addDays(endDate, -6)
        dataPoints = 7
    }

    const arr: { day: string; value: number }[] = []
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const interval = Math.max(1, Math.floor(totalDays / dataPoints))

    for (let i = 0; i < dataPoints; i++) {
      const d = addDays(startOfDay(startDate), i * interval)
      if (d <= endDate) {
        arr.push({
          day: selectedPeriod === '1Y' || selectedPeriod === 'All-time'
            ? format(d, 'MMM yyyy')
            : format(d, 'MMM d'),
          value: Math.floor(Math.random() * 100),
        })
      }
    }

    return arr
  }

  const chartData = useMemo(() => {
    return generateChartData(period, customRange)
  }, [period, customRange])

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
        <div className="w-full h-full overflow-y-auto bg-white">
          {/* Topbar */}
          <div className="h-12 flex items-center justify-between px-4 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="cursor-pointer shrink-0" />
              <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
            </div>
          </div>

          <div className="p-4 container mx-auto space-y-4">
            {/* Connected Social Accounts Overview section with period selector and share button */}
            <div className="flex items-center justify-between">
              <PeriodSelector 
                value={period} 
                onChange={handlePeriodChange}
                customRange={customRange}
              />
              <Button variant="default" size="sm" className="flex items-center gap-2 bg-main text-sm font-medium text-white hover:bg-main/90 rounded-sm">
                <Share style={{ width: '14px', height: '14px' }} />
                Share
              </Button>
            </div>

            {/* Five metric cards */}
            <div className="flex flex-wrap gap-3 w-full">
              {rawMetrics.map((m, idx) => (
                <div
                  key={m.metric}
                  className="flex-1"
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
            <div className="bg-white rounded-sm border border-strokeElement">
              <h3 className="text-base font-semibold text-black p-4">Connected Social Accounts Overview</h3>
              <SocialAccountsTable data={socialAccounts} />
            </div>

            {/* Chart card */}
            <div className="bg-white rounded-sm border border-strokeElement">
              <div className="flex items-center justify-between px-4 py-3 border-b border-strokeElement">
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

              <div className="p-4">
                {/* Conditional layout based on active metric */}
              {activeMetric === 'followers' && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-black">{getMetricTitle(activeMetric)}</h3>
                  <div className="h-[300px]">
                    <MetricChart metric={activeMetric} data={chartData} />
                  </div>
                </div>
              )}

              {activeMetric === 'reach' && (
                <div className="flex gap-6">
                  {/* Left side - Pie chart area */}
                  <div className="flex-shrink-0 self-start space-y-4 rounded-sm border border-strokeElement px-4 py-10">
                    {/* Pie chart */}
                    <div className="h-[120px]">
                      <CircleChart
                        data={circleChartData}
                      />
                    </div>

                    {/* Accounts reached section */}
                    <div className="text-center">
                      <p className="text-sm font-normal text-darkGrey">Accounts reached</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="text-xl font-semibold text-black">{formatNumber(45600)}</span>
                        <div className="flex items-center text-xs font-medium rounded-[4px] px-1 bg-[#E7F8E1] text-[#247E00]">
                          +12%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Bar chart area */}
                  <div className="flex-1 space-y-4">
                    {/* Header with title and switch */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-black">Reach</h3>
                      <div className="inline-flex border border-gray-200 rounded-md overflow-hidden">
                        <button
                          onClick={() => setReachContentType('posts')}
                          className={`px-3 py-1 text-sm font-medium border-r border-gray-200 ${
                            reachContentType === 'posts'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-white text-gray-700'
                          }`}
                        >
                          Posts
                        </button>
                        <button
                          onClick={() => setReachContentType('reels')}
                          className={`px-3 py-1 text-sm font-medium border-r border-gray-200 ${
                            reachContentType === 'reels'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-white text-gray-700'
                          }`}
                        >
                          Reels
                        </button>
                        <button
                          onClick={() => setReachContentType('stories')}
                          className={`px-3 py-1 text-sm font-medium ${
                            reachContentType === 'stories'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-white text-gray-700'
                          }`}
                        >
                          Stories
                        </button>
                      </div>
                    </div>

                    {/* Bar chart */}
                    <div className="h-[300px]">
                      <MetricChart metric={activeMetric} data={chartData} />
                    </div>
                  </div>
                </div>
              )}

              {(activeMetric === 'impressions' || activeMetric === 'engagements' || activeMetric === 'views') && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black">{getMetricTitle(activeMetric)}</h3>
                  <div className="h-[300px]">
                    <MetricChart metric={activeMetric} data={chartData} />
                  </div>
                </div>
              )}
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
      </Suspense>
    </>
  )
} 