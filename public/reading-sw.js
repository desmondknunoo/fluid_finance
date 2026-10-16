/* Cache public application files only. Never cache APIs, tokens, member data or third-party media. */
const CACHE='fluid-reading-shell-v1';
const allowed=(url)=>url.origin===self.location.origin&&!url.search&&(url.pathname==='/'||url.pathname.startsWith('/assets/')||url.pathname.startsWith('/logo/'));
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.add('/')).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('fluid-reading-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{
 if(event.data?.type!=='CACHE_READING_SHELL'||!event.source?.url||new URL(event.source.url).origin!==self.location.origin)return;
 const urls=Array.isArray(event.data.urls)?event.data.urls.filter(raw=>{try{return allowed(new URL(raw));}catch{return false;}}).slice(0,15):[];
 event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(urls.map(url=>cache.add(new Request(url,{credentials:'omit'}))))).then(results=>event.ports[0]?.postMessage({ok:results.every(r=>r.status==='fulfilled')})).catch(()=>event.ports[0]?.postMessage({ok:false})));
});
self.addEventListener('fetch',event=>{
 const request=event.request;const url=new URL(request.url);if(request.method!=='GET'||request.headers.has('Authorization')||!allowed(url))return;
 if(request.mode==='navigate')event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put('/',copy)));}return response;}).catch(()=>caches.match('/').then(response=>response||Response.error())));
 else event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}return response;})));
});
