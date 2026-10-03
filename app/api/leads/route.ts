export function POST() {
    return Response.json({ error: 'Lead capture is no longer available' }, { status: 410 })
}
