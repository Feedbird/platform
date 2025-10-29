import crypto from 'crypto'

const VERSION_PREFIX = 'enc.v1:'

function getAesKey(): Buffer {
  const key = process.env.DATA_ENCRYPTION_KEY || ''
  if (!key) {
    throw new Error('DATA_ENCRYPTION_KEY is not set')
  }

  // Accept base64 (44 chars for 32 bytes) or hex (64 chars)
  try {
    if (/^[A-Za-z0-9+/=]+$/.test(key) && key.length >= 44) {
      const buf = Buffer.from(key, 'base64')
      if (buf.length !== 32) throw new Error('Invalid base64 key length')
      return buf
    }
    if (/^[a-fA-F0-9]+$/.test(key) && key.length === 64) {
      return Buffer.from(key, 'hex')
    }
  } catch {}

  // Fallback: treat as utf8 and hash to 32 bytes
  const hashed = crypto.createHash('sha256').update(key, 'utf8').digest()
  return hashed
}

export function isEncrypted(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(VERSION_PREFIX)
}

export function encryptString(plaintext: string | null | undefined): string | null {
  if (plaintext == null) return null
  if (isEncrypted(plaintext)) return plaintext

  const key = getAesKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  const ivB64 = iv.toString('base64')
  const ctB64 = ciphertext.toString('base64')
  const tagB64 = tag.toString('base64')
  return `${VERSION_PREFIX}${ivB64}:${ctB64}:${tagB64}`
}

export function decryptString(ciphertextOrPlain: string | null | undefined): string | null {
  if (ciphertextOrPlain == null) return null
  const value = String(ciphertextOrPlain)
  if (!isEncrypted(value)) return value

  const key = getAesKey()
  const payload = value.slice(VERSION_PREFIX.length)
  const parts = payload.split(':')
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted payload')
  }
  const [ivB64, ctB64, tagB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const ct = Buffer.from(ctB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
  return plaintext
}

export function encryptIfNeeded<T extends string | null | undefined>(value: T): T {
  return encryptString(value as any) as any
}

export function decryptIfNeeded<T extends string | null | undefined>(value: T): T {
  return decryptString(value as any) as any
}


