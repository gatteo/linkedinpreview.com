import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

import { env } from '@/env.mjs'

// ---------------------------------------------------------------------------
// AES-256-GCM encryption for LinkedIn OAuth tokens at rest.
//
// Tokens are encrypted with a server-only key (LINKEDIN_TOKEN_ENC_KEY) before
// they ever touch the database, so a leaked DB row is useless without the key.
// Format: base64(iv).base64(authTag).base64(ciphertext)
// ---------------------------------------------------------------------------

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12

function getKey(): Buffer {
    const hex = env.LINKEDIN_TOKEN_ENC_KEY
    if (!hex) {
        throw new Error('LINKEDIN_TOKEN_ENC_KEY is not set - cannot encrypt/decrypt LinkedIn tokens')
    }
    return Buffer.from(hex, 'hex')
}

export function encryptToken(plaintext: string): string {
    const iv = randomBytes(IV_BYTES)
    const cipher = createCipheriv(ALGORITHM, getKey(), iv)
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join('.')
}

export function decryptToken(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split('.')
    if (!ivB64 || !tagB64 || !dataB64) {
        throw new Error('Malformed encrypted token payload')
    }
    const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8')
}
