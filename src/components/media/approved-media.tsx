import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { mediaSource } from '@/lib/content-media';
import { useTheme } from '@/lib/theme';

const scripts=new Map<string,Promise<void>>();
function loadScript(src:string):Promise<void>{
 const existing=scripts.get(src);if(existing)return existing;
 const pending=new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.async=true;script.onload=()=>resolve();script.onerror=()=>{scripts.delete(src);script.remove();reject(new Error('Player unavailable'));};document.head.append(script);});scripts.set(src,pending);return pending;
}
type WidgetWindow=Window & {twttr?:{widgets:{createTweet:(id:string,node:HTMLElement,options:object)=>Promise<unknown>}};instgrm?:{Embeds:{process:()=>void}}};

export function ApprovedMedia({url,title,cover,compact=false}:{url:string|null|undefined;title:string;cover?:string|null;compact?:boolean}){
 const source=mediaSource(url);const[loaded,setLoaded]=useState(false);const[failed,setFailed]=useState(false);const holder=useRef<HTMLDivElement>(null);const{resolved}=useTheme();
 useEffect(()=>{setLoaded(false);setFailed(false);},[url]);
 useEffect(()=>{
  if(!loaded||!source||!holder.current||!['X','Instagram'].includes(source.provider))return;
  let cancelled=false;const node=holder.current;node.replaceChildren();
  const run=async()=>{
   const widgetWindow=window as WidgetWindow;
   if(source.provider==='X'){
    await loadScript('https://platform.twitter.com/widgets.js');if(cancelled)return;
    const result=await widgetWindow.twttr?.widgets.createTweet(source.id!,node,{theme:resolved,dnt:true,conversation:'none',align:'center'});if(!result)throw Error('Unavailable post');
   }else{
    const block=document.createElement('blockquote');block.className='instagram-media';block.setAttribute('data-instgrm-permalink',source.url);block.setAttribute('data-instgrm-version','14');const link=document.createElement('a');link.href=source.url;link.textContent='View on Instagram';block.append(link);node.append(block);
    await loadScript('https://www.instagram.com/embed.js');if(cancelled)return;widgetWindow.instgrm?.Embeds.process();
   }
  };void run().catch(()=>{if(!cancelled)setFailed(true);});return()=>{cancelled=true;node.replaceChildren();};
 },[loaded,url,resolved]);
 if(!source)return <p className="text-sm text-ink/60">This media link is unavailable.</p>;
 return <div className={`approved-media ${compact?'approved-media-compact':''}`}>
  {!loaded ? <button type="button" className="media-cover" onClick={()=>setLoaded(true)} aria-label={`Load ${title} from ${source.provider}`}>
    {cover&&<img src={cover} alt="" loading="lazy"/>}<span className="media-play"><Play size={23} fill="currentColor" aria-hidden="true"/></span><span className="media-provider">{source.provider} · Click to load</span>
   </button> : failed ? <p className="p-5 text-sm">This player could not load. Open the original link below.</p> : source.embed ? <iframe title={title} src={source.embed} loading="lazy" allow="encrypted-media; fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className={source.provider==='Spotify'?'media-audio-frame':'media-video-frame'}/> : source.provider==='Audio' ? <audio controls preload="none" src={source.url} className="w-full"/> : ['X','Instagram'].includes(source.provider)?<div ref={holder} className="media-social-player"/>:<p className="p-5 text-sm">Open this item on its publisher's site.</p>}
  <a href={source.url} target="_blank" rel="noreferrer noopener" className="media-original">Open on {source.provider==='External'?'publisher site':source.provider} <ExternalLink size={12} aria-hidden="true"/></a>
 </div>;
}
