'use client'

import { motion } from 'framer-motion'

import { staggerContainer, staggerItem } from '@/lib/motion'

import { useOnboarding } from '../context'
import { CTA, firstName, H1, LinkedInCard, LiveChip, PersonAvatar, Sub } from '../primitives'

// ---------------------------------------------------------------------------
// 03 · Reassure - the screen that sets up the whole question sequence and makes
// the async masking explicit: "I've got your profile, the analysis is running,
// answer a few questions meanwhile." Everything on the card is real fetched
// data; missing rows hide.
// ---------------------------------------------------------------------------

// Country-name → ISO code for the greeting flag. Best-effort: no match = no flag.
const COUNTRY_CODES: Record<string, string> = {
    'italy': 'IT',
    'united states': 'US',
    'united kingdom': 'GB',
    'germany': 'DE',
    'france': 'FR',
    'spain': 'ES',
    'portugal': 'PT',
    'netherlands': 'NL',
    'switzerland': 'CH',
    'austria': 'AT',
    'belgium': 'BE',
    'sweden': 'SE',
    'norway': 'NO',
    'denmark': 'DK',
    'finland': 'FI',
    'poland': 'PL',
    'ireland': 'IE',
    'canada': 'CA',
    'australia': 'AU',
    'brazil': 'BR',
    'india': 'IN',
    'japan': 'JP',
}

function flagFor(location: string | undefined): string {
    const lower = (location ?? '').toLowerCase()
    const match = Object.keys(COUNTRY_CODES).find((name) => lower.includes(name))
    if (!match) return ''
    return COUNTRY_CODES[match]
        .split('')
        .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
        .join('')
}

export function ReassureStep() {
    const { answers, goNext } = useOnboarding()
    const fn = firstName(answers.profile.name)
    const flag = flagFor(answers.identity?.location)
    const analyzing = answers.richStatus === 'pending'

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col'>
            <motion.div variants={staggerItem} className='text-center'>
                <div className='mb-4 flex justify-center'>
                    <PersonAvatar name={answers.profile.name} src={answers.profile.avatarUrl} size={92} ring />
                </div>
                <H1 className='mb-0 text-center'>
                    {fn ? `Nice to meet you, ${fn}!` : 'Nice to meet you!'}
                    {flag ? ` ${flag}` : ''}
                </H1>
                {analyzing && (
                    <div className='mt-3.5'>
                        <LiveChip>Analyzing your posts in the background…</LiveChip>
                    </div>
                )}
            </motion.div>

            <motion.div variants={staggerItem} className='my-6'>
                <LinkedInCard profile={answers.profile} identity={answers.identity} />
            </motion.div>

            <motion.div variants={staggerItem}>
                <Sub className='mx-auto mb-[22px] text-center'>
                    While that runs, a few quick questions so your strategy fits <strong>you</strong>, not a template.
                </Sub>
                <CTA onClick={goNext}>Start personalization</CTA>
            </motion.div>
        </motion.div>
    )
}
