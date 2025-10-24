import React from 'react';
import { cn } from '@/lib/utils';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  /**
   * The size of the icon. Can be a number (pixels) or a string with units.
   * @default 16
   */
  size?: number | string;
  /**
   * The color of the icon. Can be any valid CSS color value.
   * @default "currentColor"
   */
  color?: string;
  /**
   * Additional CSS classes to apply to the icon
   */
  className?: string;
  /**
   * Whether the icon should be accessible to screen readers
   * @default true
   */
  'aria-hidden'?: boolean;
  /**
   * The accessible label for the icon
   */
  'aria-label'?: string;
}

export interface IconComponentProps extends IconProps {
  /**
   * The SVG path data or children elements
   */
  children: React.ReactNode;
  /**
   * The viewBox for the SVG
   */
  viewBox?: string;
}

/**
 * Base Icon component that provides consistent styling and accessibility
 * for all SVG icons in the application.
 */
export const Icon = React.memo<IconComponentProps>(({
  size = 16,
  color = 'currentColor',
  className,
  children,
  viewBox = '0 0 24 24',
  'aria-hidden': ariaHidden = true,
  'aria-label': ariaLabel,
  ...props
}) => {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      width={sizeValue}
      height={sizeValue}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block flex-shrink-0', className)}
      style={{ 
        '--icon-color': color,
        color: color 
      } as React.CSSProperties}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </svg>
  );
});

Icon.displayName = 'Icon';

/**
 * Higher-order component to create icon components with predefined paths
 */
export function createIcon(
  paths: React.ReactNode,
  viewBox: string = '0 0 24 24',
  displayName?: string
) {
  const IconComponent = React.memo<IconProps>((props) => (
    <Icon viewBox={viewBox} {...props}>
      {paths}
    </Icon>
  ));

  if (displayName) {
    IconComponent.displayName = displayName;
  }

  return IconComponent;
}

/**
 * Utility function to convert SVG attributes to React-compatible props
 */
export function svgPropsToReactProps(svgString: string): {
  viewBox: string;
  paths: string;
  width?: string;
  height?: string;
} {
  // Extract viewBox
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';

  // Extract width and height
  const widthMatch = svgString.match(/width="([^"]+)"/);
  const heightMatch = svgString.match(/height="([^"]+)"/);
  const width = widthMatch ? widthMatch[1] : undefined;
  const height = heightMatch ? heightMatch[1] : undefined;

  // Extract path content (everything between <svg> tags)
  const pathMatch = svgString.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  const paths = pathMatch ? pathMatch[1] : '';

  return { viewBox, paths, width, height };
}
