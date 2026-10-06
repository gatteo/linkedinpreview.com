import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import * as React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

function loadComponent(path, mocks = {}) {
    const url = new URL(`../${path}`, import.meta.url)
    const source = readFileSync(url, 'utf8')
    const compiled = ts.transpileModule(source, {
        compilerOptions: {
            esModuleInterop: true,
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
        },
        fileName: fileURLToPath(url),
    }).outputText
    const loadedModule = { exports: {} }
    runInNewContext(compiled, {
        exports: loadedModule.exports,
        module: loadedModule,
        require(specifier) {
            if (specifier === 'react/jsx-runtime') return jsxRuntime
            assert.ok(specifier in mocks, `Missing purchase-policy mock: ${specifier}`)
            return mocks[specifier]
        },
    })
    return loadedModule.exports
}

const pricing = loadComponent('config/pricing.ts')
const monthlyCopy = '7-day money-back guarantee'
const lifetimeCopy = 'Lifetime purchases are non-refundable'
const emptyComponent = () => null
const passthrough = ({ children }) => React.createElement('div', null, children)
const icons = new Proxy({}, { get: () => emptyComponent })

function hooks(states) {
    let index = 0
    return {
        ...React,
        useState: (initial) => [index < states.length ? states[index++] : initial, () => {}],
        useEffect: () => {},
        useRef: (current) => ({ current }),
    }
}

function textOf(node) {
    if (node == null || typeof node === 'boolean') return ''
    if (typeof node !== 'object') return String(node)
    if (Array.isArray(node)) return node.map(textOf).join(' ')
    return textOf(node.props?.children)
}

function upgrade(selected, error = false) {
    const { UpgradeDialog } = loadComponent('components/dashboard/upgrade-dialog.tsx', {
        'react': hooks([selected, error, false]),
        'lucide-react': icons,
        '@/config/pricing': pricing,
        '@/hooks/use-plan': { usePlan: () => ({ isPaid: false, refresh() {} }) },
        '@/components/ui/button': { Button: passthrough },
        '@/components/ui/dialog': {
            Dialog: passthrough,
            DialogContent: passthrough,
            DialogDescription: passthrough,
            DialogTitle: passthrough,
        },
        '@/components/dashboard/onboarding/steps/checkout': { OnboardingCheckout: emptyComponent },
        './onboarding/ai': { track() {} },
    })
    return UpgradeDialog({ open: true, onOpenChange() {} })
}

function paywall(selected) {
    const { MonthlyOffer } = loadComponent('components/dashboard/onboarding/steps/paywall-step.tsx', {
        'react': hooks([selected, false, false]),
        'framer-motion': { motion: { b: passthrough } },
        'lucide-react': icons,
        '@/config/onboarding-flow': {
            OB_FEATURES: [],
            OB_FEATURES_MORE: [],
            OB_IDEA_PILLARS: [],
            OB_PROOF: { professionals: 'Synthetic proof', reviewsLine: 'Synthetic reviews' },
            OB_PW_TESTIMONIALS: [],
            OB_TICKET: { spotsStart: 10 },
            growthCards: () => [],
            languageCodePair: () => null,
            obGoal: () => ({ priceLine: 'Synthetic price headline' }),
            obVoice: () => ({ title: 'Synthetic voice' }),
        },
        '@/config/onboarding-personalization': { rolePlural: () => 'Creators' },
        '@/config/pricing': pricing,
        '@/config/social-proof': { SOCIAL_PROOF: { rating: 'Synthetic rating', count: 'Synthetic count' } },
        '@/lib/utils': { cn: (...classes) => classes.filter(Boolean).join(' ') },
        '@/lib/monthly-offer': { monthlyOfferProperties: () => ({}) },
        '@/components/dashboard/auth-provider': { useAuth: () => ({}) },
        '@/hooks/use-plan': { usePlan: () => ({ refresh() {} }) },
        '@/components/tool/preview/post-card': { PostCard: emptyComponent },
        '@/components/tool/preview/preview-size-context': { ScreenSizeProvider: passthrough },
        '../ai': { firstName: () => '', track() {} },
        '../charts': { GrowthCard: emptyComponent },
        '../context': {
            useOnboarding: () => ({
                answers: { profile: { name: '' }, frequency: 1, topics: [], postIdeas: [] },
                finishOffer() {},
                setUninterruptible() {},
                role: 'creator',
            }),
        },
        '../icons': { iconFor: () => emptyComponent },
        '../primitives': new Proxy({ firstName: () => '' }, { get: (target, key) => target[key] ?? passthrough }),
        '../types': { takeCheckoutPending: () => null },
        '../use-scroll-gate': { useScrollGate() {} },
        './checkout': { OnboardingCheckout: emptyComponent },
    })
    return MonthlyOffer({ enrollment: {} })
}

test('display policy keeps prices and the monthly window unchanged', () => {
    assert.equal(pricing.MONEY_BACK_DAYS, 7)
    assert.equal(pricing.PRICING.monthly.amount, 11.99)
    assert.equal(pricing.PRICING.lifetime.amount, 39.99)
    assert.equal(pricing.purchasePolicyCopy('monthly'), monthlyCopy)
    assert.equal(pricing.purchasePolicyCopy('lifetime'), lifetimeCopy)
})

test('rendered terms scope prospective lifetime policy and retain mandatory rights', () => {
    const { default: Terms } = loadComponent('app/(main)/terms/page.tsx', {
        '@/utils/urls': { absoluteUrl: (path) => path },
        '@/config/routes': { Routes: { Terms: '/terms' } },
    })
    const html = renderToStaticMarkup(React.createElement(Terms))
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
    assert.match(html, /Last updated: October 5, 2026/)
    assert.match(html, /one-time payment of \$39\.99.*lifetime of the product.*fair-use limits/)
    assert.match(html, /lifetime purchases are non-refundable and all sales are final/)
    assert.match(html, /7-day money-back guarantee for Monthly Pro.*first monthly Pro payment.*within 7 days/)
    assert.match(html, /does not apply to lifetime purchases/)
    assert.match(html, /new purchases made from publication.*October 5, 2026/)
    assert.match(html, /does not retroactively change the terms applicable to earlier purchases/)
    assert.match(html, /\$11\.99 per month.*Cancel any time from Settings.*end of the paid period/)
    assert.match(html, /Nothing in these terms limits liability that cannot be limited by law/)
    assert.match(html, /consumers keep all mandatory protections of their country of residence/)
    assert.match(html, /governed by Italian law.*mandatory provisions of the law of your country of residence/)
    assert.doesNotMatch(html, /not happy with a purchase/)
})

for (const plan of ['monthly', 'lifetime']) {
    test(`onboarding ${plan} selection renders only its refund policy`, () => {
        const text = textOf(paywall(plan))
        assert.ok(text.includes(plan === 'monthly' ? monthlyCopy : lifetimeCopy))
        assert.ok(!text.includes(plan === 'monthly' ? lifetimeCopy : monthlyCopy))
        assert.ok(text.includes('Continue on the free plan'))
        assert.ok(text.includes(plan === 'monthly' ? 'Start monthly' : 'Get lifetime'))
    })
    test(`upgrade ${plan} checkout selection renders only its refund policy`, () => {
        const text = textOf(upgrade(plan))
        assert.ok(text.includes(plan === 'monthly' ? monthlyCopy : lifetimeCopy))
        assert.ok(!text.includes(plan === 'monthly' ? lifetimeCopy : monthlyCopy))
        assert.ok(text.includes('Back to plans'))
    })
}

test('upgrade plan picker and checkout-error fallback show scoped policy on each card', () => {
    for (const tree of [upgrade(null), upgrade('lifetime', true)]) {
        const text = textOf(tree)
        assert.ok(text.includes(monthlyCopy))
        assert.ok(text.includes(lifetimeCopy))
        assert.ok(text.includes('Best value'))
        assert.ok(text.includes('Higher daily AI limits'))
        assert.ok(text.includes('Carousels, calendar & analytics'))
        assert.ok(text.includes('Cancel anytime.'))
    }
})
