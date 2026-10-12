const CREATE_CHECKPOINTS = ['absent_user', 'preprocessing', 'insert_select', 'result_mapping', 'unknown'] as const
const ERROR_CATEGORIES = [
    'auth_unavailable',
    'auth_error',
    'permission_denied',
    'constraint_violation',
    'response_cardinality',
    'unknown',
] as const
const ERROR_CODES = new Map<string, (typeof ERROR_CATEGORIES)[number]>([
    ['42501', 'permission_denied'],
    ['23502', 'constraint_violation'],
    ['23503', 'constraint_violation'],
    ['23505', 'constraint_violation'],
    ['23514', 'constraint_violation'],
    ['PGRST301', 'auth_error'],
    ['PGRST302', 'auth_error'],
    ['PGRST303', 'auth_error'],
    ['PGRST116', 'response_cardinality'],
])
const ERROR_STATUSES = new Set([200, 201, 204, 400, 401, 403, 404, 406, 408, 409, 413, 422, 429, 500, 502, 503, 504])

export type DraftCreateDiagnostics = {
    create_checkpoint?: (typeof CREATE_CHECKPOINTS)[number]
    create_error_category?: (typeof ERROR_CATEGORIES)[number]
    create_error_status?: number
}

function ownValue(value: unknown, key: string): unknown {
    try {
        if (!value || (typeof value !== 'object' && typeof value !== 'function')) return undefined
        return Object.getOwnPropertyDescriptor(value, key)?.value
    } catch {
        return undefined
    }
}

function errorStatus(value: unknown): number | undefined {
    return typeof value === 'number' && ERROR_STATUSES.has(value) ? value : undefined
}

export function recordDraftCreateError(
    diagnostics: DraftCreateDiagnostics | undefined,
    error: unknown,
    response?: unknown,
) {
    if (!diagnostics) return
    const code = ownValue(error, 'code')
    diagnostics.create_error_category = (typeof code === 'string' ? ERROR_CODES.get(code) : undefined) ?? 'unknown'
    diagnostics.create_error_status =
        errorStatus(ownValue(response, 'status')) ?? errorStatus(ownValue(error, 'status'))
}

export function draftCreateFailureProperties(diagnostics?: DraftCreateDiagnostics) {
    const checkpoint = ownValue(diagnostics, 'create_checkpoint') as DraftCreateDiagnostics['create_checkpoint']
    const category = ownValue(diagnostics, 'create_error_category') as DraftCreateDiagnostics['create_error_category']
    const status = errorStatus(ownValue(diagnostics, 'create_error_status'))
    return {
        create_checkpoint: checkpoint && CREATE_CHECKPOINTS.includes(checkpoint) ? checkpoint : 'unknown',
        create_error_category: category && ERROR_CATEGORIES.includes(category) ? category : 'unknown',
        ...(status === undefined ? {} : { create_error_status: status }),
    }
}
