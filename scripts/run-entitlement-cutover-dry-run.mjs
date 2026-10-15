import { validateEntitlementCutoverDryRun } from '../lib/billing/entitlement-cutover-validator.ts'
import { syntheticEntitlementCutoverManifest } from '../tests/fixtures/entitlement-cutover-dry-run.synthetic.mjs'

const report = validateEntitlementCutoverDryRun(syntheticEntitlementCutoverManifest)
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
if (report.gate !== 'pass') process.exitCode = 1
