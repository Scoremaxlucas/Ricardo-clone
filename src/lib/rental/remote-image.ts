/** True wenn next/image mit Optimization (Remote-Patterns) genutzt werden kann. */
export function isVercelBlobImageUrl(src: string): boolean {
  try {
    const u = new URL(src.startsWith('//') ? `https:${src}` : src)
    return (
      u.hostname.endsWith('.public.blob.vercel-storage.com') ||
      u.hostname.endsWith('.blob.vercel-storage.com')
    )
  } catch {
    return false
  }
}
