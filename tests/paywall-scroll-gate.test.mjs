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
