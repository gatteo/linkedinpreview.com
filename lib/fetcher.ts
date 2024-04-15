export async function fetcher<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const res = await fetch(input, init)
    return res.json() as Promise<T>
}
