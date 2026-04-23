const ALGO = "aes-256-gcm"
const KEY_HEX = process.env.ENCRYPTION_KEY! // 64 hex chars = 32 bytes

function getKey(): Buffer {
  if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters")
  }
  return Buffer.from(KEY_HEX, "hex")
}

export function encrypt(text: string): string {
  const { createCipheriv, randomBytes } = require("crypto")
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString("base64")
}

export function decrypt(encoded: string): string {
  const { createDecipheriv } = require("crypto")
  const buf = Buffer.from(encoded, "base64")
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const encrypted = buf.subarray(28)
  const decipher = createDecipheriv(ALGO, getKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}

export function isEncrypted(value: string): boolean {
  try {
    const buf = Buffer.from(value, "base64")
    return buf.length > 28
  } catch {
    return false
  }
}
