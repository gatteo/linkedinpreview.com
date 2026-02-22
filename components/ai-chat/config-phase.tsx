import { Tone, TONE_OPTIONS } from '@/config/ai'
import { cn } from '@/lib/utils'
import { badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ConfigPhaseProps {
    topic: string
    onTopicChange: (topic: string) => void
    tone: Tone
    onToneChange: (tone: Tone) => void
    onGenerate: () => void
    isLoading: boolean
}

export function ConfigPhase({ topic, onTopicChange, tone, onToneChange, onGenerate, isLoading }: ConfigPhaseProps) {
    return (
        <div className='flex flex-1 flex-col gap-6 px-6 pb-6'>
            <div className='flex flex-col gap-2'>
                <label htmlFor='ai-topic' className='text-sm font-medium'>
                    Topic
                </label>
                <textarea
                    id='ai-topic'
                    value={topic}
                    onChange={(e) => onTopicChange(e.target.value)}
                    placeholder='What do you want to write about?'
                    rows={4}
                    maxLength={2000}
                    className='w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                    disabled={isLoading}
                />
            </div>

            <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium'>Tone</label>
                <div className='flex flex-wrap gap-2' role='radiogroup' aria-label='Tone'>
                    {TONE_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type='button'
                            role='radio'
                            aria-checked={tone === option.value}
                            onClick={() => onToneChange(option.value)}
                            className={cn(
                                badgeVariants({ variant: tone === option.value ? 'default' : 'outline' }),
                                'cursor-pointer',
                            )}>
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <Button onClick={onGenerate} disabled={!topic.trim() || isLoading} className='w-full'>
                {isLoading ? 'Generating...' : 'Generate Post'}
            </Button>
        </div>
    )
}
