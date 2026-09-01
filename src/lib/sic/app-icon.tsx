import { ImageResponse } from 'next/og'

/** PNG-Favicon: Safari ignoriert SVG und holt `/favicon.ico`. */
export function sicAppIconResponse(size: number): ImageResponse {
  const mark = Math.round(size * 0.72)
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f2b5e',
        }}
      >
        <svg width={mark} height={mark} viewBox="0 0 32 32">
          <path
            d="M6.4 15.4 16 7.4l9.6 8V26.4a1 1 0 0 1-1 1H7.4a1 1 0 0 1-1-1z"
            fill="none"
            stroke="#fbf9f3"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect x="11" y="15.6" width="10" height="10" rx="2" fill="#c8102e" />
          <rect x="15.2" y="17.6" width="1.6" height="6" rx="0.5" fill="#fff" />
          <rect x="13.2" y="19.6" width="5.6" height="1.6" rx="0.5" fill="#fff" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}

export function helvendaAppIconResponse(size: number): ImageResponse {
  const mark = Math.round(size * 0.72)
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f766e',
        }}
      >
        <svg width={mark} height={mark} viewBox="0 0 32 32">
          <path
            d="M10 10 L10 22 M10 16 L22 16 M22 10 L22 22"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
