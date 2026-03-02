export const ApiRoutes = {
    Chat: '/api/chat',
    Suggestions: '/api/suggestions',
    Analyze: '/api/analyze',
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
    Changelog: '/changelog',
    Preview: '/preview',
    Compare: '/compare',
    ComparePost: (slug: string) => `/compare/${slug}`,
    Embed: '/embed',
    EmbedSection: '/#embed',
    Dashboard: '/dashboard',
    DashboardEditor: (draftId?: string) => (draftId ? `/dashboard/editor?draft=${draftId}` : '/dashboard/editor'),
    DashboardPosts: '/dashboard',
    DashboardBranding: '/dashboard/branding',
    DashboardSettings: '/dashboard/settings',
}
