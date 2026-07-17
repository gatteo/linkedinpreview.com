'use client'

// The plan hook reads from the shared PlanProvider (mounted in the dashboard
// layout) so a purchase reflects everywhere at once. Re-exported here to keep the
// `@/hooks/use-plan` import path stable.
export { usePlan } from '@/components/dashboard/plan-provider'
