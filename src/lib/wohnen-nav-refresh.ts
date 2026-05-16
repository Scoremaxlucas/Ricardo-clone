/** Navbar lädt `/api/user/nav-status` neu — nach Profil-, Register- oder Zertifikats-Änderungen. */
export const WOHNEN_NAV_REFRESH_EVENT = 'wohnen:nav-refresh'

export function dispatchWohnenNavRefresh(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(WOHNEN_NAV_REFRESH_EVENT))
}
