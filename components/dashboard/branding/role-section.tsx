import { type BrandingRole } from '@/lib/branding'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { type SectionProps } from './types'

const ROLES: { value: BrandingRole; label: string }[] = [
    { value: 'founder', label: 'Founder / C-Level' },
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'team-lead', label: 'Team Lead' },
    { value: 'employee', label: 'Employee' },
    { value: 'creator', label: 'Creator' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'agency', label: 'Agency' },
]

export function RoleSection({ branding, onUpdate }: SectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Role</CardTitle>
                <CardDescription>Helps AI tailor content style and topics</CardDescription>
            </CardHeader>
            <CardContent>
                <Select value={branding.role} onValueChange={(val) => onUpdate({ role: val as BrandingRole })}>
                    <SelectTrigger className='max-w-sm'>
                        <SelectValue placeholder='Select your role' />
                    </SelectTrigger>
                    <SelectContent>
                        {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                                {r.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    )
}
