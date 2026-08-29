import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const sourceRoots = ['app', 'components', 'config', 'contents']
const bannedPatterns = [
    /SOCIAL_PROOF/,
    /aggregateRating/,
    /<StarRating\b/,
    /OB_TESTIMONIALS/,
    /OB_PW_TESTIMONIALS/,
    /OB_PROOF/,
    /ReviewCard/,
    /Trusted by thousands of LinkedIn creators/,
    /Von tausenden LinkedIn-Creators genutzt/,
    /See why thousands of professionals use our tool/,
    /11,400\+/,
    /12,000\+/,
    /2,000\+ reviews/,
    /seededSocialCounts/,
    /John Doe and \{others\} others/,
    /social\?\.others \?\? 169/,
    /social\?\.comments \?\? 4/,
    /social\?\.reposts \?\? 1/,
    /['"][^'"]*aggregateRating[^'"]*['"]\s*:/,
    /\b[1-5]\.\d\s*(?:\/|out of)\s*5\b/i,
    /\b(?:rating|rated|review score|stars?)\s*[:=]?\s*[1-5](?:\.\d)?\s*(?:\/|out of)\s*5\b/i,
    /\b[1-5](?:\.\d)?\s*(?:\/|out of)\s*5\s*(?:stars?|rating|reviews?)\b/i,
    /\b(?:from|based on)\s+\d[\d,]*\+?\s+(?:reviews?|ratings?|professionals|creators|users)\b/i,
    /\b(?:trusted|used)\s+by\s+(?:over\s+)?\d[\d,]*\+?\s+(?:professionals|creators|users)\b/i,
    /<Image\s+alt='Reaction icons'/,
]

function sourceFiles(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) return sourceFiles(path)
        return /\.(ts|tsx|js|jsx|mjs|json|mdx)$/.test(entry.name) ? [path] : []
    })
}

const violations = sourceRoots.flatMap((sourceRoot) =>
    sourceFiles(join(root, sourceRoot)).flatMap((path) => {
        const contents = readFileSync(path, 'utf8')
        return bannedPatterns
            .filter((pattern) => pattern.test(contents))
            .map((pattern) => `${path.replace(`${root}/`, '')}: ${pattern}`)
    }),
)

if (existsSync(join(root, 'config/social-proof.ts'))) {
    violations.push('config/social-proof.ts must be removed until a rating source is available')
}

if (existsSync(join(root, 'components/home/star-rating.tsx'))) {
    violations.push('components/home/star-rating.tsx must be removed with the unsupported rating claim')
}

if (violations.length) {
    console.error('Unsupported public social-proof claims remain:\n' + violations.join('\n'))
    process.exit(1)
}

console.log('Social-proof claim contract passed.')
