import type { SVGProps } from 'react'

type HorseshoeIconProps = SVGProps<SVGSVGElement> & {
  size?: number
  strokeWidth?: number
}

export function HorseshoeIcon({
  size = 24,
  strokeWidth = 1.8,
  ...props
}: HorseshoeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M6.25 3.75C4.18 5.42 3 8.01 3 10.85C3 15.86 7.03 20 12 20C16.97 20 21 15.86 21 10.85C21 8.01 19.82 5.42 17.75 3.75"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.35 5.7C7.11 6.87 6.4 8.74 6.4 10.82C6.4 14.08 8.86 16.7 12 16.7C15.14 16.7 17.6 14.08 17.6 10.82C17.6 8.74 16.89 6.87 15.65 5.7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 3.75L8.35 5.7M17.8 3.75L15.65 5.7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <circle cx="5.25" cy="8" r="0.7" fill="currentColor" />
      <circle cx="18.75" cy="8" r="0.7" fill="currentColor" />
      <circle cx="5.25" cy="13.5" r="0.7" fill="currentColor" />
      <circle cx="18.75" cy="13.5" r="0.7" fill="currentColor" />
    </svg>
  )
}
