import SavedReadingPage from '@/components/ui/saved-reading-page';
import { useEffect, useState } from "react"
import { Navigation } from "@/components/ui/navigation"
import { ScrollToTop } from "@/components/ui/scroll-to-top"
import { EnhancedFooter } from "@/components/sections/footer"
import HomePage from "@/components/home/home-page"
import AboutUsPage from "@/components/ui/about-us-page"
import ContactSupportPage from "@/components/ui/contact-support-page"
import PrivacyPolicyPage from "@/components/ui/privacy-policy-page"
import LearningCenterPage from "@/components/ui/learning-center-page"
import HelpCenterPage from "@/components/ui/help-center-page"
import MarketEducationPage from "@/components/ui/market-education-page"
import MarketTrendsPage from "@/components/ui/market-trends-page"
import BusinessNewsPage from "@/components/ui/business-news-page"
import TermsOfServicePage from "@/components/ui/terms-of-service-page"
import GseLivePage from "@/components/ui/gse-live-page"
import FuelPricesPage from "@/components/ui/fuel-prices-page"
import TeamPortalPage from "@/components/ui/team-portal-page"
import FuelPublicPage from "@/components/ui/fuel-public-page"
import FxPage from "@/components/ui/fx-page"
import ArticlesPage from "@/components/ui/articles-page"
import ArticlePage from "@/components/ui/article-page"
import ForumPage from "@/components/ui/forum-page"
import ThreadPage from "@/components/ui/thread-page"
import NewThreadPage from "@/components/ui/new-thread-page"
import AuthPage from "@/components/ui/auth-page"
import SettingsPage from "@/components/ui/settings-page"
import ProfilePage from "@/components/ui/profile-page"
import { StockDetail } from "@/components/stock/stock-detail"
import { closeStock, parseRoute, type Route } from "@/lib/navigation"

const DEFAULT_TITLE = document.title

function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute())

  useEffect(() => {
    const sync = () => setRoute(parseRoute())
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [])

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual"
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
    // Pages that set their own title do so after this runs; everything else keeps the site title.
    document.title = DEFAULT_TITLE
  }, [route])

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

  // Team tooling still ships here until the portal replaces it; both render without the public chrome.
  if (route.kind === "fuel-prices") return <FuelPricesPage />
  if (route.kind === "team-portal") return <TeamPortalPage />

  if (route.kind === "stock") {
    return (
      <>
        <StockDetail symbol={route.symbol} onBack={closeStock} />
        <ScrollToTop />
      </>
    )
  }

  return (
    <div className="finance-public min-h-screen bg-canvas text-ink selection:bg-fluid-cyan selection:text-fluid-action-ink">
      <Navigation />
      <div id="main-content" tabIndex={-1}>
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
      </div>
      <EnhancedFooter />
      <ScrollToTop />
    </div>
  )
}

export default App
