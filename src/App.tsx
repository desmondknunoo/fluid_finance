import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Navigation } from "@/components/ui/navigation"
import { ScrollToTop } from "@/components/ui/scroll-to-top"
import { EnhancedFooter } from "@/components/sections/footer"
import HomePage from "@/components/home/home-page"
import SavedReadingPage from "@/components/ui/saved-reading-page"
import { closeStock, consumePendingScroll, onLocationChange, parseRoute, routeKey, type Route } from "@/lib/navigation"
import { applyMeta } from "@/lib/seo"
import { metaForPath } from "@/lib/seo-routes"

// The front page and the shell ship in the main bundle; every other route loads on demand.
// The saved-reading page stays in the main bundle so it opens offline from the cached shell.
const AboutUsPage = lazy(() => import("@/components/ui/about-us-page"))
const ContactSupportPage = lazy(() => import("@/components/ui/contact-support-page"))
const PrivacyPolicyPage = lazy(() => import("@/components/ui/privacy-policy-page"))
const LearningCenterPage = lazy(() => import("@/components/ui/learning-center-page"))
const HelpCenterPage = lazy(() => import("@/components/ui/help-center-page"))
const MarketEducationPage = lazy(() => import("@/components/ui/market-education-page"))
const MarketTrendsPage = lazy(() => import("@/components/ui/market-trends-page"))
const BusinessNewsPage = lazy(() => import("@/components/ui/business-news-page"))
const TermsOfServicePage = lazy(() => import("@/components/ui/terms-of-service-page"))
const GseLivePage = lazy(() => import("@/components/ui/gse-live-page"))
const FuelPublicPage = lazy(() => import("@/components/ui/fuel-public-page"))
const FxPage = lazy(() => import("@/components/ui/fx-page"))
const ArticlesPage = lazy(() => import("@/components/ui/articles-page"))
const ArticlePage = lazy(() => import("@/components/ui/article-page"))
const ForumPage = lazy(() => import("@/components/ui/forum-page"))
const ThreadPage = lazy(() => import("@/components/ui/thread-page"))
const NewThreadPage = lazy(() => import("@/components/ui/new-thread-page"))
const AuthPage = lazy(() => import("@/components/ui/auth-page"))
const SettingsPage = lazy(() => import("@/components/ui/settings-page"))
const ProfilePage = lazy(() => import("@/components/ui/profile-page"))
const StockDetail = lazy(() => import("@/components/stock/stock-detail").then((module) => ({ default: module.StockDetail })))

/** Restore a back/forward position once the page is tall enough, giving late content a moment. */
function restoreScroll(top: number): () => void {
  const deadline = performance.now() + 1500
  let frame = 0
  let released = false
  const tick = () => {
    if (released) return
    const reachable = document.documentElement.scrollHeight - window.innerHeight >= top
    window.scrollTo({ top, behavior: "instant" })
    if (!reachable && performance.now() < deadline) frame = requestAnimationFrame(tick)
  }
  const release = () => { released = true; cancelAnimationFrame(frame) }
  tick()
  window.addEventListener("wheel", release, { once: true, passive: true })
  window.addEventListener("touchstart", release, { once: true, passive: true })
  window.addEventListener("keydown", release, { once: true })
  return () => {
    release()
    window.removeEventListener("wheel", release)
    window.removeEventListener("touchstart", release)
    window.removeEventListener("keydown", release)
  }
}

function useLocationRoute(): [Route, string] {
  const read = () => ({ route: parseRoute(), path: `${window.location.pathname}${window.location.search}` })
  const [state, setState] = useState(read)
  useEffect(() => onLocationChange(() => {
    const next = read()
    setState((current) => (routeKey(current.route) === routeKey(next.route) && current.path === next.path ? current : next))
  }), [])
  return [state.route, state.path]
}

function App() {
  const [route, path] = useLocationRoute()
  const key = routeKey(route)

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual"
  }, [])

  // Route-level metadata first (layout effect); pages with API content refine it in their own effects.
  useLayoutEffect(() => {
    applyMeta(metaForPath(path))
  }, [key, path])

  useEffect(() => {
    const restored = consumePendingScroll()
    if (restored !== null && restored > 0) return restoreScroll(restored)
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [key, path])

  useEffect(() => {
    if (route.kind !== "home" || !route.section) return

    const section = route.section
    const deadline = performance.now() + 4000
    let frame = 0
    let released = false

    const tick = () => {
      if (released) return
      document.getElementById(section)?.scrollIntoView({ behavior: "auto", block: "start" })
      if (performance.now() < deadline) frame = requestAnimationFrame(tick)
    }

    const release = () => {
      released = true
      cancelAnimationFrame(frame)
    }

    tick()
    window.addEventListener("wheel", release, { once: true, passive: true })
    window.addEventListener("touchstart", release, { once: true, passive: true })
    window.addEventListener("keydown", release, { once: true })

    return () => {
      release()
      window.removeEventListener("wheel", release)
      window.removeEventListener("touchstart", release)
      window.removeEventListener("keydown", release)
    }
  }, [route])

  if (route.kind === "stock") {
    return (
      <>
        <Suspense fallback={<StockFallback symbol={route.symbol} />}>
          <StockDetail symbol={route.symbol} onBack={closeStock} />
        </Suspense>
        <ScrollToTop />
      </>
    )
  }

  return (
    <div className="finance-public min-h-screen bg-canvas text-ink selection:bg-fluid-cyan selection:text-fluid-action-ink">
      <Navigation />
      <div id="main-content" tabIndex={-1}>
      <Suspense fallback={<main className="page-container news-page min-h-[60vh]" aria-busy="true" />}>
      {route.kind === "about" && <AboutUsPage />}
      {route.kind === "contact-support" && <ContactSupportPage />}
      {route.kind === "privacy-policy" && <PrivacyPolicyPage />}
      {route.kind === "learning-center" && <LearningCenterPage />}
      {route.kind === "help-center" && <HelpCenterPage />}
      {route.kind === "market-education" && <MarketEducationPage />}
      {route.kind === "market-trends" && <MarketTrendsPage />}
      {route.kind === "business-news" && <BusinessNewsPage />}
      {route.kind === "terms-of-service" && <TermsOfServicePage />}
      {route.kind === "gse-live" && <GseLivePage view={route.view} />}
      {route.kind === "fuel" && <FuelPublicPage />}
      {route.kind === "fx" && <FxPage />}
      {route.kind === "saved" && <SavedReadingPage />}
      {route.kind === "articles" && <ArticlesPage />}
      {route.kind === "article" && <ArticlePage slug={route.slug} />}
      {route.kind === "forum" && <ForumPage categorySlug={route.category} />}
      {route.kind === "thread" && <ThreadPage id={route.id} />}
      {route.kind === "new-thread" && <NewThreadPage categorySlug={route.category} />}
      {route.kind === "auth" && <AuthPage mode={route.mode} />}
      {route.kind === "settings" && <SettingsPage />}
      {route.kind === "profile" && <ProfilePage username={route.username} />}
      {route.kind === "home" && <HomePage />}
      </Suspense>
      </div>
      <EnhancedFooter />
      <ScrollToTop />
    </div>
  )
}

/** Same markup as StockDetail's own loading state, so the hand-off is invisible. */
function StockFallback({ symbol }: { symbol: string }) {
  return (
    <div className="finance-public flex min-h-screen items-center justify-center bg-canvas text-ink/[0.68]" role="status">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading {symbol}</span>
    </div>
  )
}

export default App
