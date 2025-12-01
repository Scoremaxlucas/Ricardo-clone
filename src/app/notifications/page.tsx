'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Bell, Check, CheckCheck, Package, MessageCircle, Gavel, User, Clock } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  watchId: string | null
  bidId: string | null
  questionId: string | null
  priceOfferId: string | null
  link: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchNotifications()
    }
  }, [session?.user, filter])

  // Aktualisiere Benachrichtigungen wenn Seite wieder fokussiert wird oder sichtbar wird
  useEffect(() => {
    const handleFocus = () => {
      if (session?.user) {
        console.log('[notifications] Seite fokussiert, lade Benachrichtigungen neu')
        fetchNotifications()
      }
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session?.user) {
        console.log('[notifications] Seite sichtbar, lade Benachrichtigungen neu')
        fetchNotifications()
      }
    }
    
    // Aktualisiere auch beim Zurückkommen (popstate event)
    const handlePopState = () => {
      if (session?.user) {
        console.log('[notifications] Zurück navigiert, lade Benachrichtigungen neu')
        setTimeout(() => fetchNotifications(), 100)
      }
    }
    
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [session?.user])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/notifications?unreadOnly=${filter === 'unread'}`)
      if (res.ok) {
        const data = await res.json()
        const unreadCount = data.notifications?.filter((n: Notification) => !n.isRead).length || 0
        console.log('[notifications] Benachrichtigungen geladen:', data.notifications?.length || 0, 'ungelesen:', unreadCount)
        
        // Aktualisiere State direkt von der API
        setNotifications(data.notifications || [])
        
        // Aktualisiere auch den unreadCount im Header
        window.dispatchEvent(new CustomEvent('notifications-update'))
      } else {
        console.error('[notifications] Fehler beim Laden:', res.status)
      }
    } catch (error) {
      console.error('[notifications] Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      console.log('[notifications] Markiere Benachrichtigung als gelesen:', notificationId)
      
      // Optimistic Update: Sofort State aktualisieren
      const notification = notifications.find(n => n.id === notificationId)
      const wasUnread = notification && !notification.isRead
      
      if (wasUnread) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        )
        
        // Sofort Header-Badge aktualisieren
        window.dispatchEvent(new CustomEvent('notifications-update'))
      }
      
      // API-Anfrage
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })
      
      if (res.ok) {
        const data = await res.json()
        console.log('[notifications] Benachrichtigung erfolgreich als gelesen markiert:', data)
        
        // Aktualisiere Header-Badge erneut (sicherheitshalber)
        window.dispatchEvent(new CustomEvent('notifications-update'))
        
        return true
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('[notifications] Fehler beim Markieren als gelesen:', errorData)
        
        // Rollback bei Fehler
        if (wasUnread && notification) {
          setNotifications(prev =>
            prev.map(n =>
              n.id === notificationId ? { ...n, isRead: false, readAt: null } : n
            )
          )
          window.dispatchEvent(new CustomEvent('notifications-update'))
        }
        
        return false
      }
    } catch (error) {
      console.error('[notifications] Error marking as read:', error)
      
      // Rollback bei Fehler
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.isRead) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: false, readAt: null } : n
          )
        )
        window.dispatchEvent(new CustomEvent('notifications-update'))
      }
      
      return false
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      })
      
      if (res.ok) {
        fetchNotifications()
        // Aktualisiere auch den unreadCount im Header
        window.dispatchEvent(new CustomEvent('notifications-update'))
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'BID':
        return <Gavel className="h-5 w-5 text-blue-500" />
      case 'QUESTION':
        return <MessageCircle className="h-5 w-5 text-purple-500" />
      case 'ANSWER':
        return <MessageCircle className="h-5 w-5 text-green-500" />
      case 'NEW_PRODUCT_FROM_FOLLOWED':
        return <Package className="h-5 w-5 text-emerald-500" />
      case 'PURCHASE':
        return <Check className="h-5 w-5 text-green-600" />
      case 'PRICE_OFFER_RECEIVED':
      case 'PRICE_OFFER_UPDATED':
        return <Package className="h-5 w-5 text-orange-500" />
      case 'PRICE_OFFER_ACCEPTED':
        return <Check className="h-5 w-5 text-green-600" />
      case 'PRICE_OFFER_REJECTED':
        return <Clock className="h-5 w-5 text-red-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return t.notifications.justNow
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return t.notifications.minutesAgo.replace('{minutes}', minutes.toString())
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return t.notifications.hoursAgo.replace('{hours}', hours.toString())
    const days = Math.floor(hours / 24)
    if (days < 7) return days === 1 
      ? t.notifications.daysAgo.replace('{days}', days.toString())
      : t.notifications.daysAgoPlural.replace('{days}', days.toString())
    const weeks = Math.floor(days / 7)
    return weeks === 1
      ? t.notifications.weeksAgo.replace('{weeks}', weeks.toString())
      : t.notifications.weeksAgoPlural.replace('{weeks}', weeks.toString())
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t.notifications.loading}</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">{t.notifications.title}</h1>
              </div>
              
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                  {t.notifications.markAllAsRead}
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.notifications.all} ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.notifications.unread} ({notifications.filter(n => !n.isRead).length})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-gray-200">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">{t.notifications.noNotifications}</p>
                <p className="text-sm">
                  {filter === 'unread' 
                    ? t.notifications.noUnreadNotifications
                    : t.notifications.noNotificationsYet}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50 hover:bg-blue-100' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getTimeAgo(notification.createdAt)}
                            </div>
                            {!notification.isRead && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {t.notifications.new}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-primary-600 transition-colors"
                            title={t.notifications.markAsRead}
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      
                      {notification.link ? (
                        <a
                          href={notification.link}
                          className="inline-block mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
                          onClick={async (e) => {
                            e.preventDefault()
                            
                            // Prüfe ob Link gültig ist
                            if (!notification.link || notification.link === 'undefined' || notification.link === 'null') {
                              console.error('Invalid notification link:', notification.link)
                              return
                            }
                            
                            // Markiere als gelesen, bevor navigiert wird
                            if (!notification.isRead) {
                              // Warte auf Abschluss der Markierung
                              const success = await markAsRead(notification.id)
                              if (!success) {
                                console.error('[notifications] Fehler beim Markieren als gelesen, navigiere trotzdem')
                              }
                            }
                            
                            // Markiere auch das zugehörige Item (Purchase oder PriceOffer) als gelesen
                            if (notification.link) {
                              // Prüfe ob Link zu Purchases oder Offers führt
                              if (notification.link.includes('/my-watches/buying/purchased')) {
                                // Die purchased-Seite markiert bereits alle beim Laden
                                // Trigger event für Badge-Update
                                window.dispatchEvent(new CustomEvent('purchases-viewed'))
                              } else if (notification.link.includes('/my-watches/buying/offers') || notification.link.includes('/offers')) {
                                // Extrahiere Offer-ID aus Link falls möglich
                                const offerIdMatch = notification.link.match(/offer[=:]([^&]+)/)
                                if (offerIdMatch && offerIdMatch[1]) {
                                  const readOffers = JSON.parse(localStorage.getItem('readOffers') || '[]')
                                  if (!readOffers.includes(offerIdMatch[1])) {
                                    readOffers.push(offerIdMatch[1])
                                    localStorage.setItem('readOffers', JSON.stringify(readOffers))
                                    window.dispatchEvent(new CustomEvent('offers-viewed'))
                                  }
                                } else {
                                  // Wenn keine spezifische Offer-ID, markiere alle beim Laden der Seite
                                  window.dispatchEvent(new CustomEvent('offers-viewed'))
                                }
                              }
                            }
                            
                            // Navigiere nach Markieren (oder sofort wenn bereits gelesen)
                            router.push(notification.link)
                          }}
                        >
                          {notification.type === 'NEW_INVOICE'
                            ? t.notifications.viewInvoices
                            : notification.type === 'PRICE_OFFER_RECEIVED' || notification.type === 'PRICE_OFFER_UPDATED'
                            ? t.notifications.viewPriceOffers
                            : notification.type === 'PRICE_OFFER_ACCEPTED'
                            ? t.notifications.viewPurchase
                            : notification.watchId
                            ? t.notifications.viewArticle
                            : t.notifications.view}
                        </a>
                      ) : notification.watchId && (
                        <a
                          href={`/products/${notification.watchId}`}
                          className="inline-block mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
                          onClick={async (e) => {
                            e.preventDefault()
                            
                            if (!notification.isRead) {
                              // Warte auf Abschluss der Markierung
                              const success = await markAsRead(notification.id)
                              if (!success) {
                                console.error('[notifications] Fehler beim Markieren als gelesen, navigiere trotzdem')
                              }
                            }
                            
                            router.push(`/products/${notification.watchId}`)
                          }}
                        >
                          {t.notifications.viewArticle}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}




