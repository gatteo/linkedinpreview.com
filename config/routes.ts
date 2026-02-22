export const ApiRoutes = {
    Generate: '/api/generate',
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
    Embed: '/embed',
    EmbedSection: '/#embed',
}
