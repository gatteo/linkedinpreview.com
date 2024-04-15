import { DependencyList, useEffect } from 'react'

function useDebounce(callback: () => void, delay: number, dependencies: DependencyList): void {
    useEffect(() => {
        const handler = setTimeout(() => {
            callback()
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, dependencies)
}

export default useDebounce
