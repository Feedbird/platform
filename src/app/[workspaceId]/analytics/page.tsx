'use client'

import { useState, useMemo, Suspense } from 'react'
import { Share, Info, Mail, Inbox, Download } from 'lucide-react'
import { format, addDays, startOfDay } from 'date-fns'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MetricCard, MetricData, formatNumber } from '@/components/analytics/metric-card'
import { MetricChart } from '@/components/analytics/metric-chart'
import { TopPostCard, TopPost } from '@/components/analytics/top-post-card'
import { ContentTable } from '@/components/analytics/content-table'
import { PostDetailSidebar } from '@/components/analytics/post-detail-sidebar'
import { PeriodSelector, Period } from '@/components/analytics/period-selector'
import { SocialAccountsTable, SocialAccount } from '@/components/analytics/social-accounts-table'
import { SocialSelector, SocialAccountOption } from '@/components/analytics/social-selector'
import { HistoricalStatsTable, HistoricalStatsData } from '@/components/analytics/historical-stats-table'
import type { SocialPage } from '@/lib/social/platforms/platform-types'
import type { Metric } from '@/components/analytics/metric-card'
import { DynamicTitle } from '@/components/layout/dynamic-title'
import { FollowersLocationMap } from '@/components/analytics/followers-location-map'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import type { Payload as LegendPayload } from 'recharts/types/component/DefaultLegendContent'
import { UserPlusIcon } from '@/components/ui/icons'

export default function AnalyticsPage() {
  const [showAlert] = useState(true)
  const [activeMetric, setActiveMetric] = useState<Metric>('followers')
  const [topMode, setTopMode] = useState<'impressions' | 'engagement'>('impressions')
  const [period, setPeriod] = useState<Period>('7D')
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date }>()
  const [selectedSocialAccount, setSelectedSocialAccount] = useState<string>('account1')
  const [reachContentType, setReachContentType] = useState<'posts' | 'reels' | 'stories'>('posts')
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [selectedShareOption, setSelectedShareOption] = useState<string>('channels')
  const [selectedInterval, setSelectedInterval] = useState<string>('week')
  const [selectedPost, setSelectedPost] = useState<TopPost | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
        icon: <UserPlusIcon size={16} color='#4670F9'/>,
        //icon: <img src="/images/analytics/user-plus.svg" alt="Followers" />,
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

  const socialPages: SocialPage[] = useMemo(() => [
    {
      id: 'page1',
      platform: 'instagram',
      entityType: 'page',
      name: 'JuscoSmoothies',
      pageId: 'jusco_smoothies_instagram',
      connected: true,
      status: 'active',
      accountId: 'account1',
      followerCount: 45600,
      postCount: 1245,
    },
    {
      id: 'page2',
      platform: 'facebook',
      entityType: 'page',
      name: 'Jusco Smoothies',
      pageId: 'jusco_smoothies_facebook',
      connected: true,
      status: 'active',
      accountId: 'account2',
      followerCount: 32100,
      postCount: 892,
    },
    {
      id: 'page3',
      platform: 'linkedin',
      entityType: 'page',
      name: 'Jusco Health Foods',
      pageId: 'jusco_health_foods_linkedin',
      connected: true,
      status: 'active',
      accountId: 'account3',
      followerCount: 18900,
      postCount: 567,
    },
  ], [])

  const socialAccountOptions: SocialAccountOption[] = useMemo(() =>
    socialPages.map(page => ({
      id: page.id,
      platform: page.platform,
      name: page.name,
      handle: page.pageId,
    })), [socialPages]
  )

  const circleChartData = useMemo(() => [
    { name: 'Instagram', value: 45600, color: '#E1306C' },
    { name: 'Facebook', value: 32100, color: '#1877F2' },
    { name: 'LinkedIn', value: 18900, color: '#0A66C2' },
  ], [])

  const topCountries = useMemo(() => [
    { country: 'United States', code: 'us', percentage: 32.5 },
    { country: 'United Kingdom', code: 'gb', percentage: 18.7 },
    { country: 'Canada', code: 'ca', percentage: 12.3 },
    { country: 'Australia', code: 'au', percentage: 9.8 },
    { country: 'Germany', code: 'de', percentage: 7.2 },
  ], [])

  const topCities = useMemo(() => [
    { city: 'New York', percentage: 15.4 },
    { city: 'London', percentage: 12.8 },
    { city: 'Toronto', percentage: 9.6 },
    { city: 'Sydney', percentage: 8.1 },
    { city: 'Los Angeles', percentage: 6.9 },
  ], [])

  const genderDistribution = useMemo(() => [
    { name: 'Women', value: 65, color: '#4196FF' },
    { name: 'Men', value: 35, color: '#91CAFF' },
  ], [])

  const ageDistribution = useMemo(() => [
    { age: '13-17', women: 8, men: 6 },
    { age: '18-24', women: 25, men: 18 },
    { age: '25-34', women: 35, men: 28 },
    { age: '35-44', women: 22, men: 25 },
    { age: '45-54', women: 15, men: 18 },
    { age: '55-64', women: 12, men: 14 },
    { age: '65+', women: 8, men: 9 },
  ], [])

  const jobFunctionDistribution = useMemo(() => [
    { function: 'Entrepreneurship', count: 966, percentage: 6.8 },
    { function: 'Engineering', count: 2450, percentage: 17.3 },
    { function: 'Human Resources', count: 890, percentage: 6.3 },
    { function: 'Community and Social Services', count: 1200, percentage: 8.5 },
    { function: 'Arts and Design', count: 1450, percentage: 10.2 },
    { function: 'Purchasing', count: 650, percentage: 4.6 },
    { function: 'Administrative', count: 1780, percentage: 12.6 },
    { function: 'Product Management', count: 2100, percentage: 14.8 },
    { function: 'Marketing', count: 1960, percentage: 13.8 },
  ], [])

  const seniorityDistribution = useMemo(() => [
    { level: 'Entry', count: 3200, percentage: 22.6 },
    { level: 'Senior', count: 2800, percentage: 19.8 },
    { level: 'CXO', count: 450, percentage: 3.2 },
    { level: 'VP', count: 680, percentage: 4.8 },
    { level: 'Director', count: 920, percentage: 6.5 },
    { level: 'Unpaid', count: 1200, percentage: 8.5 },
    { level: 'Partner', count: 580, percentage: 4.1 },
    { level: 'Manager', count: 4250, percentage: 30.0 },
  ], [])

  const topPosts: TopPost[] = [
    {
      id: 't1',
      workspace_id: 'ws-123',
      board_id: 'board-123',
      caption: 'Our newest watermelon flavor is simply hypnotic! #JuscoSmoothies 🍉',
      status: 'published',
      format: 'image',
      publish_date: '2025-05-18T10:00:00Z',
      platforms: ['instagram', 'facebook'],
      pages: ['page1', 'page2'],
      billing_month: '2025-05',
      month: 5,
      settings: {},
      hashtags: ['#JuscoSmoothies'],
      blocks: [
        {
          "id": "7bc0670e-18cd-42d1-8ac5-de5101538774",
          "kind": "image",
          "comments": [],
          "versions": [
            {
              "by": "Ed",
              "id": "8ab2518f-d1fe-4e53-a628-1c16f1a4f64d",
              "file": {
                "url": "https://pub-7c697410bf9d4c77a76ef1d13d21f6b5.r2.dev/workspace-07875a3b-c675-4ee8-a695-f7fcaddd99c1/board-d8bf567c-854c-466f-8847-e9acc27611c4/post-e8e22fb2-f2b4-4e7c-abcb-d841026e9509/ed9c8f77-3c5b-4836-b2ae-4707ee2c4724-lemlist-•-Ed-s-first-campaign-Copy (1).png",
                "kind": "image"
              },
              "caption": "",
              "comments": [],
              "createdAt": "2025-08-25T17:32:56.597Z"
            }
          ],
          "currentVersionId": "8ab2518f-d1fe-4e53-a628-1c16f1a4f64d"
        }
      ],
      comments: [],
      activities: [],
      user_columns: [],
      created_at: '2025-05-17T09:00:00Z',
      updated_at: '2025-05-18T10:00:00Z',
      platform_post_ids: { instagram: 'post_123', facebook: 'post_456' },
      // Analytics fields
      analytics_impressions: 9770,
      analytics_engagement: 886,
      analytics_comments: 0,
      analytics_reacts: 118,
      analytics_shares: 55,
    },
    {
      id: 't2',
      workspace_id: 'ws-123',
      board_id: 'board-123',
      caption: 'Open. 🍋  Sip. 🍊 Smile. 😀  Repeat.',
      status: 'published',
      format: 'image',
      publish_date: '2025-05-18T11:00:00Z',
      platforms: ['tiktok', 'instagram'],
      pages: ['page3'],
      billing_month: '2025-05',
      month: 5,
      settings: {},
      hashtags: [],
      blocks: [
        {
          "id": "7bd2eb41-d517-4728-a5fc-8b7ab4de45a3",
          "kind": "image",
          "comments": [],
          "versions": [
            {
              "by": "Juraj",
              "id": "ec60674f-836b-4199-92a5-2a626475525b",
              "file": {
                "url": "https://pub-7c697410bf9d4c77a76ef1d13d21f6b5.r2.dev/workspace-513b9aef-a02b-47d5-9fe5-b1ffa200de46/board-72a01c85-3ecd-4015-a3e3-37e66f6ab3ac/post-45096bd4-f0c3-4262-9318-1d90b73e682f/05adcfb8-2a87-4042-8534-2ea6301db426-2.jpg",
                "kind": "image"
              },
              "caption": "",
              "comments": [],
              "createdAt": "2025-09-02T12:31:35.879Z"
            }
          ],
          "currentVersionId": "ec60674f-836b-4199-92a5-2a626475525b"
        }
      ],
      comments: [],
      activities: [],
      user_columns: [],
      created_at: '2025-05-17T10:00:00Z',
      updated_at: '2025-05-18T11:00:00Z',
      platform_post_ids: { tiktok: 'video_789', instagram: 'post_101' },
      // Analytics fields
      analytics_impressions: 8240,
      analytics_engagement: 1630,
      analytics_comments: 0,
      analytics_reacts: 164,
      analytics_shares: 45,
    },
    {
      id: 't3',
      workspace_id: 'ws-123',
      board_id: 'board-123',
      caption: 'Jusco Pineapple Queen 🍍 - #DrinkTheSummer',
      status: 'published',
      format: 'image',
      publish_date: '2025-05-18T12:00:00Z',
      platforms: ['instagram'],
      pages: ['page1'],
      billing_month: '2025-05',
      month: 5,
      settings: {},
      hashtags: ['#DrinkTheSummer'],
      blocks: [
        {
          "id": "2f081e2a-d147-4dab-9de5-6f01186aa5aa",
          "kind": "image",
          "comments": [],
          "versions": [
            {
              "by": "Juraj",
              "id": "cb004764-84fd-435e-948b-8d4d79787679",
              "file": {
                "url": "https://pub-7c697410bf9d4c77a76ef1d13d21f6b5.r2.dev/workspace-513b9aef-a02b-47d5-9fe5-b1ffa200de46/board-72a01c85-3ecd-4015-a3e3-37e66f6ab3ac/post-eb6075e5-a3e4-4735-bcaa-9a3d3b5b00c4/11b1d03b-3844-49b6-a625-89cd7b599082-2.jpg",
                "kind": "image"
              },
              "caption": "",
              "comments": [],
              "createdAt": "2025-09-02T12:44:10.088Z"
            }
          ],
          "currentVersionId": "cb004764-84fd-435e-948b-8d4d79787679"
        }
      ],
      comments: [],
      activities: [],
      user_columns: [],
      created_at: '2025-05-17T11:00:00Z',
      updated_at: '2025-05-18T12:00:00Z',
      platform_post_ids: { instagram: 'post_112' },
      // Analytics fields
      analytics_impressions: 5150,
      analytics_engagement: 1160,
      analytics_comments: 0,
      analytics_reacts: 170,
      analytics_shares: 58,
    },
    {
      id: 't4',
      workspace_id: 'ws-123',
      board_id: 'board-123',
      caption: 'Fresh mango madness! 🌴 Nothing beats the taste of summer in a glass.',
      status: 'published',
      format: 'video',
      publish_date: '2025-05-19T09:00:00Z',
      platforms: ['tiktok', 'instagram'],
      pages: ['page2', 'page3'],
      billing_month: '2025-05',
      month: 5,
      settings: {},
      hashtags: [],
      blocks: [
        {
          "id": "9927bf07-c114-45e2-a06e-39d007f838ec",
          "kind": "video",
          "comments": [],
          "versions": [
            {
              "by": "Juraj",
              "id": "e56436fd-8894-4293-bbff-5fe5db5661ad",
              "file": {
                "url": "https://pub-7c697410bf9d4c77a76ef1d13d21f6b5.r2.dev/workspace-513b9aef-a02b-47d5-9fe5-b1ffa200de46/board-72a01c85-3ecd-4015-a3e3-37e66f6ab3ac/post-2e810ffc-24ad-41f8-86a1-4a82bc0beef6/e1d62162-cf10-4c9d-a294-a64633c73e65-Apodaca 1.mp4",
                "kind": "video"
              },
              "caption": "",
              "comments": [],
              "createdAt": "2025-08-12T17:03:16.658Z"
            }
          ],
          "currentVersionId": "e56436fd-8894-4293-bbff-5fe5db5661ad"
        }
      ],
      comments: [],
      activities: [],
      user_columns: [],
      created_at: '2025-05-18T08:00:00Z',
      updated_at: '2025-05-19T09:00:00Z',
      platform_post_ids: { tiktok: 'video_113', instagram: 'post_114' },
      // Analytics fields
      analytics_impressions: 6240,
      analytics_engagement: 890,
      analytics_comments: 1200,
      analytics_reacts: 145,
      analytics_shares: 42,
    },
    {
      id: 't5',
      workspace_id: 'ws-123',
      board_id: 'board-123',
      caption: 'Berry explosion! Mix of blueberries, strawberries, and raspberries 🫐🍓',
      status: 'published',
      format: 'image',
      publish_date: '2025-05-20T10:00:00Z',
      platforms: ['instagram', 'facebook'],
      pages: ['page1', 'page2'],
      billing_month: '2025-05',
      month: 5,
      settings: {},
      hashtags: [],
      blocks: [
        {
          "id": "6a7f2d5f-2e01-4620-88f2-0f07b93236a8",
          "kind": "image",
          "comments": [],
          "versions": [
            {
              "by": "Juraj",
              "id": "7e55678a-6ccf-4caf-87c2-d44abfd78cb9",
              "file": {
                "url": "https://pub-7c697410bf9d4c77a76ef1d13d21f6b5.r2.dev/workspace-513b9aef-a02b-47d5-9fe5-b1ffa200de46/board-72a01c85-3ecd-4015-a3e3-37e66f6ab3ac/post-731cadc1-bde4-4f30-8147-e87d1fe0322c/ae518644-7341-488b-9752-2e2a579f3bb0-2.jpg",
                "kind": "image"
              },
              "caption": "",
              "comments": [],
              "createdAt": "2025-09-02T12:44:39.397Z"
            }
          ],
          "currentVersionId": "7e55678a-6ccf-4caf-87c2-d44abfd78cb9"
        }
      ],
      comments: [],
      activities: [],
      user_columns: [],
      created_at: '2025-05-19T09:00:00Z',
      updated_at: '2025-05-20T10:00:00Z',
      platform_post_ids: { instagram: 'post_115', facebook: 'post_116' },
      // Analytics fields
      analytics_impressions: 7430,
      analytics_engagement: 980,
      analytics_comments: 0,
      analytics_reacts: 145,
      analytics_shares: 42,
    },
  ]

  const allPosts: TopPost[] = [
    {
      id: 'p1',
      workspace_id: 'ws-123',
      board_id: 'board-123',
      caption: 'Our newest watermelon flavor is simply hypnotic! 🍉',
      status: 'published',
      format: 'video',
      publish_date: '2025-05-18T10:00:00Z',
      platforms: ['instagram', 'tiktok'],
      pages: ['page1'],
      billing_month: '2025-05',
      month: 5,
      settings: {},
      hashtags: [],
      blocks: [
        {
          "id": "7bc0670e-18cd-42d1-8ac5-de5101538774",
          "kind": "image",
          "comments": [],
          "versions": [
            {
              "by": "Ed",
              "id": "8ab2518f-d1fe-4e53-a628-1c16f1a4f64d",
              "file": {
                "url": "https://pub-7c697410bf9d4c77a76ef1d13d21f6b5.r2.dev/workspace-07875a3b-c675-4ee8-a695-f7fcaddd99c1/board-d8bf567c-854c-466f-8847-e9acc27611c4/post-e8e22fb2-f2b4-4e7c-abcb-d841026e9509/ed9c8f77-3c5b-4836-b2ae-4707ee2c4724-lemlist-•-Ed-s-first-campaign-Copy (1).png",
                "kind": "image"
              },
              "caption": "",
              "comments": [],
              "createdAt": "2025-08-25T17:32:56.597Z"
            }
          ],
          "currentVersionId": "8ab2518f-d1fe-4e53-a628-1c16f1a4f64d"
        }
      ],
      comments: [],
      activities: [],
      user_columns: [],
      created_at: '2025-05-17T09:00:00Z',
      updated_at: '2025-05-18T10:00:00Z',
      platform_post_ids: { instagram: 'post_123', tiktok: 'video_124' },
      // Analytics fields
      analytics_impressions: 9770,
      analytics_engagement: 886,
      analytics_comments: 1500,
      analytics_reacts: 118,
      analytics_shares: 55,
    },
    {
      id: 'p2',
      workspace_id: 'ws-123',
      board_id: 'board-123',
      caption: 'Open. 🍋 Sip. 🍊 Smile. 😀  Repeat.',
      status: 'published',
      format: 'image',
      publish_date: '2025-05-18T11:00:00Z',
      platforms: ['facebook'],
      pages: ['page2'],
      billing_month: '2025-05',
      month: 5,
      settings: {},
      hashtags: [],
      blocks: [
        {
          "id": "7bd2eb41-d517-4728-a5fc-8b7ab4de45a3",
          "kind": "image",
          "comments": [],
          "versions": [
            {
              "by": "Juraj",
              "id": "ec60674f-836b-4199-92a5-2a626475525b",
              "file": {
                "url": "https://pub-7c697410bf9d4c77a76ef1d13d21f6b5.r2.dev/workspace-513b9aef-a02b-47d5-9fe5-b1ffa200de46/board-72a01c85-3ecd-4015-a3e3-37e66f6ab3ac/post-45096bd4-f0c3-4262-9318-1d90b73e682f/05adcfb8-2a87-4042-8534-2ea6301db426-2.jpg",
                "kind": "image"
              },
              "caption": "",
              "comments": [],
              "createdAt": "2025-09-02T12:31:35.879Z"
            }
          ],
          "currentVersionId": "ec60674f-836b-4199-92a5-2a626475525b"
        }
      ],
      comments: [],
      activities: [],
      user_columns: [],
      created_at: '2025-05-17T10:00:00Z',
      updated_at: '2025-05-18T11:00:00Z',
      platform_post_ids: { facebook: 'post_125' },
      // Analytics fields
      analytics_impressions: 8240,
      analytics_engagement: 1630,
      analytics_comments: 0,
      analytics_reacts: 164,
      analytics_shares: 45,
    },
    {
      id: 'p3',
      workspace_id: 'ws-123',
      board_id: 'board-123',
      caption: 'Jusco Pineapple Queen 🍍 - 100% juice. 100% magic.',
      status: 'published',
      format: 'image',
      publish_date: '2025-05-18T12:00:00Z',
      platforms: ['instagram'],
      pages: ['page1'],
      billing_month: '2025-05',
      month: 5,
      settings: {},
      hashtags: [],
      blocks: [
        {
          "id": "2f081e2a-d147-4dab-9de5-6f01186aa5aa",
          "kind": "image",
          "comments": [],
          "versions": [
            {
              "by": "Juraj",
              "id": "cb004764-84fd-435e-948b-8d4d79787679",
              "file": {
                "url": "https://pub-7c697410bf9d4c77a76ef1d13d21f6b5.r2.dev/workspace-513b9aef-a02b-47d5-9fe5-b1ffa200de46/board-72a01c85-3ecd-4015-a3e3-37e66f6ab3ac/post-eb6075e5-a3e4-4735-bcaa-9a3d3b5b00c4/11b1d03b-3844-49b6-a625-89cd7b599082-2.jpg",
                "kind": "image"
              },
              "caption": "",
              "comments": [],
              "createdAt": "2025-09-02T12:44:10.088Z"
            }
          ],
          "currentVersionId": "cb004764-84fd-435e-948b-8d4d79787679"
        }
      ],
      comments: [],
      activities: [],
      user_columns: [],
      created_at: '2025-05-17T11:00:00Z',
      updated_at: '2025-05-18T12:00:00Z',
      platform_post_ids: { instagram: 'post_126' },
      // Analytics fields
      analytics_impressions: 5150,
      analytics_engagement: 1160,
      analytics_comments: 0,
      analytics_reacts: 170,
      analytics_shares: 58,
    },
    {
      id: 'p4',
      workspace_id: 'ws-123',
      board_id: 'board-123',
      caption: 'Check out our new reel for summer drinks!',
      status: 'published',
      format: 'video',
      publish_date: '2025-05-20T14:00:00Z',
      platforms: ['tiktok', 'instagram'],
      pages: ['page2', 'page3'],
      billing_month: '2025-05',
      month: 5,
      settings: {},
      hashtags: [],
      blocks: [
        {
          "id": "6a7f2d5f-2e01-4620-88f2-0f07b93236a8",
          "kind": "image",
          "comments": [],
          "versions": [
            {
              "by": "Juraj",
              "id": "7e55678a-6ccf-4caf-87c2-d44abfd78cb9",
              "file": {
                "url": "https://pub-7c697410bf9d4c77a76ef1d13d21f6b5.r2.dev/workspace-513b9aef-a02b-47d5-9fe5-b1ffa200de46/board-72a01c85-3ecd-4015-a3e3-37e66f6ab3ac/post-731cadc1-bde4-4f30-8147-e87d1fe0322c/ae518644-7341-488b-9752-2e2a579f3bb0-2.jpg",
                "kind": "image"
              },
              "caption": "",
              "comments": [],
              "createdAt": "2025-09-02T12:44:39.397Z"
            }
          ],
          "currentVersionId": "7e55678a-6ccf-4caf-87c2-d44abfd78cb9"
        }
      ],
      comments: [],
      activities: [],
      user_columns: [],
      created_at: '2025-05-19T13:00:00Z',
      updated_at: '2025-05-20T14:00:00Z',
      platform_post_ids: { tiktok: 'video_127', instagram: 'post_128' },
      // Analytics fields
      analytics_impressions: 7680,
      analytics_engagement: 920,
      analytics_comments: 2100,
      analytics_reacts: 320,
      analytics_shares: 12,
    },
  ]

  const historicalStatsData: HistoricalStatsData[] = useMemo(() => [
    {
      id: 'hs1',
      publish_date: '2025-01-15T10:00:00Z',
      followers_count: 45230,
      followers_rate: 2.5,
      following_count: 1200,
      media_count: 15,
      engagement_rate: 4.8,
      caption: 'Winter smoothie special! ❄️🍓',
      format: 'image',
    },
    {
      id: 'hs2',
      publish_date: '2025-01-20T14:30:00Z',
      followers_count: 45890,
      followers_rate: 1.4,
      following_count: 1180,
      media_count: 22,
      engagement_rate: 3.2,
      caption: 'New year, new flavors! 🌟🥤',
      format: 'video',
    },
    {
      id: 'hs3',
      publish_date: '2025-02-01T09:15:00Z',
      followers_count: 46250,
      followers_rate: 0.8,
      following_count: 1150,
      media_count: 18,
      engagement_rate: 5.1,
      caption: 'Valentine\'s Day special ❤️🍓',
      format: 'carousel',
    },
    {
      id: 'hs4',
      publish_date: '2025-02-10T16:45:00Z',
      followers_count: 46500,
      followers_rate: 0.5,
      following_count: 1120,
      media_count: 25,
      engagement_rate: 3.7,
      caption: 'Spring collection preview 🌸🥭',
      format: 'video',
    },
    {
      id: 'hs5',
      publish_date: '2025-02-18T11:20:00Z',
      followers_count: 46780,
      followers_rate: 0.6,
      following_count: 1100,
      media_count: 12,
      engagement_rate: 4.3,
      caption: 'Behind the scenes: Making the perfect smoothie 🎥🍊',
      format: 'story',
    },
  ], [])

  const handlePeriodChange = (newPeriod: Period, range?: { from: Date; to: Date }) => {
    setPeriod(newPeriod)
    if (range) {
      setCustomRange(range)
    }
  }

  const handlePostClick = (post: TopPost) => {
    setSelectedPost(post)
    setIsSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
    setSelectedPost(null)
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
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2 bg-main text-sm font-medium text-white hover:bg-main/90 rounded-sm"
                onClick={() => setIsShareDialogOpen(true)}
              >
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
            <div className="bg-white rounded-sm border border-elementStroke">
              <h3 className="text-base font-semibold text-black p-4">Connected Social Accounts Overview</h3>
              <SocialAccountsTable data={socialPages} />
            </div>

            {/* Chart card */}
            <div className="bg-white rounded-sm border border-elementStroke">
              <div className="flex items-center justify-between px-4 py-3 border-b border-elementStroke">
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
                  <div className="flex-shrink-0 self-start space-y-4 rounded-sm border border-elementStroke px-4 py-10">
                    {/* Pie chart */}
                    <div className="h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={circleChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={56}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {circleChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                className="transition-opacity hover:opacity-80 cursor-pointer"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0]
                                return (
                                  <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                                    <p className="font-medium text-sm">{data.name}</p>
                                    <p className="text-blue-600 font-semibold">{data.value ? data.value.toLocaleString() : '0'}</p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
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
                      <div className="flex items-center gap-[4px] p-[2px] bg-[#F4F5F6] rounded-[6px] h-full">
                        <button
                          onClick={() => setReachContentType('posts')}
                          className={`px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px] cursor-pointer ${
                            reachContentType === 'posts'
                              ? 'bg-white shadow'
                              : ''
                          }`}
                        >
                          Posts
                        </button>
                        <button
                          onClick={() => setReachContentType('reels')}
                          className={`px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px] cursor-pointer ${
                            reachContentType === 'reels'
                              ? 'bg-white shadow'
                              : ''
                          }`}
                        >
                          Reels
                        </button>
                        <button
                          onClick={() => setReachContentType('stories')}
                          className={`px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px] cursor-pointer ${
                            reachContentType === 'stories'
                              ? 'bg-white shadow'
                              : ''
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
            <div className="pt-3">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-black">Top performing content</h4>
                <div className="flex items-center gap-[4px] p-[2px] bg-[#F4F5F6] rounded-[6px] h-full">
                  <button
                    onClick={() => setTopMode('impressions')}
                    className={cn(
                      'px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px] cursor-pointer',
                      topMode === 'impressions' ? 'bg-white shadow' : '',
                    )}
                  >
                    Impressions
                  </button>
                  <button
                    onClick={() => setTopMode('engagement')}
                    className={cn(
                      'px-[8px] gap-[6px] text-black rounded-[6px] font-medium text-sm h-[24px] cursor-pointer',
                      topMode === 'engagement' ? 'bg-white shadow' : '',
                    )}
                  >
                    Engagement
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {topPosts.map((p) => (
                  <TopPostCard
                    key={p.id}
                    post={p}
                    highlightMode={topMode}
                    onClick={handlePostClick}
                  />
                ))}
              </div>
            </div>

            {/* Top Countries and Cities */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Countries */}
                <div className="rounded-sm border border-elementStroke p-4">
                  <h4 className="text-base font-semibold text-black mb-5 flex items-center gap-2">
                    Top Countries
                    <Info className="w-4 h-4 text-grey" />
                  </h4>
                  <div className="space-y-5">
                    {topCountries.map((country, index) => (
                      <div key={index} className="grid grid-cols-[20px_120px_1fr_40px] items-center gap-2">
                        <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={`https://flagcdn.com/w20/${country.code}.png`}
                            alt={`${country.country} flag`}
                            width={20}
                            height={15}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-sm font-medium text-black">{country.country}</span>
                        <div className="w-full bg-backgroundHover rounded-full h-1.5">
                          <div
                            className="bg-[#4096FF] h-1.5 rounded-full"
                            style={{ width: `${country.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-[#4096FF] font-medium text-right">{country.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Cities */}
                <div className="rounded-sm border border-elementStroke p-4">
                  <h4 className="text-base font-semibold text-black mb-5 flex items-center gap-2">
                    Top Cities
                    <Info className="w-4 h-4 text-grey" />
                  </h4>
                  <div className="space-y-5">
                    {topCities.map((city, index) => (
                      <div key={index} className="grid grid-cols-[120px_1fr_40px] items-center gap-3">
                        <span className="text-sm font-medium text-black">{city.city}</span>
                        <div className="w-full bg-backgroundHover rounded-full h-1.5">
                          <div
                            className="bg-[#4096FF] h-1.5 rounded-full"
                            style={{ width: `${city.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-[#4096FF] font-medium text-right">{city.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Gender and Age Distribution */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gender Distribution */}
                <div className="rounded-sm border border-elementStroke py-4 pr-6 pl-4">
                  <h4 className="text-base font-semibold text-black mb-14 flex items-center gap-2">
                    Gender distribution
                    <Info className="w-4 h-4 text-grey" />
                  </h4>
                  <div className="flex gap-8 px-6">
                    {/* Pie chart on the left */}
                    <div className="flex-shrink-0">
                      <div className="h-40 w-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={genderDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {genderDistribution.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                  className="transition-opacity hover:opacity-80 cursor-pointer"
                                />
                              ))}
                            </Pie>
                            <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0]
                                return (
                                  <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                                    <p className="font-medium text-sm">{data.name}</p>
                                    <p className="text-blue-600 font-semibold">{data.value || 0}%</p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Legend on the right */}
                    <div className="flex-1 flex flex-col justify-center space-y-3">
                      {genderDistribution.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm font-normal text-black">{item.name}</span>
                          </div>
                          <span className="text-sm text-[#4096FF] font-medium">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Age Distribution */}
                <div className="rounded-sm border border-elementStroke p-4">
                  <h4 className="text-base font-semibold text-black mb-5 flex items-center gap-2">
                    Age distribution
                    <Info className="w-4 h-4 text-grey" />
                  </h4>
                  <div className="h-[252px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={ageDistribution}
                          margin={{ top: 0, right: -20, left: 0, bottom: 5 }}
                          barGap={8}
                          barSize={8}
                        >
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis
                          dataKey="age"
                          axisLine={false}
                          tickLine={false}
                          fontSize={13}
                          stroke="#5C5E63"
                        />
                        <YAxis
                          orientation="right"
                          axisLine={false}
                          tickLine={false}
                          fontSize={13}
                          stroke="#5C5E63"
                          ticks={[0, 20, 40, 60, 80]}
                          domain={[0, 80]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Bar dataKey="women" fill="#4096FF" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="men" fill="#91CAFF" radius={[8, 8, 0, 0]} />
                          <Legend
                            content={({ payload }: { payload?: LegendPayload[] }) => (
                            <div className="flex items-center justify-center gap-6">
                              {payload?.map((entry, index: number) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div
                                    className="w-[6px] h-[6px] rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-xs text-gray-600 font-medium">
                                    {entry.value === 'women' ? 'Women' : entry.value === 'men' ? 'Men' : entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Function and Seniority Distribution */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Job Function Distribution */}
                <div className="rounded-sm border border-elementStroke p-4">
                  <h4 className="text-base font-semibold text-black mb-5 flex items-center gap-2">
                    Job Function
                    <Info className="w-4 h-4 text-grey" />
                  </h4>
                  <div className="space-y-4">
                    {jobFunctionDistribution.map((item, index) => (
                      <div key={index}>
                        <div className="flex items-center text-sm font-normal">
                          <span className="text-black">
                            {item.function} 
                          </span>
                          <span className="text-grey">
                            &nbsp;- {item.count.toLocaleString()} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-backgroundHover rounded-full h-1.5">
                            <div
                              className="bg-[#4096FF] h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-[#4096FF] font-medium whitespace-nowrap">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seniority Level Distribution */}
                <div className="rounded-sm border border-elementStroke p-4">
                  <h4 className="text-base font-semibold text-black mb-5 flex items-center gap-2">
                    Seniority level
                    <Info className="w-4 h-4 text-grey" />
                  </h4>
                  <div className="space-y-4">
                    {seniorityDistribution.map((item, index) => (
                      <div key={index}>
                        <div className="flex items-center text-sm font-normal">
                          <span className="text-black">
                            {item.level}
                          </span>
                          <span className="text-grey">
                            &nbsp;- {item.count.toLocaleString()} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-backgroundHover rounded-full h-1.5">
                            <div
                              className="bg-[#4096FF] h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-[#4096FF] font-medium whitespace-nowrap">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Followers Location Distribution */}
            <FollowersLocationMap />

            {/* All Posts */}
            <div className="bg-white rounded-sm border border-elementStroke">
              <div className="flex items-center justify-between px-4 py-3 border-b border-elementStroke">
                <h3 className="text-base font-semibold text-black">All Posts</h3>
                <PeriodSelector
                  value={period}
                  onChange={handlePeriodChange}
                  customRange={customRange}
                />
              </div>
              <ContentTable data={allPosts} />
            </div>

            {/* Historical Stats */}
            <div className="bg-white rounded-sm border border-elementStroke">
              <h3 className="text-base font-semibold text-black p-4">Historical Stats</h3>
              <HistoricalStatsTable data={historicalStatsData} />
            </div>
          </div>
        </div>

        {/* Share Analytics Dialog */}
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="sm:max-w-[530px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-black">Share analytics report</DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              {/* Share to section */}
              <div>
                <h3 className="text-sm font-normal text-grey mb-3">Share to</h3>
                <div className="flex gap-4">
                  {/* Share to channels card */}
                  <div
                    className={`w-[232px] border rounded-md p-3 transition-colors cursor-pointer ${
                      selectedShareOption === 'channels'
                        ? 'border-main bg-main/5'
                        : 'border-buttonStroke hover:border-main'
                    }`}
                    onClick={() => setSelectedShareOption('channels')}
                  >
                    <input
                      type="radio"
                      name="shareOption"
                      value="channels"
                      checked={selectedShareOption === 'channels'}
                      onChange={() => setSelectedShareOption('channels')}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between mb-3">
                      <Inbox className="w-4 h-4 text-black" />
                      <div className={`w-4 h-4 rounded-full border-1 flex items-center justify-center ${
                        selectedShareOption === 'channels'
                          ? 'border-main'
                          : 'border-gray-300'
                      }`}>
                        {selectedShareOption === 'channels' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-main"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium whitespace-nowrap text-black">
                      Share to channels "All Message"
                    </p>
                  </div>

                  {/* Share to email card */}
                  <div
                    className={`w-[232px] border rounded-md p-3 transition-colors cursor-pointer ${
                      selectedShareOption === 'email'
                        ? 'border-main bg-main/5'
                        : 'border-buttonStroke hover:border-main'
                    }`}
                    onClick={() => setSelectedShareOption('email')}
                  >
                    <input
                      type="radio"
                      name="shareOption"
                      value="email"
                      checked={selectedShareOption === 'email'}
                      onChange={() => setSelectedShareOption('email')}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between mb-3">
                      <Mail className="w-4 h-4 text-black" />
                      <div className={`w-4 h-4 rounded-full border-1 flex items-center justify-center ${
                        selectedShareOption === 'email'
                          ? 'border-main'
                          : 'border-gray-300'
                      }`}>
                        {selectedShareOption === 'email' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-main"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium whitespace-nowrap text-black">
                      Share to Email
                    </p>
                  </div>
                </div>
              </div>

              {/* Automatic forwarding text */}
              <p className="text-sm text-grey font-normal">
                Automatically forward the analytics report to client to 'All Message' channels.
              </p>

              {/* Interval selection */}
              <div>
                <div className="space-y-2">
                  {[
                    { id: 'week', mainText: 'Every week', subText: '(on Monday)' },
                    { id: 'two-weeks', mainText: 'Every 2 weeks', subText: '(on Monday)' },
                    { id: 'month', mainText: 'Every month', subText: '(on Monday)' },
                    { id: 'quarter', mainText: 'Every quarter', subText: '(on Monday)' }
                  ].map((interval) => (
                    <div key={interval.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={interval.id}
                        name="interval"
                        value={interval.id}
                        checked={selectedInterval === interval.id}
                        onChange={(e) => setSelectedInterval(e.target.value)}
                        className="w-4 h-4 text-main border-buttonStroke focus:ring-main"
                      />
                      <label htmlFor={interval.id} className="text-sm cursor-pointer">
                        <span className="text-black font-medium">{interval.mainText}</span>
                        <span className="text-grey font-normal"> {interval.subText}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setIsShareDialogOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-black"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Handle download/share logic here
                    setIsShareDialogOpen(false)
                  }}
                  className="px-4 py-2 text-sm font-medium text-black"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Post Detail Sidebar */}
        <PostDetailSidebar
          post={selectedPost}
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
        />
      </Suspense>
    </>
  )
} 