import type { Article } from '@/lib/community';
const KEY='fluidfinance:saved-reading:v1';
export interface SavedArticle { article:Article; savedAt:string }
export function savedArticles():SavedArticle[]{
 try{const value=JSON.parse(localStorage.getItem(KEY)??'[]');return Array.isArray(value)?value.filter(item=>item?.article?.status==='published'&&typeof item.article.slug==='string'&&typeof item.article.body==='string'&&typeof item.savedAt==='string').slice(0,30):[];}catch{return[];}
}
export function savedArticle(slug:string):Article|null{return savedArticles().find(item=>item.article.slug===slug)?.article??null;}
export function isSaved(slug:string):boolean{return savedArticles().some(item=>item.article.slug===slug);}
export function saveForReading(article:Article):void{
 if(article.status!=='published'||article.distribution==='social')throw Error('Only public, published content can be saved.');
 const next=[{article,savedAt:new Date().toISOString()},...savedArticles().filter(item=>item.article.id!==article.id)].slice(0,30);
 try{localStorage.setItem(KEY,JSON.stringify(next));}catch{throw Error('This device has no room to save the article. Remove an older saved item and try again.');}
 window.dispatchEvent(new Event('fluid:saved-reading'));
}
export function removeSaved(slug:string):void{localStorage.setItem(KEY,JSON.stringify(savedArticles().filter(item=>item.article.slug!==slug)));window.dispatchEvent(new Event('fluid:saved-reading'));}
export async function cacheReadingShell():Promise<void>{
 if(!('serviceWorker'in navigator)||import.meta.env.DEV)return;
 const registration=await Promise.race([navigator.serviceWorker.ready,new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('Offline caching did not start. Try again while online.')),8000))]);
 const urls=[location.origin+'/',...Array.from(document.querySelectorAll('script[src],link[rel="stylesheet"]')).map(node=>(node as HTMLScriptElement).src||(node as HTMLLinkElement).href)];
 if(!registration.active)throw Error('Offline cache is not ready. Try again.');
 await new Promise<void>((resolve,reject)=>{
  const channel=new MessageChannel();const timer=setTimeout(()=>{channel.port1.close();reject(Error('Offline files could not be cached. Try again while online.'));},10000);
  channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();event.data?.ok?resolve():reject(Error('Some offline files could not be saved. Try again.'));};
  registration.active!.postMessage({type:'CACHE_READING_SHELL',urls},[channel.port2]);
 });
}
