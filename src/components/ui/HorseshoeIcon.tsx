import type {
  SVGProps,
} from 'react'

type HorseshoeIconProps =
  SVGProps<SVGSVGElement> & {
    size?: number
  }

export function HorseshoeIcon({
  size = 18,
  strokeWidth = 1.8,
  ...props
}: HorseshoeIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M7.3 3.8C5.2 5.6 4 8.2 4 11.2C4 16 7.6 20 12 20C16.4 20 20 16 20 11.2C20 8.2 18.8 5.6 16.7 3.8" />

      <path d="M9 6.4C7.8 7.6 7.1 9.2 7.1 11.1C7.1 14.2 9.3 16.8 12 16.8C14.7 16.8 16.9 14.2 16.9 11.1C16.9 9.2 16.2 7.6 15 6.4" />

      <circle
        cx="7.2"
        cy="7.1"
        r="0.7"
        fill="currentColor"
        stroke="none"
      />

      <circle
        cx="16.8"
        cy="7.1"
        r="0.7"
        fill="currentColor"
        stroke="none"
      />

      <circle
        cx="6.3"
        cy="11"
        r="0.7"
        fill="currentColor"
        stroke="none"
      />

      <circle
        cx="17.7"
        cy="11"
        r="0.7"
        fill="currentColor"
        stroke="none"
      />

      <circle
        cx="8.1"
        cy="15"
        r="0.7"
        fill="currentColor"
        stroke="none"
      />

      <circle
        cx="15.9"
        cy="15"
        r="0.7"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}