import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const paywallPath = fileURLToPath(new URL('../components/dashboard/onboarding/steps/paywall-step.tsx', import.meta.url))
const paywallSource = readFileSync(paywallPath, 'utf8')

test('paywall purchase CTA starts plan selection without a scroll gate', () => {
    assert.doesNotMatch(paywallSource, /ScrollProgressButton/)
    assert.doesNotMatch(paywallSource, /onb_paywall_gate_blocked/)
    assert.match(paywallSource, /<CTA onClick=\{startCheckout\}>/)
    assert.match(paywallSource, /selected === 'lifetime' \? 'Get lifetime' : 'Start monthly'/)
    assert.match(paywallSource, /track\('onb_paywall_scroll', \{ depth: milestone \}\)/)
    assert.match(paywallSource, /<OnboardingCheckout\s+plan=\{selected\}/)
    assert.match(paywallSource, /<GhostLink onClick=\{decline\}/)
    assert.match(paywallSource, /track\('onb_offer_select', \{ plan: selected \}\)[\s\S]*setCheckout\(true\)/)
})

test('EXP-9 renders and attributes the registered monthly-first offer', () => {
    assert.match(paywallSource, /useState<CheckoutPlan>\('monthly'\)/)
    assert.match(paywallSource, /variant: 'monthly_first'/)

    const monthlyIndex = paywallSource.indexOf("onClick={() => setSelected('monthly')}")
    const lifetimeIndex = paywallSource.indexOf('<GoldenTicket')
    assert.notEqual(monthlyIndex, -1)
    assert.notEqual(lifetimeIndex, -1)
    assert.ok(monthlyIndex < lifetimeIndex)

    const monthlyCard = paywallSource.slice(monthlyIndex, lifetimeIndex)
    assert.doesNotMatch(monthlyCard, /Most popular/)
    assert.match(monthlyCard, />Monthly</)
    assert.match(monthlyCard, /Billed monthly\. Cancel anytime\./)
    assert.match(monthlyCard, /PRICING\.monthly\.display/)
    assert.match(monthlyCard, />\/mo</)
    assert.match(paywallSource, /selected === 'lifetime' \? 'Get lifetime' : 'Start monthly'/)
})
