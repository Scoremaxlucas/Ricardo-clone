'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  Globe,
  LogIn,
  MapPin,
  Monitor,
  MousePointerClick,
  Smartphone,
  Tablet,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface AnalyticsData {
  summary: {
    totalPageViews: number
    uniqueVisitors: number
    uniqueUsers: number
    avgSessionDuration: number
    avgPagesPerSession: string
    bounceRate: string
    activeNow: number
  }
  viewsOverTime: Array<{ date: string; views: number; visitors: number }>
  topPages: Array<{ path: string; views: number }>
  topReferrers: Array<{ source: string; views: number }>
  devices: Array<{ name: string; value: number }>
  browsers: Array<{ name: string; value: number }>
  operatingSystems: Array<{ name: string; value: number }>
  countries: Array<{ name: string; value: number }>
  hourlyDistribution: Array<{ hour: string; views: number }>
  topEvents: Array<{ name: string; count: number }>
  visitors: Array<{
    sessionId: string
    isLoggedIn: boolean
    user: {
      name: string | null
      email: string
      image: string | null
      memberSince: string
    } | null
    device: string | null
    browser: string | null
    os: string | null
    country: string | null
    city: string | null
    referrer: string | null
    firstSeen: string
    lastSeen: string
    pageCount: number
    totalDuration: number
    isActive: boolean
    pages: Array<{ path: string; time: string; duration: number | null }>
  }>
}

const COLORS = [
  '#0f766e',
  '#0ea5e9',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#10b981',
  '#ec4899',
  '#6366f1',
]

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}m ${sec}s`
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  color = 'teal',
}: {
  title: string
  value: string | number
  icon: React.ElementType
  subtitle?: string
  color?: string
}) {
  const colorMap: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }
  const iconColorMap: Record<string, string> = {
    teal: 'text-teal-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600',
    green: 'text-green-600',
    red: 'text-red-600',
  }

  return (
    <div
      className={`rounded-xl border p-5 ${colorMap[color] || colorMap.teal}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs opacity-60">{subtitle}</p>
          )}
        </div>
        <Icon className={`h-10 w-10 opacity-40 ${iconColorMap[color]}`} />
      </div>
    </div>
  )
}

function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">{title}</h3>
      {children}
    </div>
  )
}

function VisitorRow({
  visitor,
}: {
  visitor: NonNullable<AnalyticsData['visitors']>[number]
}) {
  const [expanded, setExpanded] = useState(false)
  const timeSince = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'gerade eben'
    if (min < 60) return `vor ${min}m`
    const hrs = Math.floor(min / 60)
    if (hrs < 24) return `vor ${hrs}h`
    const days = Math.floor(hrs / 24)
    return `vor ${days}d`
  }

  const deviceIcon =
    visitor.device === 'mobile' ? (
      <Smartphone className="h-4 w-4" />
    ) : visitor.device === 'tablet' ? (
      <Tablet className="h-4 w-4" />
    ) : (
      <Monitor className="h-4 w-4" />
    )

  return (
    <div
      className={`rounded-lg border transition-colors ${
        visitor.isActive
          ? 'border-green-200 bg-green-50/50'
          : 'border-gray-100 bg-gray-50/50'
      }`}
    >
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        {/* Expand icon */}
        {expanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
        )}

        {/* Avatar / Icon */}
        <div className="flex-shrink-0">
          {visitor.user?.image ? (
            <img
              src={visitor.user.image}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : visitor.isLoggedIn ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100">
              <LogIn className="h-4 w-4 text-teal-700" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
              <User className="h-4 w-4 text-gray-500" />
            </div>
          )}
        </div>

        {/* Name / Identity */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-gray-900">
              {visitor.user?.name || visitor.user?.email || 'Anonymer Besucher'}
            </span>
            {visitor.isActive && (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                </span>
                LIVE
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
            {visitor.user?.email && (
              <span>{visitor.user.email}</span>
            )}
            {!visitor.isLoggedIn && visitor.sessionId && (
              <span className="font-mono text-[10px] text-gray-400">
                {visitor.sessionId}
              </span>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="hidden flex-shrink-0 items-center gap-4 text-xs text-gray-500 sm:flex">
          {/* Location */}
          {(visitor.country || visitor.city) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {[visitor.city, visitor.country].filter(Boolean).join(', ')}
            </span>
          )}

          {/* Device */}
          <span className="flex items-center gap-1">
            {deviceIcon}
            {visitor.browser}
          </span>

          {/* Pages */}
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {visitor.pageCount} {visitor.pageCount === 1 ? 'Seite' : 'Seiten'}
          </span>

          {/* Duration */}
          {visitor.totalDuration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(visitor.totalDuration)}
            </span>
          )}

          {/* Time */}
          <span className="w-16 text-right text-gray-400">
            {timeSince(visitor.lastSeen)}
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-200 px-3 pb-3 pt-3">
          {/* Mobile meta (shown on small screens) */}
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-gray-500 sm:hidden">
            {(visitor.country || visitor.city) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[visitor.city, visitor.country].filter(Boolean).join(', ')}
              </span>
            )}
            <span className="flex items-center gap-1">
              {deviceIcon}
              {visitor.browser} / {visitor.os}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {visitor.pageCount} Seiten
            </span>
            {visitor.totalDuration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(visitor.totalDuration)}
              </span>
            )}
          </div>

          {/* Info grid */}
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-md bg-white p-2">
              <span className="text-gray-400">Gerät</span>
              <p className="font-medium text-gray-700">
                {visitor.device} / {visitor.os}
              </p>
            </div>
            <div className="rounded-md bg-white p-2">
              <span className="text-gray-400">Browser</span>
              <p className="font-medium text-gray-700">{visitor.browser}</p>
            </div>
            <div className="rounded-md bg-white p-2">
              <span className="text-gray-400">Quelle</span>
              <p className="truncate font-medium text-gray-700">
                {visitor.referrer
                  ? (() => {
                      try {
                        return new URL(visitor.referrer).hostname
                      } catch {
                        return visitor.referrer
                      }
                    })()
                  : 'Direkt'}
              </p>
            </div>
            <div className="rounded-md bg-white p-2">
              <span className="text-gray-400">Erste Aktivität</span>
              <p className="font-medium text-gray-700">
                {new Date(visitor.firstSeen).toLocaleString('de-CH', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {visitor.user && (
            <div className="mb-3 rounded-md bg-teal-50 p-2 text-xs">
              <span className="font-medium text-teal-700">
                Registrierter Nutzer
              </span>
              <span className="ml-2 text-teal-600">
                Mitglied seit{' '}
                {new Date(visitor.user.memberSince).toLocaleDateString(
                  'de-CH'
                )}
              </span>
            </div>
          )}

          {/* Page journey */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">
              Seitenverlauf
            </p>
            <div className="space-y-1">
              {visitor.pages.map((page, j) => (
                <div
                  key={j}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="w-12 flex-shrink-0 text-right font-mono text-gray-400">
                    {new Date(page.time).toLocaleTimeString('de-CH', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-teal-400" />
                  <span className="truncate font-mono text-gray-700">
                    {page.path}
                  </span>
                  {page.duration && page.duration > 0 && (
                    <span className="flex-shrink-0 text-gray-400">
                      ({formatDuration(page.duration)})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnalyticsDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/data?period=${period}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (session?.user) {
      loadData()
    }
  }, [status, session, router, loadData])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [loadData])

  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-700" />
            <p className="mt-4 text-gray-600">Lade Analytics...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!data) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-gray-600">Keine Daten verfügbar.</p>
        </main>
        <Footer />
      </>
    )
  }

  const { summary } = data

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/dashboard"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Website Analytics
                </h1>
                <p className="text-sm text-gray-500">
                  Detaillierte Besucherdaten & Engagement
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Live indicator */}
              {summary.activeNow > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                  </span>
                  {summary.activeNow} aktiv
                </div>
              )}

              {/* Period selector */}
              <div className="flex rounded-lg border border-gray-300 bg-white">
                {['24h', '7d', '30d', '90d'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      period === p
                        ? 'bg-teal-700 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    } ${p === '24h' ? 'rounded-l-lg' : ''} ${p === '90d' ? 'rounded-r-lg' : ''}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              title="Seitenaufrufe"
              value={summary.totalPageViews.toLocaleString('de-CH')}
              icon={Eye}
              color="teal"
            />
            <StatCard
              title="Besucher"
              value={summary.uniqueVisitors.toLocaleString('de-CH')}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Eingeloggt"
              value={summary.uniqueUsers}
              icon={Activity}
              color="purple"
            />
            <StatCard
              title="Ø Verweildauer"
              value={formatDuration(summary.avgSessionDuration)}
              icon={Clock}
              color="amber"
            />
            <StatCard
              title="Seiten / Sitzung"
              value={summary.avgPagesPerSession}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Absprungrate"
              value={`${summary.bounceRate}%`}
              icon={MousePointerClick}
              color="red"
            />
          </div>

          {/* Views Over Time Chart */}
          <div className="mb-6">
            <ChartCard title="Besucher & Seitenaufrufe im Zeitverlauf">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data.viewsOverTime}>
                  <defs>
                    <linearGradient
                      id="colorViews"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#0f766e"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#0f766e"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorVisitors"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#0ea5e9"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#0ea5e9"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => {
                      const d = new Date(val)
                      return `${d.getDate()}.${d.getMonth() + 1}`
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(val) => {
                      const d = new Date(val as string)
                      return d.toLocaleDateString('de-CH', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name="Seitenaufrufe"
                    stroke="#0f766e"
                    strokeWidth={2}
                    fill="url(#colorViews)"
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    name="Besucher"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fill="url(#colorVisitors)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Two Column Row */}
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            {/* Top Pages */}
            <ChartCard title="Meistbesuchte Seiten">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Seite</th>
                      <th className="pb-2 text-right font-medium">Aufrufe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPages.map((page, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2.5">
                          <span className="max-w-[300px] truncate font-mono text-xs text-gray-700">
                            {page.path}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-teal-500"
                                style={{
                                  width: `${(page.views / (data.topPages[0]?.views || 1)) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="w-12 text-right font-medium text-gray-800">
                              {page.views}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.topPages.length === 0 && (
                  <p className="py-8 text-center text-gray-400">
                    Noch keine Daten
                  </p>
                )}
              </div>
            </ChartCard>

            {/* Referrers */}
            <ChartCard title="Traffic-Quellen">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Quelle</th>
                      <th className="pb-2 text-right font-medium">Besuche</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topReferrers.map((ref, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">{ref.source}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-sky-500"
                                style={{
                                  width: `${(ref.views / (data.topReferrers[0]?.views || 1)) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="w-12 text-right font-medium text-gray-800">
                              {ref.views}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.topReferrers.length === 0 && (
                  <p className="py-8 text-center text-gray-400">
                    Noch keine Daten
                  </p>
                )}
              </div>
            </ChartCard>
          </div>

          {/* Three Column Row: Devices, Browsers, Countries */}
          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            {/* Devices */}
            <ChartCard title="Geräte">
              {data.devices.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.devices}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.devices.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      formatter={(value) => {
                        const icons: Record<string, React.ReactNode> = {
                          desktop: <Monitor className="inline h-3 w-3" />,
                          mobile: <Smartphone className="inline h-3 w-3" />,
                          tablet: <Tablet className="inline h-3 w-3" />,
                        }
                        return (
                          <span className="text-xs">
                            {icons[value as string]} {value}
                          </span>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-gray-400">
                  Noch keine Daten
                </p>
              )}
            </ChartCard>

            {/* Browsers */}
            <ChartCard title="Browser">
              {data.browsers.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.browsers}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.browsers.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-gray-400">
                  Noch keine Daten
                </p>
              )}
            </ChartCard>

            {/* Countries */}
            <ChartCard title="Länder">
              {data.countries.length > 0 ? (
                <div className="max-h-[250px] overflow-y-auto">
                  {data.countries.map((country, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b border-gray-50 py-2"
                    >
                      <span className="text-sm text-gray-700">
                        {country.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-purple-500"
                            style={{
                              width: `${(country.value / (data.countries[0]?.value || 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-sm font-medium text-gray-800">
                          {country.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-gray-400">
                  Noch keine Daten
                </p>
              )}
            </ChartCard>
          </div>

          {/* Hourly Distribution & OS */}
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            {/* Hourly */}
            <ChartCard title="Besucherverteilung nach Tageszeit">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10 }}
                    interval={2}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="views" name="Aufrufe" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* OS */}
            <ChartCard title="Betriebssysteme">
              {data.operatingSystems.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={data.operatingSystems}
                    layout="vertical"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                    />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      name="Besuche"
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-gray-400">
                  Noch keine Daten
                </p>
              )}
            </ChartCard>
          </div>

          {/* Events */}
          {data.topEvents.length > 0 && (
            <div className="mb-6">
              <ChartCard title="Top Events">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.topEvents.map((event, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {event.name}
                      </span>
                      <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-sm font-bold text-teal-700">
                        {event.count}
                      </span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          )}

          {/* Detailed Visitor Sessions */}
          {data.visitors && data.visitors.length > 0 && (
            <div className="mb-6">
              <ChartCard title={`Besucher-Details (${data.visitors.length} Sitzungen)`}>
                <div className="space-y-2">
                  {data.visitors.map((visitor, i) => (
                    <VisitorRow key={i} visitor={visitor} />
                  ))}
                </div>
              </ChartCard>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
