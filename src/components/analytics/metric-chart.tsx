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

export function MetricChart({ metric, data }: MetricChartProps) {
  const isFollowers = metric === 'followers'

  return (
    <div className="w-full h-[300px] bg-white rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        {isFollowers ? (
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
                if (index % 4 !== 0) return <text />
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
        ) : (
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
                if (index % 4 !== 0) return <text />
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
            <Legend />
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
        )}
      </ResponsiveContainer>
    </div>
  )
} 