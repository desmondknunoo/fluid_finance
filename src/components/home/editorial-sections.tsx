import { ArrowRight, ArrowUpRight, BookOpen, Headphones, Play } from 'lucide-react';
import type { Article } from '@/lib/community';
import { formatRelative } from '@/lib/community';
import { articleHref } from '@/lib/navigation';
import { mediaSource, type HomeSection } from '@/lib/content-media';
import { ApprovedMedia } from '@/components/media/approved-media';
import { formatCedis, formatCompact, type Stock } from '@/lib/gse';
import { Sparkline } from '@/components/stock/price-chart';
import { getSeries, sliceRange } from '@/lib/history';
import { TickerLogo } from '@/components/stock/ticker-logo';
import { MemberWatchlist } from '@/components/home/member-watchlist';

const TOPICS: {id:HomeSection;title:string;description:string;links:[string,string][]}[]=[
 {id:'ghana',title:'Ghana in focus',description:'Companies, policy and the economy at home.',links:[['Ghana Stock Exchange','https://gse.com.gh/'],['Bank of Ghana','https://www.bog.gov.gh/']]},
 {id:'africa',title:'Across Africa',description:'Business and economic coverage from across the continent.',links:[['African Development Bank','https://www.afdb.org/'],['African Union','https://au.int/']]},
 {id:'global',title:'The world economy',description:'The global decisions and developments shaping local markets.',links:[['IMF','https://www.imf.org/'],['World Bank','https://www.worldbank.org/']]},
 {id:'economy',title:'Economics & policy',description:'Inflation, interest rates, public finances and the cedi.',links:[['Ghana Statistical Service','https://statsghana.gov.gh/'],['Bank of Ghana','https://www.bog.gov.gh/']]},
 {id:'technology',title:'Technology',description:'The businesses and ideas changing how we live and work.',links:[['National Communications Authority','https://nca.org.gh/'],['Research desk','/articles']]},
 {id:'industries',title:'Industries & enterprise',description:'Banking, energy, agriculture, manufacturing and the companies behind them.',links:[['Company data','/gse-live'],['Fuel prices','/fuel']]},
 {id:'personal-finance',title:'Your money',description:'Practical context for saving, investing and financial decisions.',links:[['Learning center','/learning-center'],['Market education','/market-education']]},
 {id:'opinion',title:'Fluid Finance Opinion',description:'Approved commentary and analysis from the Fluid Finance team.',links:[['Research','/articles'],['Join the discussion','/forum']]},
];
const EXPLAINERS=[
 {title:'Price is only part of the story.',body:'A share price tells you the cost of one unit. Market capitalisation, earnings, trading activity and the company’s disclosures help put that number in context.',href:'/market-education',label:'Understand company data'},
 {title:'Why a gain is not a recommendation.',body:'A price move describes a session. It does not establish a company’s value or predict its next move. Compare the data with filings and your own research.',href:'/learning-center',label:'Build your investing knowledge'},
 {title:'The cedi, beyond a single rate.',body:'Buying and selling rates differ. The provider, transaction size, fees and timing can all change the amount you receive. Desk rates are indicative.',href:'/fx',label:'Explore the currency converter'},
 {title:'What is behind the pump price?',body:'Compare dated petrol and diesel reports across oil marketing companies. Look at the reporting date and availability before comparing suppliers.',href:'/fuel',label:'Compare the latest pump report'},
];
function Story({item,lead=false}:{item:Article;lead?:boolean}){
 const source=item.external_url?mediaSource(item.external_url):null;
 const thumb=item.cover_url??(source?.provider==='YouTube'?`https://i.ytimg.com/vi/${source.id}/hqdefault.jpg`:null);
 return <article className={`editorial-story ${lead?'editorial-story-lead':''}`}>
  <a href={articleHref(item.slug)}>{thumb&&<div className="editorial-story-image"><img src={thumb} alt="" loading="lazy"/>{['video','live'].includes(item.media_kind??'')&&<span><Play size={18} fill="currentColor" aria-hidden="true"/></span>}</div>}<h3>{item.title}</h3></a>
  {lead&&item.excerpt&&<p>{item.excerpt}</p>}<div className="editorial-story-meta">{source?.provider??'Fluid Finance'} · {formatRelative(item.published_at??item.created_at)}</div>
 </article>;
}
function Topic({topic,items}:{topic:typeof TOPICS[number];items:Article[]}){
 return <section className="editorial-topic" id={topic.id} aria-label={topic.title}>
  <header className="editorial-section-heading"><h2>{topic.title}</h2><a href={topic.id === "opinion" ? "/opinion" : `/articles?section=${topic.id}`}>Explore coverage <ArrowRight size={15} aria-hidden="true"/></a></header>
  {items.length?<div className="editorial-topic-grid">{items.slice(0,5).map((item,index)=><Story key={item.id} item={item} lead={index===0}/>)}</div>:<div className="editorial-awaiting"><div><p className="editorial-topic-description">{topic.description}</p><p>Coverage appears here when the team publishes approved stories and links.</p></div><div className="editorial-sources"><strong>Sources to follow</strong>{topic.links.map(([label,href])=><a key={href} href={href} target={href.startsWith('https')?'_blank':undefined} rel="noreferrer noopener">{label}<ArrowUpRight size={14} aria-hidden="true"/></a>)}</div></div>}
 </section>;
}
export function EditorialSections({articles,stocks,loading}:{articles:Article[];stocks:Stock[];loading:boolean}){
 const video=articles.filter(item=>['video','live'].includes(item.media_kind??''));
 const audio=articles.filter(item=>item.media_kind==='audio');
 const marketStories=articles.filter(item=>!['video','audio','live'].includes(item.media_kind??''));
 const sectors=[...new Set(stocks.map(stock=>stock.sector))];
 return <>
  <section className="editorial-topic" aria-label="More to explore"><header className="editorial-section-heading"><h2>More to explore</h2><a href="/articles">All stories <ArrowRight size={15}/></a></header>{marketStories.length?<div className="editorial-story-rail">{marketStories.slice(0,4).map(item=><Story key={item.id} item={item}/>)}</div>:<div className="editorial-primer-grid">{[{title:"A market in motion.",body:"Compare Ghana’s listed companies by price, volume and sector, then open a company for its available trading history.",href:"/gse-live",label:"Explore the exchange"},{title:"The context behind the headline.",body:"Follow company disclosures and economic releases alongside published research and conversations from the community.",href:"/business-news",label:"Browse business & economy"}].map(item=><a href={item.href} key={item.title}><h3>{item.title}</h3><p>{item.body}</p><span>{item.label} <ArrowRight size={14}/></span></a>)}</div>}</section>
  <MemberWatchlist stocks={stocks}/>
  <section className="editorial-topic editorial-watch" id="watch" aria-label="Watch and live"><header className="editorial-section-heading"><h2>Watch & live</h2><span>Video, interviews and live coverage</span></header>{video.length?<div className="editorial-video-grid"><div><ApprovedMedia url={video[0].external_url} title={video[0].title} cover={video[0].cover_url}/><a href={articleHref(video[0].slug)}><h3 className="editorial-video-title">{video[0].title}</h3></a>{video[0].excerpt&&<p className="editorial-video-summary">{video[0].excerpt}</p>}</div><div className="editorial-video-list">{video.slice(1,6).map(item=><Story item={item} key={item.id}/>)}{video.length===1&&<p className="text-sm text-ink/60">More approved videos will appear here.</p>}</div></div>:<div className="editorial-media-empty"><Play size={36} aria-hidden="true"/><div><h3>Markets have a story. See it unfold.</h3><p>Approved YouTube, X, Instagram and Vimeo videos, interviews and live streams will appear here. Players load only when you choose to watch.</p></div></div>}</section>
  {TOPICS.slice(0,4).map(topic=><Topic key={topic.id} topic={topic} items={articles.filter(item=>item.homepage_section===topic.id)}/>)}
  <section className="editorial-topic" aria-label="Company spotlight"><header className="editorial-section-heading"><h2>Companies to follow</h2><a href="/gse-live">All listed companies <ArrowRight size={15}/></a></header>{stocks.length?<div className="editorial-company-grid">{[...stocks].sort((a,b)=>b.volume-a.volume).slice(0,8).map(stock=><a href={`/stock/${stock.symbol}`} key={stock.symbol}><div className="flex items-center gap-3"><TickerLogo symbol={stock.symbol} size={32}/><div><strong>{stock.symbol}</strong><p>{stock.company}</p></div></div><div className="editorial-company-price"><span>{formatCedis(stock.price)}</span><span className={stock.changePercent>=0?'text-fluid-green':'text-fluid-rose'}>{stock.changePercent>=0?'+':''}{stock.changePercent.toFixed(2)}%</span></div><Sparkline points={sliceRange(getSeries(stock.symbol,stock.price),'1M').map(point=>point.close)} positive={stock.changePercent>=0} flat={stock.changePercent===0} width={240} height={48} className="w-full"/><p className="mt-2">{formatCompact(stock.volume)} shares · trend includes illustrative backfill</p></a>)}</div>:<p className="py-6 text-sm text-ink/60">{loading?'Loading company data…':'Company quotes are temporarily unavailable.'}</p>}</section>
  {TOPICS.slice(4,6).map(topic=><Topic key={topic.id} topic={topic} items={articles.filter(item=>item.homepage_section===topic.id)}/>)}
  <section className="editorial-topic editorial-listen" id="listen" aria-label="Listen"><header className="editorial-section-heading"><h2>Listen</h2><span>Podcasts, conversations & radio</span></header>{audio.length?<div className="editorial-audio-grid">{audio.slice(0,3).map(item=><article key={item.id}><Headphones size={22} aria-hidden="true"/><h3>{item.title}</h3>{item.excerpt&&<p>{item.excerpt}</p>}<ApprovedMedia url={item.external_url} title={item.title} cover={item.cover_url} compact/></article>)}</div>:<div className="editorial-media-empty"><Headphones size={36} aria-hidden="true"/><div><h3>Make room for a wider perspective.</h3><p>Approved podcast episodes, financial conversations and radio links will be available here. Browse the research desk while the listening library grows.</p><a href="/articles" className="news-text-link mt-4">Explore research <ArrowRight size={14}/></a></div></div>}</section>
  {TOPICS.slice(6).map(topic=><Topic key={topic.id} topic={topic} items={articles.filter(item=>item.homepage_section===topic.id)}/>)}
  <section className="editorial-topic" aria-label="Market sectors"><header className="editorial-section-heading"><h2>Inside the exchange</h2><a href="/gse-live/heatmap">Open heatmap <ArrowRight size={15}/></a></header><div className="editorial-sector-grid">{sectors.map(sector=>{const items=stocks.filter(stock=>stock.sector===sector);return <article key={sector}><h3>{sector}</h3><p>{items.length} listed {items.length===1?'company':'companies'} · {formatCompact(items.reduce((sum,stock)=>sum+stock.volume,0))} shares</p><ul>{items.slice(0,5).map(stock=><li key={stock.symbol}><a href={`/stock/${stock.symbol}`}><strong>{stock.symbol}</strong><span>{formatCedis(stock.price)}</span><span className={stock.changePercent>=0?'text-fluid-green':'text-fluid-rose'}>{stock.changePercent>=0?'+':''}{stock.changePercent.toFixed(2)}%</span></a></li>)}</ul></article>})}</div></section>
  <section className="editorial-topic" aria-label="Explainers"><header className="editorial-section-heading"><h2>The explainer</h2><a href="/learning-center">Keep learning <ArrowRight size={15}/></a></header><div className="editorial-primer-grid">{EXPLAINERS.map(item=><a key={item.title} href={item.href}><BookOpen size={20} aria-hidden="true"/><h3>{item.title}</h3><p>{item.body}</p><span>{item.label} <ArrowRight size={14}/></span></a>)}</div></section>
  {articles.length>5&&<section className="editorial-topic" aria-label="Latest coverage"><header className="editorial-section-heading"><h2>Latest coverage</h2><a href="/articles">All coverage <ArrowRight size={15}/></a></header><div className="editorial-latest-coverage">{articles.slice(5,17).map(item=><Story key={item.id} item={item}/>)}</div></section>}
 </>;
}
