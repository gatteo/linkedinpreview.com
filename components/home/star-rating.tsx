import { Icons } from '../icon'

const STARS = [1, 2, 3, 4, 5] as const

export function StarRating() {
    return (
        <div className='flex gap-0.5' aria-label='5 star rating'>
            {STARS.map((n) => (
                <Icons.star key={n} className='fill-warning text-warning size-4' />
            ))}
        </div>
    )
}
