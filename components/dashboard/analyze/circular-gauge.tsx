import { scoreColor } from '@/lib/analyze-utils'

export function CircularGauge({ score }: { score: number }) {
    const radius = 35
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference

    return (
        <svg width='80' height='80' viewBox='0 0 80 80'>
            <circle
                cx='40'
                cy='40'
                r={radius}
                fill='none'
                stroke='currentColor'
                strokeWidth='6'
                className='text-muted/30'
            />
            <circle
                cx='40'
                cy='40'
                r={radius}
                fill='none'
                stroke='currentColor'
                strokeWidth='6'
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap='round'
                className={scoreColor(score)}
                style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'center',
                    transition: 'stroke-dashoffset 0.5s ease',
                }}
            />
            <text
                x='40'
                y='40'
                textAnchor='middle'
                dominantBaseline='central'
                className='fill-foreground text-lg font-bold'
                fontSize='16'
                fontWeight='700'>
                {score}
            </text>
        </svg>
    )
}
