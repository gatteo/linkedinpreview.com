'use client'

import * as React from 'react'
import { MicIcon, MicOffIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type AnyRecognition = any

type VoiceInputProps = {
    onSubmit: (text: string) => void
    onBack: () => void
}

function isSpeechSupported() {
    if (typeof window === 'undefined') return false
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
}

export function VoiceInput({ onSubmit, onBack }: VoiceInputProps) {
    const [isRecording, setIsRecording] = React.useState(false)
    const [transcript, setTranscript] = React.useState('')
    const recognitionRef = React.useRef<AnyRecognition>(null)
    const supported = isSpeechSupported()

    const startRecording = React.useCallback(() => {
        const win = window as AnyRecognition
        const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition
        const recognition: AnyRecognition = new Ctor()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: AnyRecognition) => {
            let full = ''
            for (let i = 0; i < event.results.length; i++) {
                full += event.results[i][0].transcript
            }
            setTranscript(full)
        }

        recognition.onerror = () => setIsRecording(false)
        recognition.onend = () => setIsRecording(false)

        recognitionRef.current = recognition
        recognition.start()
        setIsRecording(true)
    }, [])

    const stopRecording = React.useCallback(() => {
        recognitionRef.current?.stop()
        setIsRecording(false)
    }, [])

    React.useEffect(() => {
        return () => {
            recognitionRef.current?.stop()
        }
    }, [])

    if (!supported) {
        return (
            <div className='flex flex-col gap-3'>
                <div className='bg-muted rounded-lg p-4 text-center'>
                    <MicOffIcon className='text-muted-foreground mx-auto mb-2 size-8' />
                    <p className='text-sm font-medium'>Voice input not supported</p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                        Your browser does not support speech recognition. Try Chrome or Edge.
                    </p>
                </div>
                <Button variant='outline' onClick={onBack}>
                    Back
                </Button>
            </div>
        )
    }

    return (
        <div className='flex flex-col gap-3'>
            <div className='flex flex-col items-center gap-3 py-2'>
                <button
                    type='button'
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                        'relative flex size-16 items-center justify-center rounded-full transition-colors focus-visible:outline-none',
                        isRecording
                            ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                            : 'bg-primary/10 text-primary hover:bg-primary/20',
                    )}>
                    {isRecording && <span className='bg-destructive/30 absolute inset-0 animate-ping rounded-full' />}
                    <MicIcon className='size-7' />
                </button>
                <p className='text-muted-foreground text-xs'>
                    {isRecording ? 'Recording - click to stop' : 'Click to start recording'}
                </p>
            </div>

            {transcript.length > 0 && (
                <div className='border-input bg-muted/30 min-h-24 rounded-lg border px-3 py-2 text-sm'>
                    {transcript}
                </div>
            )}

            <div className='flex justify-between gap-2'>
                <Button variant='outline' onClick={onBack}>
                    Back
                </Button>
                <Button onClick={() => onSubmit(transcript)} disabled={transcript.trim().length === 0}>
                    Use this text
                </Button>
            </div>
        </div>
    )
}
