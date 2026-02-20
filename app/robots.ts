import { site } from '@/config/site'

const robots = () => {
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/'],
                disallow: ['/404', '/500', '/api/*', '/embed'],
            },
        ],
        sitemap: `${site.url}/sitemap.xml`,
        host: `${site.url}`,
    }
}

export default robots
