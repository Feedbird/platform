'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

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

export function CircleChart({ data, title }: CircleChartProps) {
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
      {title && (
        <h4 className="text-sm font-medium text-gray-900 mb-4">{title}</h4>
      )}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
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
      
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
} 