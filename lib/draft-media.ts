/**
 * Media handoff between the editor and the feed preview tab.
 *
 * Media is a base64 data URL, too large for the share URL or localStorage, so it
 * travels through IndexedDB instead: the editor stores a record and opens the
 * preview with the returned key, the preview reads that key back.
 *
 * Reads are non-destructive so reloading or restoring the preview tab still finds
 * the media. Records are reclaimed by `pruneDraftMedia`, which drops anything past
 * the TTL and then caps the store at the most recent `MAX_RECORDS` entries.
 */

export type StoredMedia = { type: 'image' | 'video'; src: string }

type MediaRecord = { key: string; media: StoredMedia; createdAt: number }

const DB_NAME = 'linkedinpreview'
const DB_VERSION = 1
const STORE_NAME = 'draft-media'
const CREATED_AT_INDEX = 'createdAt'
const TTL_MS = 60 * 60 * 1000
const OPEN_TIMEOUT_MS = 3000
const MAX_RECORDS = 8

function createKey(): string {
    // randomUUID requires a secure context, so keep a fallback for plain http origins
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function isValidRecord(value: unknown): value is MediaRecord {
    const record = value as MediaRecord | undefined
    return (
        !!record &&
        typeof record.createdAt === 'number' &&
        !!record.media &&
        typeof record.media.src === 'string' &&
        (record.media.type === 'image' || record.media.type === 'video')
    )
}

function openDb(): Promise<IDBDatabase | null> {
    return new Promise((resolve) => {
        if (typeof indexedDB === 'undefined') {
            resolve(null)
            return
        }

        let settled = false
        const settle = (db: IDBDatabase | null) => {
            if (settled) {
                db?.close()
                return
            }
            settled = true
            resolve(db)
        }

        // Storage can be blocked in a way that fires neither success nor error,
        // which would otherwise leave the caller awaiting forever
        const timer = setTimeout(() => settle(null), OPEN_TIMEOUT_MS)

        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onupgradeneeded = () => {
                const db = request.result
                const store = db.objectStoreNames.contains(STORE_NAME)
                    ? request.transaction?.objectStore(STORE_NAME)
                    : db.createObjectStore(STORE_NAME, { keyPath: 'key' })
                if (store && !store.indexNames.contains(CREATED_AT_INDEX)) {
                    store.createIndex(CREATED_AT_INDEX, 'createdAt')
                }
            }
            request.onsuccess = () => {
                clearTimeout(timer)
                settle(request.result)
            }
            request.onerror = () => {
                clearTimeout(timer)
                settle(null)
            }
            request.onblocked = () => {
                clearTimeout(timer)
                settle(null)
            }
        } catch {
            clearTimeout(timer)
            settle(null)
        }
    })
}

/**
 * Resolves on transaction completion so writes are durable before we return,
 * and resolves null on any failure.
 */
function runTransaction<T>(
    db: IDBDatabase,
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore, resolveWith: (value: T | null) => void) => void,
): Promise<T | null> {
    return new Promise((resolve) => {
        let result: T | null = null
        try {
            const tx = db.transaction(STORE_NAME, mode)
            tx.oncomplete = () => resolve(result)
            tx.onerror = () => resolve(null)
            tx.onabort = () => resolve(null)
            run(tx.objectStore(STORE_NAME), (value) => {
                result = value
            })
        } catch {
            resolve(null)
        }
    })
}

export async function putDraftMedia(media: StoredMedia): Promise<string | null> {
    const db = await openDb()
    if (!db) return null

    try {
        const record: MediaRecord = { key: createKey(), media, createdAt: Date.now() }
        return await runTransaction<string>(db, 'readwrite', (store, resolveWith) => {
            store.put(record)
            resolveWith(record.key)
        })
    } finally {
        db.close()
    }
}

/**
 * Non-destructive: the record stays until it expires or is trimmed, so a reload of
 * the preview tab within the TTL still resolves the same media.
 */
export async function readDraftMedia(key: string): Promise<StoredMedia | null> {
    if (!key) return null

    const db = await openDb()
    if (!db) return null

    try {
        const record = await runTransaction<unknown>(db, 'readonly', (store, resolveWith) => {
            const request = store.get(key)
            request.onsuccess = () => resolveWith(request.result)
        })

        if (!isValidRecord(record) || Date.now() - record.createdAt > TTL_MS) return null
        return record.media
    } finally {
        db.close()
    }
}

/** Keeps only the newest records once the expired ones are gone. */
function trimToMaxRecords(store: IDBObjectStore, index: IDBIndex): void {
    const countRequest = store.count()
    countRequest.onsuccess = () => {
        let excess = countRequest.result - MAX_RECORDS
        if (excess <= 0) return

        const request = index.openCursor()
        request.onsuccess = () => {
            const cursor = request.result
            if (!cursor || excess <= 0) return
            cursor.delete()
            excess -= 1
            cursor.continue()
        }
    }
}

export async function pruneDraftMedia(): Promise<void> {
    const db = await openDb()
    if (!db) return

    try {
        await runTransaction<null>(db, 'readwrite', (store) => {
            const cutoff = Date.now() - TTL_MS
            const index = store.index(CREATED_AT_INDEX)
            const request = index.openCursor(IDBKeyRange.upperBound(cutoff))
            request.onsuccess = () => {
                const cursor = request.result
                if (cursor) {
                    cursor.delete()
                    cursor.continue()
                    return
                }
                trimToMaxRecords(store, index)
            }
        })
    } finally {
        db.close()
    }
}
