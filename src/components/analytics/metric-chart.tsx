'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RcTooltip,
  Legend,
  Cell,
} from 'recharts'
import { Metric } from './metric-card'

interface MetricChartProps {
  metric: Metric
  data: { day: string; value: number }[]
}

// Generate stacked data for impressions, engagements, views
const generateStackedData = (originalData: { day: string; value: number }[], metric: Metric) => {
  const primaryLabel = getPrimaryLabel(metric)
  return originalData.map(item => ({
    ...item,
    [primaryLabel]: Math.floor(item.value * 0.7), // 70% of total
    ['Incomplete data']: Math.floor(item.value * 0.3), // 30% of total
  }))
}

// Get the primary label based on metric type
const getPrimaryLabel = (metric: Metric): string => {
  switch (metric) {
    case 'impressions':
      return 'Impressions'
    case 'engagements':
      return 'Engagements'
    case 'views':
      return 'Profile visits'
    default:
      return 'Impressions'
  }
}

export function MetricChart({ metric, data }: MetricChartProps) {
  const isFollowers = metric === 'followers'
  const isReach = metric === 'reach'
  const isStackedMetric = ['impressions', 'engagements', 'views'].includes(metric)
  const stackedData = isStackedMetric ? generateStackedData(data, metric) : data

  let chartComponent: React.ReactElement

  if (isFollowers) {
    chartComponent = (
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4096FF" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#4096FF" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          stroke="#666"
          fontSize={12}
          axisLine={false}
          tickLine={false}
          tick={(props: any) => {
            const { x, y, payload, index } = props
            // Show all ticks for 7D period (7 data points), otherwise sample every 4th
            const shouldShowTick = data.length === 7 ? true : (index % 4 === 0)
            if (!shouldShowTick) return <text />
            return (
              <text x={x} y={y + 10} fontSize={12} fill="#666" textAnchor="middle">
                {payload.value}
              </text>
            )
          }}
        />
        <YAxis
          stroke="#666"
          fontSize={12}
          axisLine={false}
          tickLine={false}
          orientation="right"
        />
        <RcTooltip
          contentStyle={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#4096FF"
          strokeWidth={2}
          fill="url(#colorValue)"
          activeDot={{
            r: 6,
            stroke: '#fff',
            strokeWidth: 2,
            fill: '#4096FF',
          }}
        />
      </AreaChart>
    )
  } else if (isReach) {
    chartComponent = (
      <BarChart data={data}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4096FF" stopOpacity={1} />
            <stop offset="95%" stopColor="#4096FF" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          stroke="#666"
          fontSize={12}
          axisLine={false}
          tickLine={false}
          tick={(props: any) => {
            const { x, y, payload, index } = props
            // Show all ticks for 7D period (7 data points), otherwise sample every 4th
            const shouldShowTick = data.length === 7 ? true : (index % 4 === 0)
            if (!shouldShowTick) return <text />
            return (
              <text x={x} y={y + 10} fontSize={12} fill="#666" textAnchor="middle">
                {payload.value}
              </text>
            )
          }}
        />
        <YAxis
          stroke="#666"
          fontSize={12}
          axisLine={false}
          tickLine={false}
          orientation="right"
        />
        <RcTooltip
          cursor={{ fill: 'rgba(64, 150, 255, 0.1)' }}
          contentStyle={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        />
        <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              cursor="pointer"
              className="transition-opacity duration-200 hover:opacity-80"
            />
          ))}
        </Bar>
      </BarChart>
    )
  } else if (isStackedMetric) {
    chartComponent = (
      <BarChart data={stackedData}>
        <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          stroke="#666"
          fontSize={12}
          axisLine={false}
          tickLine={false}
          tick={(props: any) => {
            const { x, y, payload, index } = props
            // Show all ticks for 7D period (7 data points), otherwise sample every 4th
            const shouldShowTick = data.length === 7 ? true : (index % 4 === 0)
            if (!shouldShowTick) return <text />
            return (
              <text x={x} y={y + 10} fontSize={12} fill="#666" textAnchor="middle">
                {payload.value}
              </text>
            )
          }}
        />
        <YAxis
          stroke="#666"
          fontSize={12}
          axisLine={false}
          tickLine={false}
          orientation="right"
        />
        <RcTooltip
          cursor={{ fill: 'rgba(64, 150, 255, 0.1)' }}
          contentStyle={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        />
        <Legend
          content={({ payload }: any) => (
            <div className="flex items-center justify-center gap-6">
              {payload?.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-[6px] h-[6px] rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-gray-600 font-medium">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        />
        <Bar dataKey={getPrimaryLabel(metric)} stackId="a" fill="#4196FF" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Incomplete data" stackId="a" fill="#91CAFF" radius={[4, 4, 0, 0]} />
      </BarChart>
    )
  } else {
    // Default fallback
    chartComponent = (
      <BarChart data={data}>
        <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Bar dataKey="value" fill="#4096FF" />
      </BarChart>
    )
  }

  return (
    <div className="w-full h-full bg-white rounded-lg">
      <ResponsiveContainer width="100%" height="100%">
        {chartComponent}
      </ResponsiveContainer>
    </div>
  )
} 