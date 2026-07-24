import { useEffect, useState } from "react"
import LandingPage from "@/components/ui/saa-s-template"
import { StockDetail } from "@/components/stock/stock-detail"
import { closeStock, parseRoute, type Route } from "@/lib/navigation"

function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute())

  useEffect(() => {
    const sync = () => setRoute(parseRoute())
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [])

  // Routing decides where the page starts; the browser restoring its own
  // remembered offset on reload would land somewhere else entirely.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual"
  }, [])

  // `#gse-live/heatmap` has no element to anchor to, so scrolling is handled
  // here rather than natively. Sections above the target grow as their market
  // data arrives, which would leave the jump short, so the anchor is re-applied
  // each frame until the layout stops moving. (A ResizeObserver on <body> is
  // the obvious tool here and simply never fires for this growth.)
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

    // Hand the scroll back the moment the reader touches it.
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
    return <StockDetail symbol={route.symbol} onBack={closeStock} />
  }

  return <LandingPage liveView={route.view} />
}

export default App
