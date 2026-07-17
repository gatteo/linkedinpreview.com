import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import { type SectionProps } from './types'

export function FooterSection({ branding, onUpdate }: SectionProps) {
    const { footer } = branding

    return (
        <Card>
            <CardHeader>
                <CardTitle>Custom Footer</CardTitle>
                <CardDescription>Automatically append a signature or CTA to every generated post</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='flex items-center gap-3'>
                    <Switch
                        id='footer-enabled'
                        checked={footer.enabled}
                        onCheckedChange={(checked) => onUpdate({ footer: { ...footer, enabled: checked } })}
                    />
                    <Label htmlFor='footer-enabled' className='cursor-pointer'>
                        Enable custom footer
                    </Label>
                </div>
                {footer.enabled && (
                    <Textarea
                        value={footer.text}
                        onChange={(e) => onUpdate({ footer: { ...footer, text: e.target.value } })}
                        placeholder={
                            'e.g.\n\nFollow me for more tips on growing your LinkedIn presence.\n\n#LinkedIn #ContentMarketing'
                        }
                        rows={4}
                    />
                )}
            </CardContent>
        </Card>
    )
}
