---
name: "Miggy Rivera — Centered Dark Portfolio"
description: "A responsive grayscale portfolio with editorial type, project browsing, and plain reading rows."
colors:
  background: "#0A0A0A"
  sheet: "#161616"
  back: "#101010"
  white: "#FFFFFF"
  muted: "#B5B5B5"
  rule: "#343434"
  diagram: "#222222"
  vellum: "#161616F5"
typography:
  name-desktop:
    fontFamily: "Libre Caslon Display"
    fontSize: "64px"
    fontWeight: 400
    lineHeight: "70px"
    letterSpacing: "-1px"
  name-mobile:
    fontFamily: "Libre Caslon Display"
    fontSize: "48px"
    fontWeight: 400
    lineHeight: "54px"
    letterSpacing: "-0.6px"
  section:
    fontFamily: "Libre Caslon Display"
    fontSize: "36px"
    fontWeight: 400
    lineHeight: "42px"
    letterSpacing: "-0.3px"
  project-title:
    fontFamily: "Libre Caslon Display"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: "36px"
    letterSpacing: "-0.2px"
  row-title:
    fontFamily: "Libre Caslon Display"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: "29px"
    letterSpacing: "0px"
  body:
    fontFamily: "Manrope"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "26px"
    letterSpacing: "0px"
  intro:
    fontFamily: "Manrope"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "28px"
    letterSpacing: "0px"
  small:
    fontFamily: "Manrope"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0px"
  link:
    fontFamily: "Manrope"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "20px"
    letterSpacing: "0px"
  label:
    fontFamily: "Manrope"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.25px"
spacing:
  page-inline: "24px"
  section-gap: "64px"
  grid-gap: "24px"
  grid-gap-mobile: "16px"
components:
  text-link:
    textColor: "{colors.white}"
    typography: "{typography.link}"
    height: "44px"
  navigation:
    textColor: "{colors.white}"
  folio-sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.white}"
    padding: "0 24px 24px"
  experience-row:
    textColor: "{colors.white}"
    typography: "{typography.body}"
    padding: "20px 0"
  credential-row:
    textColor: "{colors.white}"
    typography: "{typography.body}"
    padding: "20px 0"
  demo-selector:
    textColor: "{colors.white}"
  chat-compose:
    textColor: "{colors.white}"
  admin-field:
    backgroundColor: "{colors.back}"
    textColor: "{colors.white}"
    padding: "10px 12px"
  admin-primary-button:
    backgroundColor: "{colors.white}"
    textColor: "{colors.background}"
    height: "44px"
    padding: "9px 14px"
---

# Design System: Miggy Rivera — Centered Dark Portfolio

## Overview

**Creative North Star: "The Centered Dark Folio"**

A persistent sidebar frames a narrow editorial column that sets white serif headings and clear sans-serif reading text against black. The real stage-speaking photograph provides personal presence through reversible CSS grayscale and contrast.

Layered sheets and outlined entries distinguish project browsing. Experience, community, credentials, and contact stay direct, using transparent rows, plain text, and fine rules. The implemented site preserves the approved architectural brochure character.

The owner admin extends this world through plain labeled forms, text buttons, and ruled reading lists. It uses the same palette and fonts, with restrained task-oriented spacing and explicit status text.

This record describes the public folio and local `/admin/` workspace. Public authority is `src/styles.css`, `src/render.mjs`, and `src/client.mjs`; admin authority is `admin/index.html`, `admin/admin.mjs`, and `admin/admin.css`. The database draft is adapted by `src/model.mjs`; `src/content.mjs` is a seed fixture. Public pages and the guide consume a published snapshot; routes and counts follow visible content. The seed has eleven public routes. Figma file `7rn1fyhZs4dJxqjHdJ1Xao`, page `14:233`, remains provenance: Home `14:261`/`14:263`, Projects source `27:483`/`27:484`, Experience `39:1679`/`39:1738`, Credentials `34:1443`/`34:1549`. The website labels Work as Projects. Home Practice & community links to Hackathons, Leadership, and Organizations; these pages reuse the reading shell. Publication is local; no hosted deployment is configured.

The owner workspace uses Neon PostgreSQL through server-only `pg` queries, one scrypt-authenticated owner, persisted hashed opaque sessions, and encrypted HttpOnly SameSite Strict cookies. Private originals stay in ignored `.local/originals/`; public visitors receive static content releases and referenced approved asset copies. The dedicated `portfolio` schema revokes PUBLIC access. The current backend contract is `docs/superpowers/specs/2026-10-26-neon-migration.md`; the earlier Supabase contract is historical. This backend replacement preserves the folio, admin interaction patterns, design tokens, component previews, profile tech stack, and release-captured GitHub activity. Publication remains local.

**Key Characteristics:**

- Black and neutral grayscale throughout.
- Libre Caslon Display headings and Manrope reading text.
- A centered reading column with fluid mobile layouts.
- Card treatments confined to project browsing.
- Real supplied assets and explicit unavailable content.
- Plain admin forms, text actions, and ruled lists using the existing identity.

## Colors

The frontmatter retains the eight approved grayscale values. Each maps directly to the same-named CSS custom property: `background` → `--background`, `sheet` → `--sheet`, `back` → `--back`, `white` → `--white`, `muted` → `--muted`, `rule` → `--rule`, `diagram` → `--diagram`, and `vellum` → `--vellum`.

### Primary

- **White:** primary text, headings, selected controls, and focus outlines.

### Neutral

- **Background Black:** full page canvas.
- **Sheet Gray:** deployed project tiles.
- **Backing Gray:** recessed folio sheets and the media action surface.
- **Muted Gray:** supporting text and unavailable destinations.
- **Rule Gray:** separators and project outlines.
- **Diagram Gray:** workflow, recorded preview, player, and placeholder logo surfaces.
- **Dark Vellum:** retained approved translucent token; the current folio surface uses Sheet Gray. Runtime CSS still defines `rgba(22,22,22,.96)` while the preserved approved hex encodes alpha approximately 0.9608.

**The Grayscale Rule.** Keep the approved grayscale palette; cream and chromatic accents are outside this identity.

The source Figma contrast audit measured white/background (19.80:1), muted/background (9.66:1), and muted/diagram (7.76:1). These are the established pairings, not a claim about every combination.

## Typography

Libre Caslon Display (400) and Manrope (400/500) are self-hosted through `@font-face`. CSS stacks are `--display: 'Libre Caslon Display', Georgia, serif` and `--body: Manrope, Arial, sans-serif`. The frontmatter preserves the ten approved type roles and values.

| Role | Use in the website |
| --- | --- |
| Name desktop / mobile | Page h1: 64/70 px; 48/54 px in the compact layout. |
| Section | Section headings and selected demo title: 36/42 px. |
| Project title | Folio and featured tile headings: 32/36 px. |
| Row title | Smaller deployed tile headings and preview marks: 24/29 px. |
| Body | Reading copy and Experience/Credentials row names: 15/26 px. |
| Intro | Introductions: 16/28 px. |
| Small | Supporting text, captions, and preview names: 12/20 px. |
| Link | Medium text actions and navigation: 13/20 px. |
| Label | Diagram labels, folio tools, and LOGO placeholders: 11/16 px. |

Responsive component variations remain local: rear-sheet titles use 26/34 px on desktop and 24/34 px on mobile; the guide title uses 26/32 px and 24/28 px. Sidebar links use 13/22 px, and mobile guide input uses 16/20 px. At 360 px, workflow labels stay 11 px without tracking. The approved shared type primitives and font families are unchanged.

**The Two Voices Rule.** Use Libre Caslon Display for display and project headings, and Manrope for reading text, rows, links, and labels.

Admin variations are local to its stylesheet: header (36/42 px), compact header (32/38 px), section headings (30/38 px), reading-list subheadings (17/26 px), and field labels (13/22 px). Inputs use Manrope (14/23 px), rising to (16/23 px) at (640 px) and below. Structured workflow JSON uses the system monospace stack; the compact field rule also raises its size to (16 px). These variations preserve public type primitives.

## Layout

`.page-shell` has a (792 px) maximum outer width including (24 px) side padding, leaving a (744 px) maximum content column. Padding is (64 px) top / (48 px) bottom. A fixed (220 px) desktop sidebar offsets the content area; at (1024 px) and below, the sidebar gives way to a sticky Menu bar/native navigation dialog and page top padding becomes (40 px). The layout is fluid; fixed Figma frame heights and canvas offsets are provenance, not website dimensions.

Shared section separation is (64 px), with (32 px) above ruled content; Selected work starts after (88 px) on desktop and (64 px) in compact layout. Home order is identity/photo, introduction and résumé/email, Selected work, Experience, Practice & community, credential previews, Tech stack, GitHub contributions. Contact and colophon move to the sidebar and compact Menu. Experience, Credentials, and the three community pages have a heading/introduction followed by transparent rows and Back to home.

Projects uses a two-column grid with (24 px) gaps. The first visible deployed entry spans both columns; the seed places AWS above four supporting tiles. At (600 px) and below, entries stack with (16 px) gaps. The recorded selector uses five desktop columns and two compact columns above the shared (16:9) player; its entries follow visible content. At (360 px) and below, workflow diagrams stack vertically and their arrows are hidden to preserve reading space.

The admin shell has a (1064 px) maximum width, (40 px 28 px 80 px) padding, and an (800 px) maximum editor width. Form columns use a (24 px) gap. At (640 px) and below, shell padding becomes (24 px 16 px 56 px), form/relationship columns stack, asset pickers stack, and asset previews shrink from (88 px) to (64 px). Actions wrap.

The public CSS thresholds are max-width (1024 px), (600 px), and (360 px). Verification covers 320, 390, 768, and 1440 px without horizontal overflow. Source SVG dimensions stay at the appropriate (14 px), (16 px), and mobile workflow (12 px) sizes; icons are not normalized to a larger generic box.

## Elevation & Depth

Depth comes from real layered title-band tabs, tonal surfaces, and thin outlines. Dialog backdrops use the existing background token with opacity (0.8), rather than a new color. The website defines no shadows or background-blur effects. Experience and Credentials remain on the page canvas. Selector changes are immediate; anchor scrolling is smooth unless reduced motion is requested.

**The Project Folio Rule.** Reserve card treatments for project browsing; use transparent rows and fine rules for Experience and Credentials.

## Shapes

Project surfaces, preview regions, and logo placeholders are square-edged. Fine (1 px) rules organize the layout. Logos use (44 × 44 px) boxes; unknown marks visibly read LOGO. The real stage image keeps its supplied bytes and uses `filter: grayscale(1) contrast(1.05)` with responsive cropping.

## Components

### Navigation and text actions

The fixed desktop sidebar contains identity, Home, Projects, Experience, Credentials, Gallery, community routes, and Get in touch. Active routes use white underlined text; experience details keep Experience current. At widths up to (1024 px), a sticky MR/Menu bar opens a native modal navigation dialog. Menu and Close are plain text labels. Gallery is offered in navigation, with no Home Gallery section.

Text links retain their (8 px) SVG gap and (44 px) minimum height. Keyboard focus uses a (1 px) white outline with (5 px) offset. Résumé opens the supplied local PDF; Email is a real mailto link. GitHub/LinkedIn remain omitted while their URLs are null.

### Selected project folio

The seed defaults to AWS Website, followed by Rule VII and HYDRA. Up to three visible featured projects form real title-only tab buttons; the active title band connects to the detailed panel below. Rear titles remain legible and clickable. Selection reorders the bands, updates the visible panel, and uses roving focus with Arrow keys/Home/End. One or two selected sheets use smaller stack heights; zero sheets show a plain missing-content message. There is no automatic rotation or detached tab strip.

Desktop title bands use a (64 px) minimum height, (14 px 24 px) padding, and staggered (0/52/104 px) vertical positions. The selected body uses Sheet Gray with (0 24 px 24 px) padding; compact padding is (0 16 px 20 px). Decorative pseudo-sheets are removed. Workflow diagrams stay explicitly conceptual; View project opens the matching Projects fragment when the live URL is missing.

### Deployed project tiles

Charcoal tiles have fine rules, (24 px) padding, and (12 px) content gaps. The desktop AWS lead uses (28 px) padding and fuller supplied role/contribution text. Unknown supporting project information remains pending. Missing live-site links show Website link coming soon; unavailable titles are plain text rather than fake anchors. There are no internal project detail pages.

### Experience and credential rows

Experience uses a (44 px) logo column, (20 px) desktop / (16 px) compact gap, (20 px) vertical padding, and a bottom rule. Compact Home rows omit the description; full Experience rows add supplied descriptions. Both are complete detail-page anchors with a (14 px) arrow and the same name-underline hover as community rows. Heights follow content. Detail pages place the organization H1 before role/context and description, then list related project links plus All experience/Back to home. Projects links back to the associated experience. Every sample project relationship is explicitly labeled a sample connection, separate from supplied employment facts.

Credentials adds a (128 px) verification column on desktop. In compact layout, Verify moves below name/provider alongside the logo, with (16 px) vertical padding and a (44 px) target region. The seed contains six explicitly generic samples; sample notices follow the current entries. Missing verification uses noninteractive text with `aria-disabled`; View certificate is reserved for actual document evidence, not independent verification.

### Community row links and reading pages

Home uses three complete row anchors for Hackathons (`/hackathons/`), Leadership (`/leadership/`), and Organizations (`/organizations/`). Each reuses the established body-sized row name and muted summary, with the supplied (14 px) arrow on the right, (20 px) vertical padding/gap, and a fine bottom rule. The entire transparent row is clickable and keyboard accessible; hover underlines the name while retaining the plain row surface. Global visible focus styling applies.

Category pages reuse the Experience row renderer and the established page shell, heading scale, separators, and Back to home. Descriptions render only when supplied. The Hackathons page visibly labels its single generic sample; Leadership and Organizations use known roles/involvement without fabricated dates, awards, or duties. This is a reused reading-row pattern, not a new card or navigation system.

### Recorded work selector and player

All visible recorded choices remain available in stable order; the seed contains five. A white preview outline marks the active item; hover uses the muted rule. Buttons have semantic tab state and the same Arrow/Home/End keyboard behavior as the folio. Selection updates the shared title, purpose, contribution, links, and fragment without autoplay. Context changes use a polite live region.

Seed video URLs/posters are missing: the player says Video preview pending and disables Demo coming soon. When a valid source is configured, explicit Play loads a privacy-enhanced YouTube iframe or native video with controls. The built implementation does not inherit the Figma prototype's illustrative Playing state.

### Gallery and native dialogs

Gallery is a two-column (2×2) image grid, stacking into one column at (600 px). The seed contains one supplied stage photo and three visibly empty Photo to be added slots; the current snapshot supplies the entries. The actual photo is a button opening a native lightbox; empty slots are not interactive. Captions remain plain text. Gallery images use reversible grayscale and the existing external-arrow SVG.

Navigation, the photo lightbox, and the Portfolio guide use native modal dialogs with Close/Escape/backdrop dismissal and focus return. The layout locks background scrolling while a dialog is open. Modal surfaces and borders reuse the existing palette. No new shadow or blur vocabulary is introduced.

### Portfolio guide

Ask about my work opens a restrained local chat dialog with a Portfolio guide heading, conversation log, three suggested questions, labeled input, Send, and Close. The desktop panel is (420 px) wide; mobile uses the available width with (12 px) outer insets. Messages use plain text/rules rather than decorative bubbles. The composer highlights its border on focus, and Send is disabled for empty input.

`src/assistant.mjs` matches questions against configured portfolio facts; it does not call an external AI model or any network service. Questions are trimmed to (500) characters. Visitor text is inserted with `textContent`; generated links are restricted to local paths/mailto. Unknown questions receive a limited-knowledge fallback. Conversations remain in the current tab without persistence or simulated typing. Project associations and missing credentials are described honestly as samples/pending content.

### Admin forms, actions, and reading lists

Admin uses a labeled native field with a Backing Gray fill, fine Rule Gray border, square corners, (44 px) minimum height, and (10 px 12 px) padding. Labels sit (7 px) above controls; field groups have (20 px) bottom spacing. Textareas resize vertically, workflow JSON has a taller code field, and existing IDs use readonly muted text. Focus has a white (2 px) outline at (3 px) offset. Help is muted; invalid controls use a white border and adjacent text prefixed Error, connected through `aria-describedby` and `aria-invalid`. Errors do not depend on color.

Admin primary buttons use White fill and Background Black text, (44 px) minimum height, (9 px 14 px) padding, and Manrope (500, 13/22 px). Hover uses Muted Gray; the shared pressed rule uses Diagram Gray, while the primary hover selector takes precedence; keyboard focus retains the public white outline. Disabled pending actions use (0.5) opacity and a wait cursor. Secondary actions retain transparent surfaces and fine borders, with Sheet Gray hover. No glyph icons or dashboard cards are added.

Profile, Projects, Experiences, Credentials, Community, Gallery, Assets, and Releases are wrapping text navigation. Entries, assets, and releases use transparent reading lists with (20 px) vertical row padding, fine top/bottom rules, muted metadata, and wrapping actions. Active navigation uses a white border and Sheet Gray. Save draft, Preview draft, and Publish locally remain distinct text actions. Status updates use a polite live region; field/form errors are explicit, failed saves retain values, and unsaved edits warn before leaving. Empty lists use plain explanatory text. Uploaded originals are private by default; approved published copies and login-protected previews follow backend permissions without a new visual treatment.

### Source-backed sidecar previews

`.impeccable/design.json` contains ten source-derived previews: text link, sidebar navigation, real selectable sheets, clickable Experience row, credential row, recorded selector, community row link, guide composer, Admin field, and Admin primary button. The eight public previews remain intact; the two admin primitives use source-derived CSS and focus/error/pending states. SVG geometry is inlined from shipped assets. Panel previews are static states; sidebar positioning is contained for preview purposes, while the website supplies the actual fixed/dialog behavior. Gallery is documented above rather than embedding a duplicate photograph in the sidecar.

## Do's and Don'ts

### Do:

- Do reuse the shared CSS tokens and self-hosted typefaces.
- Do preserve the supplied stage-photo bytes and reversible grayscale/contrast treatment.
- Do keep current recorded choices visible and maintain keyboard selection.
- Do show missing media and destinations honestly as unavailable.
- Do keep credential samples and logo placeholders explicit.
- Do label every temporary experience/project association as a sample connection.
- Do use plain labeled admin forms, text status, and ruled reading lists.

### Don't:

- Don't introduce cream, chromatic accents, or unrelated font families.
- Don't extend project-card styling into Experience or Credentials.
- Don't invent internship duties, dates, detailed freelance scope, awards, or project outcomes.
- Don't simulate playback or link missing destinations to fake URLs.
- Don't describe a certificate document as independent issuer verification.
- Don't present the local Portfolio guide as an external AI service or a source of unprovided facts.

## Home technology and activity

Tech stack uses an unboxed wrapping list of 28 px white logos and 12/20 px labels, with 24 px above the list, 28 px row and 32 px column gaps. Logos are self-hosted Simple Icons assets. Contributions use a static 7-row calendar with grayscale intensity, month labels, daily title text, aggregate count, update date, and Less/More legend. The calendar has a 680 px minimum width inside a keyboard-focusable horizontal scroller on compact screens, initially showing the latest months. No extra cards or accent colors are introduced. The sidebar uses compact contact copy, the actual email link, configured social destinations, and the colophon; compact navigation includes the same details.
