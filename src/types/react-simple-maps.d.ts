declare module 'react-simple-maps' {
  export interface GeographyProps {
    geography: any
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: object
      hover?: object
      pressed?: object
    }
    onMouseEnter?: (event: any) => void
    onMouseLeave?: (event: any) => void
  }

  export interface GeographiesProps {
    geography: string
    children: (props: { geographies: any[] }) => React.ReactNode
  }

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: {
      scale?: number
      center?: [number, number]
    }
    width?: number
    height?: number
    style?: React.CSSProperties
    children?: React.ReactNode
  }

  export const ComposableMap: React.ComponentType<ComposableMapProps>
  export const Geographies: React.ComponentType<GeographiesProps>
  export const Geography: React.ComponentType<GeographyProps>
}
