import { randomBytes } from 'crypto'
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { basename, join } from 'path'

/**
 * Lokaler Dateispeicher nur für End-to-End-Tests (`SIC_BLOB_LOCAL_DIR`). Hält
 * Testdateien aus den echten Blob-Stores heraus. Auf Vercel (VERCEL=1) nie aktiv.
 */
const PREFIX = 'local-blob://'

export function sicLocalBlobDir(): string | null {
  const dir = process.env.SIC_BLOB_LOCAL_DIR?.trim()
  return dir && process.env.VERCEL !== '1' ? dir : null
}

export function isSicLocalBlobUrl(url: string): boolean {
  return url.startsWith(PREFIX)
}

function localPath(dir: string, url: string): string {
  return join(dir, basename(url.slice(PREFIX.length)))
}

export async function putSicLocalBlob(
  dir: string,
  pathname: string,
  bytes: Buffer
): Promise<string> {
  await mkdir(dir, { recursive: true })
  const name = `${randomBytes(6).toString('hex')}-${basename(pathname)}`
  await writeFile(join(dir, name), bytes)
  return `${PREFIX}${name}`
}

export async function readSicLocalBlob(dir: string, url: string): Promise<Buffer | null> {
  try {
    return await readFile(localPath(dir, url))
  } catch {
    return null
  }
}

export async function deleteSicLocalBlob(dir: string, url: string): Promise<boolean> {
  try {
    await unlink(localPath(dir, url))
    return true
  } catch {
    return false
  }
}
