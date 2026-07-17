import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

import { type SectionProps } from './types'

export function PositioningSection({ branding, onUpdate }: SectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Positioning Statement</CardTitle>
                <CardDescription>
                    Guides AI content generation. Use the format: "I help [audience] achieve [outcome] by [method]"
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea
                    value={branding.positioning.statement}
                    onChange={(e) => onUpdate({ positioning: { statement: e.target.value } })}
                    placeholder='I help startup founders grow their LinkedIn presence by sharing actionable growth strategies'
                    rows={3}
                />
            </CardContent>
        </Card>
    )
}
