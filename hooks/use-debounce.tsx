import { useEffect, useRef } from 'react'

function useDebounce(callback: () => void, delay: number): void {
    const callbackRef = useRef(callback)

    useEffect(() => {
        callbackRef.current = callback
    })

    useEffect(() => {
        const handler = setTimeout(() => {
            callbackRef.current()
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [delay])
}

export default useDebounce
