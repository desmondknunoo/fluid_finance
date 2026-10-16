/** CMS accepts links, never embed HTML. Only known providers become embedded players. */
export type MediaKind = 'article' | 'link' | 'video' | 'audio' | 'live';
export type Distribution = 'website' | 'social' | 'both';
export const HOME_SECTIONS = [
 ['ghana','Ghana'],['africa','Africa'],['global','World'],['economy','Economy'],['technology','Technology'],['industries','Industries'],['personal-finance','Personal finance'],['opinion','Opinion'],['learn','Explainers'],
] as const;
export type HomeSection = typeof HOME_SECTIONS[number][0];
export function safeExternalUrl(raw: string | null | undefined): string | null {
 try { const url=new URL(raw??''); return url.protocol==='https:' && !url.username && !url.password && !url.port ? url.href : null; } catch { return null; }
}
export interface MediaSource { provider:'YouTube'|'X'|'Instagram'|'Vimeo'|'Spotify'|'Audio'|'External'; url:string; embed?:string; id?:string }
export function mediaSource(raw: string | null | undefined): MediaSource | null {
 const safe=safeExternalUrl(raw); if(!safe)return null;const url=new URL(safe);const host=url.hostname.toLowerCase();
 if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(host)) {
  const id=host==='youtu.be'?url.pathname.slice(1):url.searchParams.get('v')??url.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1];
  if(id&&/^[a-zA-Z0-9_-]{11}$/.test(id))return{provider:'YouTube',url:`https://www.youtube.com/watch?v=${id}`,embed:`https://www.youtube-nocookie.com/embed/${id}`,id};
 }
 if(['x.com','www.x.com','twitter.com','www.twitter.com'].includes(host)){const id=url.pathname.match(/\/(?:status|statuses)\/(\d+)(?:\/|$)/)?.[1];if(id)return{provider:'X',id,url:`https://x.com/i/status/${id}`};}
 if(['instagram.com','www.instagram.com'].includes(host)){const match=url.pathname.match(/^\/(p|reel|tv)\/([a-zA-Z0-9_-]+)(?:\/|$)/);if(match)return{provider:'Instagram',url:`https://www.instagram.com/${match[1]}/${match[2]}/`};}
 if(['vimeo.com','www.vimeo.com'].includes(host)&&/^\/\d+$/.test(url.pathname))return{provider:'Vimeo',url:safe,embed:`https://player.vimeo.com/video${url.pathname}`};
 if(host==='open.spotify.com'&&/^\/(episode|show)\/[a-zA-Z0-9]+$/.test(url.pathname))return{provider:'Spotify',url:safe,embed:`https://open.spotify.com/embed${url.pathname}`};
 if(/\.(mp3|m4a|ogg|wav|aac)(?:$)/i.test(url.pathname))return{provider:'Audio',url:safe};
 return{provider:'External',url:safe};
}

export function composeCaption(caption:string,hashtags:string[]=[],links:(string|null|undefined)[]=[]):string {
 let text=caption.trim();
 for(const raw of links){const link=raw?.trim();if(link&&!text.includes(link))text+=`${text?'\n\n':''}${link}`;}
 if(hashtags.length)text+=`\n\n${hashtags.map(tag=>`#${tag.replace(/^#+/,'')}`).join(' ')}`;
 return text;
}
