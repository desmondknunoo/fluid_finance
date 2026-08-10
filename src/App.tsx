import { useEffect, useState } from "react"
import { Navigation } from "@/components/ui/navigation"
import { ScrollToTop } from "@/components/ui/scroll-to-top"
import { EnhancedFooter } from "@/components/sections/footer"
import LandingPage from "@/components/ui/saa-s-template"
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
import { StockDetail } from "@/components/stock/stock-detail"
import { closeStock, parseRoute, type Route } from "@/lib/navigation"

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

  if (route.kind === "stock") {
    return (
      <>
        <StockDetail symbol={route.symbol} onBack={closeStock} />
        <ScrollToTop />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-ink selection:bg-fluid-cyan selection:text-fluid-action-ink pt-24 md:pt-32">
      <Navigation />
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
      {route.kind === "home" && <LandingPage />}
      <EnhancedFooter />
      <ScrollToTop />
    </div>
  )
}

export default App
