export const ApiRoutes = {
    Chat: '/api/chat',
    Suggestions: '/api/suggestions',
    Analyze: '/api/analyze',
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
    Compare: '/compare',
    ComparePost: (slug: string) => `/compare/${slug}`,
    Embed: '/embed',
    EmbedSection: '/#embed',
}
