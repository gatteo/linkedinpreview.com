export const ApiRoutes = {
    Chat: '/api/chat',
    Suggestions: '/api/suggestions',
    Analyze: '/api/analyze',
    LinkPreview: '/api/link-preview',
}

export const Routes = {
    Home: '',
    Tool: '/#tool',
    MainFeatures: '/#main-features',
    AllFeatures: '/#all-features',
    HowItWorks: '/#how-it-works',
    Faqs: '/#faqs',
    Blog: '/blog',
    BlogPost: (slug: string) => `/blog/${slug}`,
    Changelog: '/changelog',
    Preview: '/preview',
    Compare: '/compare',
    ComparePost: (slug: string) => `/compare/${slug}`,
    Formatter: '/formatter',
    Generator: '/linkedin-post-generator',
    LinkPreview: '/linkedin-link-preview',
    Vorschau: '/linkedin-vorschau',
    Embed: '/embed',
    EmbedSection: '/#embed',
}
