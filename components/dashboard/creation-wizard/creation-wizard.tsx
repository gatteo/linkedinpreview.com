'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useDrafts } from '@/hooks/use-drafts'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { FileInput } from './file-input'
import { NotesInput } from './notes-input'
import { SourcePicker, type SourceType } from './source-picker'
import { UrlInput } from './url-input'
import { VoiceInput } from './voice-input'

type WizardStep = 'source' | 'input' | 'hooks' | 'variants'

interface CreationWizardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

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

export function CreationWizard({ open, onOpenChange }: CreationWizardProps) {
    const router = useRouter()
    const { createDraft } = useDrafts()

    const [step, setStep] = React.useState<WizardStep>('source')
    const [source, setSource] = React.useState<SourceType | null>(null)
    const [sourceText, setSourceText] = React.useState('')

    const reset = () => {
        setStep('source')
        setSource(null)
        setSourceText('')
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
                router.push(`/dashboard/editor?draft=${draft.id}`)
            } catch {
                toast.error('Failed to create draft')
            }
            return
        }
        setSource(selected)
        setStep('input')
    }

    const handleInputSubmit = (text: string) => {
        setSourceText(text)
        // TODO (Task 8): trigger hook generation API call here and advance to 'hooks' step
        // For now, just create a blank draft and navigate
        createDraft()
            .then((draft) => {
                onOpenChange(false)
                reset()
                router.push(`/dashboard/editor?draft=${draft.id}`)
            })
            .catch(() => {
                toast.error('Failed to create draft')
            })
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

    const showBack = step !== 'source'

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className='sm:max-w-md'>
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
                        <div className='text-muted-foreground py-8 text-center text-sm'>Hook picker coming soon...</div>
                    )}

                    {step === 'variants' && (
                        <div className='text-muted-foreground py-8 text-center text-sm'>
                            Variant picker coming soon...
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
