import { useEffect, useState } from 'react'

interface ReleaseAsset {
  name: string
  size: number
  browser_download_url: string
}

interface ReleaseInfo {
  tag_name: string
  published_at: string
  assets: ReleaseAsset[]
  html_url: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const REPO_URL = 'https://github.com/dreeyanzz/human-detector-2'
const API_URL = 'https://api.github.com/repos/dreeyanzz/human-detector-2/releases/latest'

const features = [
  {
    title: 'Real-time Detection',
    description: 'Powered by YOLOv8 with ByteTrack for accurate person detection and tracking at high frame rates.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Face Recognition',
    description: 'Train the system on known faces and get real-time identification with confidence scoring.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: 'Live Monitoring',
    description: 'Real-time stats dashboard with person count, tracking history, and configurable detection settings.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
  },
  {
    title: 'Easy Export',
    description: 'Capture screenshots, export face databases, and save detection data with a single click.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
]

export default function App() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error('No release found')
        return res.json()
      })
      .then((data: ReleaseInfo) => setRelease(data))
      .catch(() => setRelease(null))
      .finally(() => setLoading(false))
  }, [])

  const asset = release?.assets?.find(
    (a) => a.name.endsWith('.zip') || a.name.endsWith('.exe')
  )

  const downloadUrl = asset?.browser_download_url ?? `${REPO_URL}/releases`
  const downloadLabel = asset
    ? `Download ${asset.name} (${formatBytes(asset.size)})`
    : 'View Releases on GitHub'

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 pt-32 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-accent/20 bg-accent/5 text-accent text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            {release ? `${release.tag_name}` : 'Latest Release'}
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
            Person Detection{' '}
            <span className="text-accent">System</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Real-time person detection and face recognition powered by YOLOv8.
            One-click install, no setup required.
          </p>

          <a
            href={downloadUrl}
            target={asset ? undefined : '_blank'}
            rel={asset ? undefined : 'noopener noreferrer'}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-accent text-gray-950 font-semibold text-lg rounded-xl shadow-glow hover:shadow-glow-lg hover:bg-accent/90 transition-all duration-300"
          >
            {loading ? (
              'Loading...'
            ) : (
              <>
                <svg className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {downloadLabel}
              </>
            )}
          </a>

          <p className="mt-4 text-sm text-gray-500">
            Windows 10 or later &middot; Free &amp; open source
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
          Everything you need
        </h2>
        <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
          A complete detection and monitoring solution that runs entirely on your machine.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl border border-gray-800 bg-gray-900/50 hover:border-accent/30 hover:bg-gray-900/80 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* System Requirements */}
      <section className="max-w-3xl mx-auto px-6 py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
          System Requirements
        </h2>
        <p className="text-gray-400 text-center mb-12">
          Minimal requirements to get started.
        </p>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 overflow-hidden">
          {[
            ['OS', 'Windows 10 or later (64-bit)'],
            ['Camera', 'Any USB webcam or built-in camera'],
            ['RAM', '4 GB minimum'],
            ['GPU', 'Optional — NVIDIA GPU with CUDA for faster inference'],
          ].map(([label, value], i) => (
            <div
              key={label}
              className={`flex items-center justify-between px-6 py-4 ${
                i > 0 ? 'border-t border-gray-800' : ''
              }`}
            >
              <span className="text-gray-400 text-sm font-medium">{label}</span>
              <span className="text-white text-sm">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Person Detection System{release ? ` ${release.tag_name}` : ''}
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-accent transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            View on GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
