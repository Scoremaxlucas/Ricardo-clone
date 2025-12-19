/**
 * Server-only encryption helper for sensitive data (IBAN)
 * Uses AES-256-GCM encryption
 *
 * IMPORTANT: This file must NEVER be imported on the client side
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 16 bytes for AES
const SALT_LENGTH = 64 // 64 bytes for key derivation
const TAG_LENGTH = 16 // 16 bytes for GCM auth tag
const KEY_LENGTH = 32 // 32 bytes for AES-256

/**
 * Get encryption key from environment variable
 * Format: base64 encoded 32-byte key
 */
function getEncryptionKey(): Buffer {
  const keyEnv = process.env.PAYOUT_ENCRYPTION_KEY
  if (!keyEnv) {
    throw new Error('PAYOUT_ENCRYPTION_KEY environment variable is not set')
  }

  try {
    const key = Buffer.from(keyEnv, 'base64')
    if (key.length !== KEY_LENGTH) {
      throw new Error(`PAYOUT_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (base64 encoded)`)
    }
    return key
  } catch (error) {
    throw new Error(`Invalid PAYOUT_ENCRYPTION_KEY format: ${error}`)
  }
}

/**
 * Encrypts a plaintext string
 * Returns: base64 encoded string in format: iv:salt:ciphertext:tag
 */
export function encrypt(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Text to encrypt must be a non-empty string')
  }

  const key = getEncryptionKey()

  // Generate random IV and salt
  const iv = crypto.randomBytes(IV_LENGTH)
  const salt = crypto.randomBytes(SALT_LENGTH)

  // Derive key using PBKDF2 (for additional security, though we already have a strong key)
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256')

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)

  // Encrypt
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  // Get auth tag
  const tag = cipher.getAuthTag()

  // Combine: iv:salt:ciphertext:tag
  return `${iv.toString('base64')}:${salt.toString('base64')}:${encrypted}:${tag.toString('base64')}`
}

/**
 * Decrypts an encrypted string
 * Input format: base64 encoded string in format: iv:salt:ciphertext:tag
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData || typeof encryptedData !== 'string') {
    throw new Error('Encrypted data must be a non-empty string')
  }

  const key = getEncryptionKey()

  // Split the encrypted data
  const parts = encryptedData.split(':')
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format. Expected: iv:salt:ciphertext:tag')
  }

  const [ivBase64, saltBase64, ciphertext, tagBase64] = parts

  try {
    // Decode base64 components
    const iv = Buffer.from(ivBase64, 'base64')
    const salt = Buffer.from(saltBase64, 'base64')
    const tag = Buffer.from(tagBase64, 'base64')

    // Derive key using same PBKDF2 parameters
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256')

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
    decipher.setAuthTag(tag)

    // Decrypt
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    throw new Error(`Decryption failed: ${error}`)
  }
}

/**
 * Masks an IBAN for display
 * Format: CH•• •••• •••• •••• •••• 1234
 */
export function maskIban(iban: string, last4?: string): string {
  // If we have last4 provided, use it even without full IBAN
  const lastFour = last4 || (iban && iban.length >= 4 ? iban.slice(-4) : '••••')
  const countryCode = iban && iban.length >= 2 ? iban.slice(0, 2).toUpperCase() : 'CH'

  return `${countryCode}•• •••• •••• •••• •••• ${lastFour}`
}
