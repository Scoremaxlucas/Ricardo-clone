/** Pfade mit fokussiertem Profil-UI (kein voller Marketing-Footer / anderes Shell-Verhalten). */
export function isTenantProfilWizardPath(pathname: string): boolean {
  return pathname === '/profil/erstellen' || pathname === '/profil/bearbeiten'
}

export function isBetreibungsregisterPath(pathname: string): boolean {
  return pathname.startsWith('/profil/betreibungsregister')
}

export function isCompactProfilShellPath(pathname: string): boolean {
  return isTenantProfilWizardPath(pathname) || isBetreibungsregisterPath(pathname)
}
