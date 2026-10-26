# Portfolio implementation specification

Implement the approved Figma design in the user's blank attached Portfolio directory. The user approved this visual system and specifically requested four pages, desktop through mobile. This is a local static website; publication was not requested.

## Included behavior

- Four actual HTML routes: Home `/`, Projects `/projects/`, Experience `/experience/`, Credentials `/credentials/`. Shared nav uses Projects, Experience, Credentials, with MR linking Home. Remove the unfinished Practice page/nav/placeholder section.
- Home retains the supplied stage photograph, identity/bio, real resume/email links, three-state project folio, compact experience with View all, compact credentials with View all, and contact/footer. Do not show unsupported Github/LinkedIn links.
- Projects shows five deployed entries: full-width AWS first, then four in a 2×2 desktop grid/one mobile column. Context stays on Projects, no project detail pages. Recorded work has five persistent selectors and one shared player. Selection updates content but never autoplays; configured video is loaded only on Play.
- Experience has three plain logo/role/organization/description rows, using supplied internship, freelance, and AWS facts. Credentials uses the six approved generic mockup entries. LOGO placeholders and missing credential/provider names remain editable; do not fabricate records or awards.
- Missing external URLs render honest unavailable text, not broken or fake links. A pending recording shows a pending state. Configured URL support includes safe HTTP(S) project destinations, supported YouTube URLs converted to privacy-enhanced embed URLs, or MP4/WebM/Ogg video. Reject javascript/data protocols and malformed video identifiers.
- Every page is meaningful HTML without JS. JS enhances selectors; no backend, framework, analytics, chat, theme toggle, hidden carousel, or admin interface.

## Visual authority

The high-fidelity generated contexts in `work/figma/*.txt` are the implementation authority. Desktop max content width744px, mobile padding24px yielding342px at390. Background#0a0a0a, white/muted gray text, same eight grayscale tokens as DESIGN.md. Libre Caslon Display display/section type, Manrope body. Cards only for project browsing. Preserve exact locally downloaded Figma photo/SVG assets and responsive image placement. Self-host both font families. Use fluid CSS grid/flex with sensible content-driven breakpoints, not duplicate device DOM trees.

## Verification

Run Node built-in tests before and after implementation, build the static pages, validate all local assets and navigation destinations, and inspect desktop/mobile screenshots for all four routes. Exercise keyboard and mouse selectors, pending media, URL security, internal navigation, and no overflow at320/390/768/1440. Keep unknown content and URLs explicit in final handoff.

## Workflow limitation

The inherited AGENTS.md dual-provider workflow was attempted. Automatic approval review rejected sending the brief to an external coding provider because it contains personal/design content. The safe implementation stays within this session. No external model received the brief.
