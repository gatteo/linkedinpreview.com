'use client'

import * as React from 'react'
import { UploadIcon } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const ACCEPTED_TYPES = ['.pdf', '.docx', '.txt', '.md']
const MAX_BYTES = 5 * 1024 * 1024

type FileInputProps = {
    onSubmit: (text: string) => void
    onBack: () => void
}

export function FileInput({ onSubmit, onBack }: FileInputProps) {
    const [isDragging, setIsDragging] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [extractedText, setExtractedText] = React.useState('')
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const processFile = async (file: File) => {
        if (file.size > MAX_BYTES) {
            toast.error('File is too large. Maximum size is 5MB.')
            return
        }

        const ext = file.name.split('.').pop()?.toLowerCase()
        setIsLoading(true)

        try {
            if (ext === 'txt' || ext === 'md') {
                const text = await readAsText(file)
                setExtractedText(text)
            } else {
                const formData = new FormData()
                formData.append('file', file)
                const res = await fetch('/api/extract', { method: 'POST', body: formData })
                if (!res.ok) throw new Error('Extraction failed')
                const data = await res.json()
                setExtractedText(data.text ?? '')
            }
        } catch {
            toast.error('Failed to extract text from file')
        } finally {
            setIsLoading(false)
        }
    }

    const readAsText = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve((e.target?.result as string) ?? '')
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsText(file)
        })

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) processFile(file)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processFile(file)
    }

    return (
        <div className='flex flex-col gap-3'>
            {extractedText.length === 0 ? (
                <div
                    role='button'
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                        'border-input flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
                        isDragging ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                        isLoading && 'pointer-events-none opacity-60',
                    )}>
                    {isLoading ? (
                        <div className='border-primary size-6 animate-spin rounded-full border-2 border-t-transparent' />
                    ) : (
                        <>
                            <UploadIcon className='text-muted-foreground size-7' />
                            <div>
                                <p className='text-sm font-medium'>Click or drag a file here</p>
                                <p className='text-muted-foreground mt-0.5 text-xs'>PDF, DOCX, TXT, MD - max 5MB</p>
                            </div>
                        </>
                    )}
                    <input
                        ref={fileInputRef}
                        type='file'
                        className='hidden'
                        accept={ACCEPTED_TYPES.join(',')}
                        onChange={handleFileChange}
                    />
                </div>
            ) : (
                <Textarea value={extractedText} readOnly className='min-h-40 resize-none' />
            )}

            <div className='flex justify-between gap-2'>
                <Button
                    variant='outline'
                    onClick={() => {
                        if (extractedText.length > 0) {
                            setExtractedText('')
                        } else {
                            onBack()
                        }
                    }}>
                    {extractedText.length > 0 ? 'Change file' : 'Back'}
                </Button>
                {extractedText.length > 0 && (
                    <Button onClick={() => onSubmit(extractedText)} disabled={extractedText.trim().length === 0}>
                        Use this text
                    </Button>
                )}
            </div>
        </div>
    )
}
