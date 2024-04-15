'use client'

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'

export function ProgressProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            {children}
            <ProgressBar height='4px' color={'#06b6d4'} options={{ showSpinner: false }} shallowRouting />
        </>
    )
}
