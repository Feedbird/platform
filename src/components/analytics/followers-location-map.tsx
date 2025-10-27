'use client'

// @ts-ignore
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { scaleLinear } from 'd3-scale'
import { Info } from 'lucide-react'

interface GeographyFeature {
  rsmKey: string
  properties: {
    name: string
  }
}

interface GeographyMouseEvent {
  currentTarget: HTMLElement & {
    style: {
      fill: string
    }
  }
}

// Sample follower data by country name (matching world atlas)
const followersData = [
  { country: 'United States of America', followers: 12500 },
  { country: 'United Kingdom', followers: 8900 },
  { country: 'Canada', followers: 7200 },
  { country: 'Australia', followers: 6500 },
  { country: 'Germany', followers: 5800 },
  { country: 'France', followers: 5200 },
  { country: 'Brazil', followers: 4800 },
  { country: 'India', followers: 4500 },
  { country: 'Japan', followers: 4200 },
  { country: 'South Korea', followers: 3800 },
  { country: 'Netherlands', followers: 3500 },
  { country: 'Sweden', followers: 3200 },
  { country: 'Norway', followers: 2900 },
  { country: 'Denmark', followers: 2600 },
  { country: 'Finland', followers: 2300 },
  { country: 'Singapore', followers: 2000 },
  { country: 'Italy', followers: 1800 },
  { country: 'Spain', followers: 1600 },
  { country: 'Mexico', followers: 1400 },
  { country: 'Poland', followers: 1200 },
  { country: 'Argentina', followers: 1000 },
  { country: 'Chile', followers: 800 },
  { country: 'Colombia', followers: 700 },
  { country: 'Peru', followers: 600 },
  { country: 'Ecuador', followers: 500 },
  { country: 'Uruguay', followers: 400 },
  { country: 'Paraguay', followers: 300 },
  { country: 'Bolivia', followers: 200 },
  { country: 'Venezuela', followers: 150 },
  { country: 'Guyana', followers: 100 },
  { country: 'Suriname', followers: 50 },
  { country: 'China', followers: 9200 },
  { country: 'Russia', followers: 7800 },
  { country: 'South Africa', followers: 4100 },
  { country: 'Nigeria', followers: 3600 },
  { country: 'Egypt', followers: 3300 },
  { country: 'Turkey', followers: 3900 },
  { country: 'Thailand', followers: 2700 },
  { country: 'Indonesia', followers: 4300 },
  { country: 'Malaysia', followers: 2400 },
  { country: 'Philippines', followers: 2800 },
  { country: 'Vietnam', followers: 3100 },
  { country: 'Pakistan', followers: 2200 },
  { country: 'Bangladesh', followers: 1900 },
  { country: 'Iran', followers: 2100 },
  { country: 'Saudi Arabia', followers: 2500 },
  { country: 'United Arab Emirates', followers: 2300 },
  { country: 'Israel', followers: 1700 },
  { country: 'New Zealand', followers: 1400 },
  { country: 'Switzerland', followers: 1600 },
  { country: 'Austria', followers: 1300 },
  { country: 'Belgium', followers: 1500 },
  { country: 'Portugal', followers: 1100 },
  { country: 'Ireland', followers: 1200 },
  { country: 'Czech Republic', followers: 900 },
  { country: 'Greece', followers: 800 },
  { country: 'Hungary', followers: 700 },
  { country: 'Romania', followers: 600 },
  { country: 'Ukraine', followers: 550 },
  { country: 'Kazakhstan', followers: 500 },
  { country: 'Morocco', followers: 450 },
  { country: 'Kenya', followers: 400 },
  { country: 'Ghana', followers: 350 },
  { country: 'Ivory Coast', followers: 300 },
  { country: 'Senegal', followers: 250 },
  { country: 'Tunisia', followers: 200 },
  { country: 'Algeria', followers: 150 },
  { country: 'Jordan', followers: 100 },
  { country: 'Lebanon', followers: 50 },
]

const minFollowers = Math.min(...followersData.map(d => d.followers))
const maxFollowers = Math.max(...followersData.map(d => d.followers))

// Color scale for the map
const colorScale = scaleLinear<string>()
  .domain([minFollowers, maxFollowers])
  .range(['#D2E4FF', '#4397FC'])

export function FollowersLocationMap() {
  return (
    <div className="rounded-sm border border-elementStroke p-4">
      <h4 className="text-base font-semibold text-black mb-5 flex items-center gap-2">
        Followers location distribution
        <Info className="w-4 h-4 text-grey" />
      </h4>

      {/* World Map */}
      <div className="mb-6">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 90,
            center: [0, 50],
          }}
          width={790}
          height={390}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
            {({ geographies }: { geographies: GeographyFeature[] }) =>
              geographies.map((geo: GeographyFeature) => {
                const countryName = geo.properties.name
                const countryData = followersData.find(d => d.country === countryName)
                const followers = countryData?.followers || 0
                const fillColor = followers > 0 ? colorScale(followers) : '#D2E4FF'

                // Debug: log first few countries to verify matching
                if (geographies.indexOf(geo) < 5) {
                  console.log(`Country: ${countryName}, Found: ${!!countryData}, Followers: ${followers}`)
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        outline: 'none',
                      },
                      hover: {
                        outline: 'none',
                        fill: '#2d5aa0', // Darker shade for hover effect
                      },
                      pressed: {
                        outline: 'none',
                      },
                    }}
                    onMouseEnter={(event: GeographyMouseEvent) => {
                      event.currentTarget.style.fill = '#2d5aa0'
                    }}
                    onMouseLeave={(event: GeographyMouseEvent) => {
                      event.currentTarget.style.fill = fillColor
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Gradient Bar with Labels */}
      <div className="flex flex-col items-center space-y-2">
        {/* Labels */}
        <div className="flex justify-between w-full max-w-md px-2">
          <span className="text-sm font-semibold text-black">LOW</span>
          <span className="text-sm font-semibold text-black">DENSITY</span>
          <span className="text-sm font-semibold text-black">HIGH</span>
        </div>

        {/* Gradient Bar */}
        <div
          className="w-full max-w-md h-1.5 rounded-full"
          style={{
            background: `linear-gradient(to right, #D2E4FF, #4397FC)`,
          }}
        />
      </div>
    </div>
  )
}
