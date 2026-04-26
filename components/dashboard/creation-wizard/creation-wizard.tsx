'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { ApiRoutes, Routes } from '@/config/routes'
import { assembleBrandingContext } from '@/lib/ai-branding'
import { textToTipTapJson } from '@/lib/editor-utils'
import { cn } from '@/lib/utils'
import { useBranding } from '@/hooks/use-branding'
import { useDrafts } from '@/hooks/use-drafts'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { FileInput } from './file-input'
import { HookPicker } from './hook-picker'
import { NotesInput } from './notes-input'
import { SourcePicker, type SourceType } from './source-picker'
import { UrlInput } from './url-input'
import { VariantPicker } from './variant-picker'
import { VoiceInput } from './voice-input'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WizardStep = 'source' | 'input' | 'hooks' | 'variants'

type Hook = {
    text: string
    category: string
    type: string
}

type Variant = {
    text: string
    wordCount: number
    label?: string
}

type CreationWizardProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEP_TITLES: Record<WizardStep, string> = {
    source: 'Create a new post',
    input: 'Add your source',
    hooks: 'Choose a hook',
    variants: 'Pick a variant',
}

const STEP_DESCRIPTIONS: Record<WizardStep, string> = {
    source: 'Choose how you want to start',
    input: 'Provide your raw content and we will generate post options',
    hooks: 'Select the angle that fits best',
    variants: 'Pick the version you like most',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreationWizard({ open, onOpenChange }: CreationWizardProps) {
    const router = useRouter()
    const { createDraft, updateDraft } = useDrafts()
    const { branding } = useBranding()

    const [step, setStep] = React.useState<WizardStep>('source')
    const [source, setSource] = React.useState<SourceType | null>(null)
    const [sourceText, setSourceText] = React.useState('')
    const [hooks, setHooks] = React.useState<Hook[]>([])
    const [variants, setVariants] = React.useState<Variant[]>([])
    const [isGenerating, setIsGenerating] = React.useState(false)

    const reset = () => {
        setStep('source')
        setSource(null)
        setSourceText('')
        setHooks([])
        setVariants([])
        setIsGenerating(false)
    }

    const handleOpenChange = (value: boolean) => {
        if (!value) reset()
        onOpenChange(value)
    }

    const handleSourceSelect = async (selected: SourceType | 'blank') => {
        if (selected === 'blank') {
            try {
                const draft = await createDraft()
                onOpenChange(false)
                reset()
                router.push(Routes.DashboardEditor(draft.id))
            } catch {
                toast.error('Failed to create draft')
            }
            return
        }
        setSource(selected)
        setStep('input')
    }

    const fetchHooks = async (text: string) => {
        setIsGenerating(true)
        try {
            const brandingContext = assembleBrandingContext(branding)
            const res = await fetch(ApiRoutes.Generate, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'hooks', sourceText: text, brandingContext }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error((data as { error?: string }).error ?? 'Failed to generate hooks')
            }
            const data = await res.json()
            setHooks(data.hooks)
            setStep('hooks')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to generate hooks')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleInputSubmit = (text: string) => {
        setSourceText(text)
        fetchHooks(text)
    }

    const handleRegenerate = () => {
        fetchHooks(sourceText)
    }

    const handleHookSelect = async (hookText: string) => {
        setIsGenerating(true)
        try {
            const brandingContext = assembleBrandingContext(branding)
            const res = await fetch(ApiRoutes.Generate, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'posts', sourceText, hook: hookText, brandingContext }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error((data as { error?: string }).error ?? 'Failed to generate posts')
            }
            const data = await res.json()
            setVariants(data.posts)
            setStep('variants')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to generate posts')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleVariantSelect = async (variant: Variant) => {
        try {
            const content = textToTipTapJson(variant.text)
            const draft = await createDraft(content)
            if (variant.label) {
                await updateDraft(draft.id, { label: variant.label })
            }
            onOpenChange(false)
            reset()
            router.push(Routes.DashboardEditor(draft.id))
        } catch {
            toast.error('Failed to create draft')
        }
    }

    const handleBack = () => {
        if (step === 'input') {
            setStep('source')
            setSource(null)
        } else if (step === 'hooks') {
            setStep('input')
        } else if (step === 'variants') {
            setStep('hooks')
        }
    }

    const showBack = step !== 'source' && !isGenerating
    const isWide = step === 'hooks' || step === 'variants'

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className={cn('sm:max-w-md', isWide && 'sm:max-w-2xl')}>
                <DialogHeader>
                    <div className='flex items-center gap-2'>
                        {showBack && (
                            <Button
                                variant='ghost'
                                size='icon-sm'
                                onClick={handleBack}
                                className='text-muted-foreground -ml-1 shrink-0'>
                                <ChevronLeftIcon />
                                <span className='sr-only'>Back</span>
                            </Button>
                        )}
                        <DialogTitle>{STEP_TITLES[step]}</DialogTitle>
                    </div>
                    <DialogDescription>{STEP_DESCRIPTIONS[step]}</DialogDescription>
                </DialogHeader>

                <div className='pt-1'>
                    {step === 'source' && <SourcePicker onSelect={handleSourceSelect} />}

                    {step === 'input' && source === 'notes' && (
                        <NotesInput onSubmit={handleInputSubmit} onBack={handleBack} />
                    )}
                    {step === 'input' && source === 'voice' && (
                        <VoiceInput onSubmit={handleInputSubmit} onBack={handleBack} />
                    )}
                    {step === 'input' && source === 'file' && (
                        <FileInput onSubmit={handleInputSubmit} onBack={handleBack} />
                    )}
                    {step === 'input' && source === 'url' && (
                        <UrlInput onSubmit={handleInputSubmit} onBack={handleBack} />
                    )}

                    {step === 'hooks' && (
                        <>
                            {isGenerating ? (
                                <div className='text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm'>
                                    <Loader2Icon className='size-4 animate-spin' />
                                    Generating hooks...
                                </div>
                            ) : (
                                <HookPicker
                                    hooks={hooks}
                                    onSelect={handleHookSelect}
                                    onRegenerate={handleRegenerate}
                                    isRegenerating={isGenerating}
                                />
                            )}
                        </>
                    )}

                    {step === 'variants' && (
                        <>
                            {isGenerating ? (
                                <div className='text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm'>
                                    <Loader2Icon className='size-4 animate-spin' />
                                    Generating variants...
                                </div>
                            ) : (
                                <VariantPicker variants={variants} onSelect={handleVariantSelect} />
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
