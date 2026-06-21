'use client'

// ---------------------------------------------------------------------------
// AI carousel generation: turn a topic, pasted text, or article URL into a
// fully laid-out, on-brand deck. Calls /api/carousel/generate (branding-aware),
// maps the returned outline onto a CarouselDocument, and loads it into the
// editor. URL sources are extracted first via /api/extract (reused).
// ---------------------------------------------------------------------------
import * as React from 'react'
import { SparklesIcon } from 'lucide-react'
import { toast } from 'sonner'

import { assembleBrandingContext } from '@/lib/ai-branding'
import { documentFromAiSlides, type AiSlide } from '@/lib/carousel/ai-map'
import { useBranding } from '@/hooks/use-branding'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

import { useStoreApi } from '../../use-carousel-store'

type SourceTab = 'topic' | 'text' | 'url'

const TYPE_OPTIONS = [
    { value: 'auto', label: 'Auto (let AI choose)' },
    { value: 'listicle', label: 'Numbered list' },
    { value: 'howto', label: 'How-to guide' },
    { value: 'story', label: 'Story' },
    { value: 'comparison', label: 'Comparison' },
    { value: 'data', label: 'Data / stats' },
]

export function AiGenerateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    const store = useStoreApi()
    const { branding } = useBranding()
    const [tab, setTab] = React.useState<SourceTab>('topic')
    const [topic, setTopic] = React.useState('')
    const [text, setText] = React.useState('')
    const [url, setUrl] = React.useState('')
    const [carouselType, setCarouselType] = React.useState('auto')
    const [targetSlides, setTargetSlides] = React.useState(8)
    const [isLoading, setIsLoading] = React.useState(false)

    const reset = () => {
        setTopic('')
        setText('')
        setUrl('')
    }

    const handleGenerate = async () => {
        let content = ''
        let source: 'topic' | 'text' = 'topic'
        if (tab === 'topic') {
            content = topic.trim()
            source = 'topic'
        } else if (tab === 'text') {
            content = text.trim().slice(0, 20_000)
            source = 'text'
        } else {
            // URL: extract to text first
            if (!url.trim()) return
            setIsLoading(true)
            try {
                const res = await fetch('/api/extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url.trim() }),
                })
                if (!res.ok) throw new Error('extract')
                const data = await res.json()
                content = `${data.title ? data.title + '\n\n' : ''}${data.text ?? ''}`.slice(0, 20_000)
            } catch {
                setIsLoading(false)
                toast.error('Could not read that URL. Try pasting the text instead.')
                return
            }
            source = 'text'
        }

        if (!content) {
            toast.error('Add something for the AI to work with.')
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch('/api/carousel/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source,
                    content,
                    carouselType,
                    targetSlides,
                    brandingContext: assembleBrandingContext(branding) || undefined,
                }),
            })
            if (res.status === 429) {
                toast.error('You have hit the daily AI carousel limit. Try again tomorrow.')
                return
            }
            if (!res.ok) throw new Error('generate')
            const data = (await res.json()) as { slides: AiSlide[] }
            if (!data.slides?.length) throw new Error('empty')

            const snap = store.getSnapshot()
            const doc = documentFromAiSlides(data.slides, {
                themeId: snap.doc.themeId,
                ratio: snap.doc.canvas.ratio,
                brand: {
                    name: snap.doc.brandChrome.name,
                    handle: snap.doc.brandChrome.handle,
                    avatarUrl: snap.doc.brandChrome.avatarUrl,
                },
            })
            store.loadDocument(doc, { resetHistory: false })
            store.selectSlide(doc.slides[0]?.id ?? null)
            toast.success(`Generated a ${doc.slides.length}-slide carousel - undo to revert`)
            reset()
            onOpenChange(false)
        } catch {
            toast.error('Generation failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-lg'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <SparklesIcon className='text-primary size-5' />
                        Generate with AI
                    </DialogTitle>
                    <DialogDescription>
                        Turn a topic, your notes, or an article into a ready-to-edit carousel. Your branding shapes the
                        voice.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={tab} onValueChange={(v) => setTab(v as SourceTab)}>
                    <TabsList className='grid w-full grid-cols-3'>
                        <TabsTrigger value='topic'>Topic</TabsTrigger>
                        <TabsTrigger value='text'>Paste text</TabsTrigger>
                        <TabsTrigger value='url'>From URL</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className='space-y-4'>
                    {tab === 'topic' ? (
                        <Input
                            placeholder='e.g. 5 mistakes new founders make when raising'
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            autoFocus
                        />
                    ) : tab === 'text' ? (
                        <Textarea
                            placeholder='Paste a post, notes, or an outline...'
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className='min-h-32'
                        />
                    ) : (
                        <Input
                            type='url'
                            placeholder='https://example.com/article'
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                    )}

                    <div className='grid grid-cols-2 gap-3'>
                        <div className='space-y-1.5'>
                            <Label className='text-xs'>Format</Label>
                            <Select value={carouselType} onValueChange={setCarouselType}>
                                <SelectTrigger className='w-full'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TYPE_OPTIONS.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-1.5'>
                            <Label className='text-xs'>Slides: {targetSlides}</Label>
                            <input
                                type='range'
                                min={4}
                                max={15}
                                value={targetSlides}
                                onChange={(e) => setTargetSlides(Number(e.target.value))}
                                className='accent-primary mt-2.5 h-1.5 w-full cursor-pointer'
                            />
                        </div>
                    </div>
                </div>

                <Button onClick={handleGenerate} disabled={isLoading} className='w-full'>
                    {isLoading ? (
                        <span className='border-primary-foreground size-4 animate-spin rounded-full border-2 border-t-transparent' />
                    ) : (
                        <>
                            <SparklesIcon className='size-4' />
                            Generate carousel
                        </>
                    )}
                </Button>
            </DialogContent>
        </Dialog>
    )
}
