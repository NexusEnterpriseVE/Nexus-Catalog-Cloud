import { json } from '../server/http.js'

function handleGET() {
  return json({ ok: true, service: 'CUYRA Catalog Cloud', version: '4.5.1', protocol: 'catalog-v4.5-retailux-checkout' })
}

export default {
  fetch(request: Request) {
    if (request.method !== 'GET') return json({ ok: false, error: 'Método no permitido' }, { status: 405 })
    return handleGET()
  }
}
