import { useEffect,useState } from 'react';
import { ArrowRight,Trash2 } from 'lucide-react';
import { savedArticles,removeSaved,type SavedArticle } from '@/lib/saved-reading';
import { articleHref } from '@/lib/navigation';
import { EmptyState,Notice } from '@/components/ui/form';
import { PageIntro } from '@/components/ui/page-intro';
export default function SavedReadingPage(){
 const[items,setItems]=useState<SavedArticle[]>(savedArticles);const[error,setError]=useState('');
 useEffect(()=>{const sync=()=>setItems(savedArticles());window.addEventListener('fluid:saved-reading',sync);return()=>window.removeEventListener('fluid:saved-reading',sync);},[]);
 return <main className="page-container news-page">
  <PageIntro eyebrow="Offline reading" title="Saved for later" description="Public articles saved on this device are available as text copies offline after the site has loaded online. Videos, external websites, live quotes and comments require a connection. Saved copies may differ from the latest published version."/>
  {error&&<Notice tone="error" className="mb-6">{error}</Notice>}
  {!items.length
   ?<EmptyState title="Keep something worth coming back to." action={<a href="/articles" className="news-text-link">Explore research <ArrowRight size={15} aria-hidden="true"/></a>}>Open a published article and choose “Save for offline.”</EmptyState>
   :<ul className="news-list">{items.map(({article,savedAt})=><li key={article.id} className="flex items-start justify-between gap-6"><div className="min-w-0"><a href={articleHref(article.slug)} className="group block"><h2 className="news-headline-sm text-ink group-hover:underline underline-offset-4">{article.title}</h2></a><p className="news-byline mt-1">Saved {new Date(savedAt).toLocaleString()}</p></div><button type="button" aria-label={`Remove saved ${article.title}`} className="news-icon-button shrink-0" onClick={()=>{try{removeSaved(article.slug);}catch{setError('Could not remove this saved copy.');}}}><Trash2 size={16} aria-hidden="true"/></button></li>)}</ul>}
 </main>;
}
