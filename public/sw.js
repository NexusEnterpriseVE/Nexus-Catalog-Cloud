const CACHE='cuyra-catalog-v6.1.0'
const PRECACHE=['/index.html','/manifest.webmanifest','/cuyra-mark.png','/cuyra-mark-on-dark.png','/cuyra-icon-192.png','/cuyra-icon-512.png']

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)).catch(()=>{}).then(()=>self.skipWaiting()))
})

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('cuyra-catalog-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))
})

self.addEventListener('fetch',event=>{
  const req=event.request
  if(req.method!=='GET')return
  const url=new URL(req.url)
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).catch(()=>caches.match('/index.html')))
    return
  }
  event.respondWith(caches.open(CACHE).then(async cache=>{
    // Network-first for assets: an old installed PWA must not keep displaying V4.
    const hit=await cache.match(req)
    try {
      const response=await fetch(req)
      if(response&&response.ok)await cache.put(req,response.clone())
      return response
    } catch { return hit||Response.error() }
  }))
})
