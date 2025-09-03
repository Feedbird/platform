'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

interface CircleChartData {
  name: string
  value: number
  color: string
}

interface CircleChartProps {
  data: CircleChartData[]
  title?: string
}

const COLORS = ['#4096FF', '#52C41A', '#FA8C16', '#F5222D', '#722ED1', '#13C2C2']

export function CircleChart({ data }: CircleChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length]
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
          <p className="font-medium text-sm">{data.name}</p>
          <p className="text-blue-600 font-semibold">{data.value.toLocaleString()}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={56}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="transition-opacity hover:opacity-80 cursor-pointer"
                />
              ))}
            </Pie>
           
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 