const CACHE='cuyra-catalog-v4.4.0'
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
    const hit=await cache.match(req)
    const network=fetch(req).then(res=>{
      if(res&&res.ok)cache.put(req,res.clone())
      return res
    }).catch(()=>hit)
    return hit||network
  }))
})
