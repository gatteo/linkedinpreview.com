import assert from 'node:assert/strict'
import test from 'node:test'

import { browser, hooks, loadTS } from './helpers/component-harness.mjs'

const pricing = await loadTS('config/pricing.ts')
const monthly = await loadTS('lib/monthly-offer.ts', { '@/config/entry-sources': {} })
const enrollment = {
    enrollmentId: '11111111-1111-4111-8111-111111111111',
    eligibilityAt: '2026-10-08T11:02:38.000Z',
    entrySource: 'tool_header',
    billingState: 'free',
    identityState: 'anonymous',
    releaseSha: 'a'.repeat(40),
    deviceClass: 'mobile',
}
const lineText = 'Prefer a one-time payment? Lifetime Pro: $39.99'
function nodes(tree) {
    if (!tree || typeof tree !== 'object') return []
    if (Array.isArray(tree)) return tree.flatMap(nodes)
    return [tree, ...nodes(tree.props?.children)]
}

function text(tree) {
    if (tree == null || typeof tree === 'boolean') return ''
    if (Array.isArray(tree)) return tree.map(text).join('')
    return typeof tree === 'object' ? text(tree.props?.children) : String(tree)
}

async function offer() {
    const h = hooks()
    const events = []
    const checkout = () => null
    const cta = () => null
    const answers = { profile: { name: 'Private fixture name' }, frequency: 1, topics: ['Private draft topic'] }
    const { MonthlyOffer } = await loadTS(
        'components/dashboard/onboarding/steps/paywall-step.tsx',
        {
            'react': h.react,
            'react/jsx-runtime': h.jsx,
            'framer-motion': { motion: {} },
            'lucide-react': {},
            '@/config/onboarding-flow': {
                OB_FEATURES: [],
                OB_FEATURES_MORE: [],
                OB_PW_TESTIMONIALS: [],
                OB_PROOF: {},
                OB_TICKET: {},
                growthCards: () => [],
                languageCodePair: () => null,
                obGoal: () => ({}),
                obVoice: () => ({ title: 'Voice' }),
            },
            '@/config/onboarding-personalization': { rolePlural: () => 'Creators' },
            '@/config/pricing': pricing,
            '@/config/social-proof': { SOCIAL_PROOF: {} },
            '@/lib/monthly-offer': monthly,
            '@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' ') },
            '@/hooks/use-plan': { usePlan: () => ({ refresh() {} }) },
            '@/components/dashboard/auth-provider': {},
            '@/components/tool/preview/post-card': {},
            '@/components/tool/preview/preview-size-context': {},
            '../ai': { track: (event, props) => events.push({ event, props }) },
            '../charts': {},
            '../context': {
                useOnboarding: () => ({ answers, finishOffer() {}, setUninterruptible() {}, role: 'creator' }),
            },
            '../icons': {},
            '../primitives': { firstName: () => '', CTA: cta },
            '../types': { takeCheckoutPending: () => null },
            '../use-scroll-gate': { useScrollGate() {} },
            './checkout': { OnboardingCheckout: checkout },
        },
        { window: browser('https://preview.invalid/dashboard') },
    )
    return { render: () => h.render(() => MonthlyOffer({ enrollment })), events, checkout, cta }
}

function line(tree) {
    return nodes(tree).find((node) => node.type === 'button' && text(node) === lineText)
}

for (const plan of ['monthly', 'lifetime']) {
    test(`existing ${plan} choice and primary CTA keep their checkout behavior`, async () => {
        const o = await offer()
        let tree = o.render()
        assert.ok(line(tree))
        assert.ok(nodes(tree).some((node) => node.type === o.cta && text(node) === 'Start monthly'))
        if (plan === 'lifetime') {
            nodes(tree)
                .find((node) => node.props?.onSelect)
                ?.props.onSelect()
            tree = o.render()
        }
        nodes(tree)
            .find((node) => node.type === o.cta)
            .props.onClick()
        const checkout = nodes(o.render()).find((node) => node.type === o.checkout)
        assert.equal(checkout.props.plan, plan)
        assert.equal(checkout.props.source, 'onboarding')
        assert.equal(o.events.filter(({ event }) => event === 'offer_lifetime_line_clicked').length, 0)
    })
}

test('additive line opens lifetime directly from monthly default without stale state or content capture', async () => {
    const o = await offer()
    line(o.render()).props.onClick()
    let tree = o.render()
    let checkout = nodes(tree).find((node) => node.type === o.checkout)
    assert.equal(checkout.props.plan, 'lifetime')
    assert.equal(checkout.props.source, 'onboarding')
    const clicks = o.events.filter(({ event }) => event === 'offer_lifetime_line_clicked')
    assert.equal(clicks.length, 1)
    assert.deepEqual(JSON.parse(JSON.stringify(clicks[0].props)), {
        ...monthly.monthlyOfferProperties(enrollment),
        plan: 'lifetime',
    })
    assert.equal(clicks[0].props.eligibility_at, enrollment.eligibilityAt)
    assert.doesNotMatch(JSON.stringify(clicks), /Private fixture|Private draft/)
    const selections = o.events.filter(({ event }) => event === 'onb_offer_select')
    assert.equal(selections.length, 1)
    assert.equal(selections[0].props.plan, 'lifetime')

    checkout.props.onError()
    tree = o.render()
    assert.match(text(tree), /Checkout is not available right now/)
    line(tree).props.onClick()
    checkout = nodes(o.render()).find((node) => node.type === o.checkout)
    assert.equal(checkout.props.plan, 'lifetime')

    nodes(o.render())
        .find((node) => node.type === 'button' && text(node).includes('Back to your plan'))
        .props.onClick()
    tree = o.render()
    assert.ok(line(tree))
    assert.ok(nodes(tree).some((node) => node.type === o.cta && text(node) === 'Get lifetime'))
    assert.equal(enrollment.eligibilityAt, '2026-10-08T11:02:38.000Z')
})
