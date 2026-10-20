/* Cache public application files only. Never cache APIs, tokens, member data or third-party media.
 *
 * Pages: network first. Each successful page response is cached under its own path, so offline
 * the reader gets that page's own HTML, never another page's. A page never visited online falls
 * back to the neutral app shell (/shell), which carries no page-specific metadata and lets the
 * app render the route from the address bar. Assets: cache first (they are content-hashed).
 */
const CACHE='fluid-reading-shell-v2';
const SHELL='/shell';
const MAX_PAGES=60;
const MAX_MESSAGE_URLS=60;
const isAsset=(url)=>url.pathname.startsWith('/assets/')||url.pathname.startsWith('/logo/')||url.pathname.startsWith('/icons/');
/* App routes have no file extension; /api/ is never a page. */
const isPage=(url)=>!url.pathname.startsWith('/api/')&&!/\.[a-z0-9]+$/i.test(url.pathname);
const sameOrigin=(url)=>url.origin===self.location.origin;
const allowed=(url)=>sameOrigin(url)&&!url.search&&(isPage(url)||isAsset(url));
const pageKey=(url)=>self.location.origin+(url.pathname.replace(/\/+$/,'')||'/');
const cacheable=(response)=>response&&response.ok&&response.type==='basic'&&!response.redirected;

async function trimPages(cache){
 const keys=await cache.keys();
 const pages=keys.filter(request=>{const url=new URL(request.url);return isPage(url)&&url.pathname!==SHELL&&url.pathname!=='/';});
 await Promise.all(pages.slice(0,Math.max(0,pages.length-MAX_PAGES)).map(request=>cache.delete(request)));
}

self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.add(new Request(SHELL,{credentials:'omit'})).catch(()=>{/* cached on the next visit */})).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('fluid-reading-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{
 if(event.data?.type!=='CACHE_READING_SHELL'||!event.source?.url||new URL(event.source.url).origin!==self.location.origin)return;
 const urls=Array.isArray(event.data.urls)?event.data.urls.filter(raw=>{try{return allowed(new URL(raw));}catch{return false;}}).slice(0,MAX_MESSAGE_URLS):[];
 event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(urls.map(url=>cache.add(new Request(url,{credentials:'omit'}))))).then(results=>event.ports[0]?.postMessage({ok:results.every(r=>r.status==='fulfilled')})).catch(()=>event.ports[0]?.postMessage({ok:false})));
});
self.addEventListener('fetch',event=>{
 const request=event.request;const url=new URL(request.url);
 if(request.method!=='GET'||request.headers.has('Authorization')||!sameOrigin(url))return;
 if(request.mode==='navigate'){
  if(!isPage(url))return;
  const key=pageKey(url);
  event.respondWith(fetch(request).then(response=>{
   if(cacheable(response)&&!url.search){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(key,copy).then(()=>trimPages(cache))).catch(()=>{}));}
   return response;
  }).catch(()=>caches.match(key).then(response=>response||caches.match(SHELL)).then(response=>response||Response.error())));
  return;
 }
 if(!allowed(url)||!isAsset(url)&&url.pathname!=='/'&&url.pathname!==SHELL)return;
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(cacheable(response)){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}return response;})));
});
