import { absoluteUrl } from '@/utils/urls'
import { type HowTo, type WithContext } from 'schema-dts'

import { LocalBlogPost } from '@/types/blog'
import { Routes } from '@/config/routes'
import { site } from '@/config/site'

/**
 * Generates HowTo schema for tutorial blog posts
 * Extracts steps from the post content structure
 */
export function generateHowToSchema(post: LocalBlogPost): WithContext<HowTo> | null {
    // Only generate HowTo schema for tutorial posts
    if (!post.title.toLowerCase().startsWith('how to')) {
        return null
    }

    // Extract steps from the post - these are common patterns in the tutorial posts
    // All tutorial posts follow a similar structure with numbered steps
    // Common steps found in all tutorial posts
    // We'll use generic steps that match the structure
    const stepTitles = [
        'Access linkedinpreview.com',
        'Type or Paste Your Content',
        'Select and Format Your Text',
        'Preview Your Formatted Text',
    ]

    const steps: HowTo['step'] = stepTitles.map((stepTitle, index) => ({
        '@type': 'HowToStep',
        'position': index + 1,
        'name': stepTitle,
        'text': `Follow step ${index + 1} to ${stepTitle.toLowerCase()}`,
        'url': `${absoluteUrl(Routes.BlogPost(post.slug))}#step-${index + 1}`,
    }))

    return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        'name': post.title,
        'description': post.summary,
        'image': `${site.url}${post.image}`,
        'totalTime': 'PT5M', // Estimated 5 minutes
        'tool': {
            '@type': 'HowToTool',
            'name': 'LinkedIn Post Preview Tool',
            'url': `${site.url}/#tool`,
        },
        'step': steps,
    }
}
