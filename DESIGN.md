---
name: Fluid Finance Public Editorial
description: Ghanaian financial editorial with switchable white and charcoal paper.
colors:
  cyan: "rgb(103 232 249)"
  action-ink: "rgb(6 16 22)"
  canvas-dark: "rgb(18 18 18)"
  ink-dark: "rgb(245 245 245)"
  panel-dark: "rgb(26 26 26)"
  panel-soft-dark: "rgb(22 22 22)"
  canvas-light: "rgb(255 255 255)"
  ink-light: "rgb(20 20 20)"
  panel-light: "rgb(247 247 247)"
  panel-soft-light: "rgb(250 250 250)"
  cyan-ink-light: "rgb(0 92 112)"
  green-dark: "rgb(52 211 153)"
  green-light: "rgb(0 112 68)"
  rose-dark: "rgb(251 113 133)"
  rose-light: "rgb(183 31 53)"
  utility-background: "rgb(8 8 8)"
  utility-foreground: "rgb(255 255 255)"
typography:
  display:
    fontFamily: "Barlow, Arial, sans-serif"
    fontSize: "clamp(48px, 6vw, 76px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-.035em"
  headline:
    fontFamily: "Barlow, Arial, sans-serif"
    fontSize: "clamp(32px, 3.4vw, 47px)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-.025em"
  body:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "14px"
    lineHeight: 1.65
  label:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "11px"
rounded:
  editorial: "0px"
spacing:
  column: "24px"
  column-mobile: "20px"
  container: "16px"
  container-md: "24px"
components:
  theme-control:
    rounded: "{rounded.editorial}"
    height: "40px"
    width: "40px"
  topic-link:
    padding: "14px 19px"
  utility-bar:
    backgroundColor: "{colors.utility-background}"
    textColor: "{colors.utility-foreground}"
    height: "32px"
---

# Design System: Fluid Finance Public Editorial

## Overview

**Creative North Star: "The Financial Front Page"**

A compact Ghanaian financial publication, following the user-selected Bloomberg-like editorial direction. Market data and research establish the hierarchy through large sans-serif headlines, disciplined columns and strong rules. White and neutral charcoal themes share one composition.

**Key Characteristics:**
- Data-led editorial hierarchy.
- Flat paper, fine dividers and heavy section rules.
- Fluid cyan actions and semantic market changes.
- Equally supported light and dark themes.

This documents the shipped public shell and homepage. Existing tools and image-share renderers retain their established specialized patterns.

## Colors

### Primary

Fluid cyan marks actions and selection; dark action ink keeps filled controls readable. Text accents use the theme's cyan-ink channel, bright cyan in dark mode and deep cyan in light mode.

### Neutral

Theme-aware canvas, ink, panel and soft-panel channels provide paper and hierarchy. The utility bar remains black with white text in both themes. Rules use ink at 19% opacity, subtle fills use 5.5%, and public muted text uses 68%.

### Semantic

Green signals gains; rose signals losses. Accompany change colors with a signed number or directional symbol.

**The Paper Rule.** Use the canvas and ink channels for ordinary surfaces and text so both themes remain coherent.

## Typography

The supplied horizontal Fluid logo lockup is used in both masthead and footer, with theme-specific artwork. Barlow supplies editorial headlines; Inter supplies body text, navigation, timestamps and data. The legacy Tailwind font-poppins alias resolves to Barlow for UI. Poppins remains available to existing canvas share-image code; do not infer that changing the UI alias changes those exports.

The front-page title uses the display token. Lead summaries use the body token with a 65ch maximum. Research headlines use clamp(26px, 2.7vw, 34px), weight 700, line height 1.08 and tracking -.02em. Column titles use 18px/1.2 at weight 700. Latest headlines use 14px/1.4 at weight 600; timestamps use 10px. Market figures use tabular numerals.

## Layout

The shared container is centered with a 1280px maximum and 16px horizontal padding, increasing to 24px from 768px. Desktop lead/research/latest columns use 1.6fr/1fr/.8fr with 24px column padding and vertical dividers. The masthead is at least 100px tall. The homepage begins with dateline, page heading, session strip and source notice before the editorial grid.

Below 1024px, the lead/research grid becomes 1.5fr/1fr and latest moves beneath as two columns. Full topic navigation becomes a horizontally scrollable quick navigation with a menu control. The footer brand spans above four link columns.

Below 640px, content becomes one column, research dividers disappear, the column spacing variable becomes 20px, the masthead minimum becomes 80px, the page title is 54px and the lead headline is 37px/1.06. Footer links use two columns and legal text stacks. Keep horizontal scrolling confined to navigation and data regions.

## Elevation & Depth

The editorial surface is flat. Hairline dividers separate stories; 3px rules introduce topic navigation and section bands, and a 4px rule starts the footer. The desktop More menu alone uses the existing Tailwind large shadow to distinguish its overlay. Legacy glow and panel-shadow tokens remain available elsewhere; they do not define the public front page.

## Shapes

Editorial controls and section structures are square. Theme controls have a 40px minimum footprint; the mobile navigation control is 44px square. Existing app-wide radius tokens remain for other surfaces.

## Components

- **Masthead:** black utility strip, supplied horizontal Fluid logo lockup, edition information, theme toggle and account controls. The edition hides below 1024px. Mobile account actions appear in expanded navigation.
- **Topic navigation:** bold 13px links, fine top rule and heavy bottom rule. Hover and current page use cyan ink and an underline. At narrow widths links use 12px text and 12px/16px padding.
- **Market tape:** 36px tall; duplicated quote items form a 90-second linear loop. Pause on hover or keyboard focus, and expose an explicit pause/resume control. Reduced motion disables the animation and allows horizontal scrolling. Hide duplicate items from assistive technology and keyboard focus.
- **Story columns:** large balanced headlines, muted summary, fine vertical separators and square data regions. Latest items use timestamp/headline pairs and bottom rules. Preserve honest unavailable states.
- **Section bands:** heavy top rule, compact heading row and data below. Share controls are square with a 32px minimum footprint.
- **Footer:** brand plus four topic groups, strong top rule and separate legal row. Use real navigation destinations and existing brand assets.

Global keyboard focus uses a 2px cyan-ink outline with 4px offset. The skip link becomes visible on focus. Menus close on navigation and Escape; More also closes when focus leaves.

## Do's and Don'ts

- Do preserve the supplied Fluid identity and existing company imagery.
- Do use theme channels and signed market values.
- Do maintain headline hierarchy, compact metadata and rule-separated columns.
- Don't introduce decorative gradients, rounded marketing cards or unrelated imagery into this editorial surface.
- Don't fabricate live quotes, research or timestamps when sources are unavailable.
