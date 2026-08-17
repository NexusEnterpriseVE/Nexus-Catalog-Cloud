export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json; charset=utf-8')
  headers.set('cache-control', 'no-store')
  return new Response(JSON.stringify(data), { ...init, headers })
}

export async function bodyJson<T>(request: Request): Promise<T> {
  const type = request.headers.get('content-type') || ''
  if (!type.includes('application/json')) throw new Response('Content-Type debe ser application/json', { status: 415 })
  return await request.json() as T
}

export function err(error: unknown) {
  if (error instanceof Response) return error
  console.error(error)
  return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 })
}
