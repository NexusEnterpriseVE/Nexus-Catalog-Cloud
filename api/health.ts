import { json } from '../server/http.js'

function handleGET() {
  return json({ ok: true, service: 'Nexus Catalog Cloud', version: '3.0.0' })
}

export default {
  fetch(request: Request) {
    if (request.method !== 'GET') return json({ ok: false, error: 'Método no permitido' }, { status: 405 })
    return handleGET()
  }
}
