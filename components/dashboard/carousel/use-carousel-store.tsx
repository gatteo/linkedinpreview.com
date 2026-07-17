'use client'

import * as React from 'react'

import { type CarouselStore, type EditorSnapshot } from '@/lib/carousel/store'

// ---------------------------------------------------------------------------
// React bindings for the carousel editor store. The store itself is a plain
// object (lib/carousel/store.ts); here we expose it through Context and a
// selector hook backed by useSyncExternalStore. The selector result is cached
// so object/array selectors stay referentially stable and don't loop.
// ---------------------------------------------------------------------------

const StoreContext = React.createContext<CarouselStore | null>(null)

export function CarouselStoreProvider({ store, children }: { store: CarouselStore; children: React.ReactNode }) {
    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStoreApi(): CarouselStore {
    const store = React.useContext(StoreContext)
    if (!store) throw new Error('useStoreApi must be used within a CarouselStoreProvider')
    return store
}

export function useCarousel<T>(selector: (s: EditorSnapshot) => T, isEqual: (a: T, b: T) => boolean = Object.is): T {
    const store = useStoreApi()
    const cache = React.useRef<{ value: T } | null>(null)
    const getSnapshot = React.useCallback(() => {
        const next = selector(store.getSnapshot())
        if (cache.current && isEqual(cache.current.value, next)) return cache.current.value
        cache.current = { value: next }
        return next
    }, [store, selector, isEqual])
    return React.useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot)
}

export function shallowArrayEqual<T>(a: readonly T[], b: readonly T[]): boolean {
    if (a === b) return true
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false
    return true
}
