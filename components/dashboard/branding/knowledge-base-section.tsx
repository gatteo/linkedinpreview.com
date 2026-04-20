import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

import { type SectionProps } from './types'

export function KnowledgeBaseSection({ branding, onUpdate }: SectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Knowledge Base</CardTitle>
                <CardDescription>
                    Extra context about you, your business, products, or audience. AI uses this when generating content.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea
                    value={branding.knowledgeBase.notes}
                    onChange={(e) => onUpdate({ knowledgeBase: { notes: e.target.value } })}
                    placeholder={
                        'e.g. My company builds productivity software for remote teams. Our main product is TaskFlow, used by 10k+ companies. Our audience is mid-size SaaS companies with 50-500 employees...'
                    }
                    rows={6}
                />
            </CardContent>
        </Card>
    )
}
