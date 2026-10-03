const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface RecoveryClaimDependencies {
    getUser: () => Promise<{ id: string } | null>
    claimEntitlement: (args: {
        p_entitlement_id: string
        p_to_user_id: string
        p_challenge_id: string
    }) => Promise<{ data: boolean | null; error: Error | null }>
}

export async function handleRecoveryClaim(
    request: Request,
    dependencies: RecoveryClaimDependencies,
): Promise<Response> {
    let user: { id: string } | null
    try {
        user = await dependencies.getUser()
    } catch {
        return Response.json({ error: 'Recovery service unavailable' }, { status: 503 })
    }
    if (!user || !UUID.test(user.id)) return Response.json({ error: 'Authentication required' }, { status: 401 })

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return Response.json({ error: 'Invalid recovery claim' }, { status: 400 })
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return Response.json({ error: 'Invalid recovery claim' }, { status: 400 })
    }

    const { entitlementId, challengeId } = body as { entitlementId?: unknown; challengeId?: unknown }
    if (
        typeof entitlementId !== 'string' ||
        typeof challengeId !== 'string' ||
        !UUID.test(entitlementId) ||
        !UUID.test(challengeId)
    ) {
        return Response.json({ error: 'Invalid recovery claim' }, { status: 400 })
    }

    let result: { data: boolean | null; error: Error | null }
    try {
        result = await dependencies.claimEntitlement({
            p_entitlement_id: entitlementId,
            p_to_user_id: user.id,
            p_challenge_id: challengeId,
        })
    } catch {
        return Response.json({ error: 'Recovery service unavailable' }, { status: 503 })
    }

    if (result.error || result.data !== true)
        return Response.json({ error: 'Recovery claim unavailable' }, { status: 409 })

    return Response.json({ claimed: true })
}
