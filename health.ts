import { json } from '../server/http.js'

function handleGET() {
  return json({ ok: true, service: 'CUYRA Catalog Cloud', version: '4.6.0', protocol: 'catalog-v4.6-commerce-theme' })
}

export default {
  fetch(request: Request) {
    if (request.method !== 'GET') return json({ ok: false, error: 'Método no permitido' }, { status: 405 })
    return handleGET()
  }
}
