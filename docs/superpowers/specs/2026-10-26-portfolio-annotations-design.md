# Annotated portfolio revision

Implement the user's five browser annotations and chatbot UI directly in the current static website. This extends the approved monochrome brochure rather than changing its identity. User authorized mock project relationships on 2026-10-26; label these as sample connections.

Desktop: fixed left sidebar with Home, Projects, Experience, Credentials, Gallery and community routes; narrow reading column remains centered in remaining space. Below1024px use a compact menu button and native dialog navigation. Current experience detail highlights Experience. Gallery appears only in navigation.

Experience: entire plain row links to a dedicated route per experience, same underline hover as community. Detail uses existing heading/intro, role and organization, supplied description, related project links; reverse links in Projects connect back. Sample relationships do not imply supplied employment facts.

Folio: replace decorative pseudo-sheets and detached tabs with real title-only layered tabs; selected tab connects visually to detailed sheet. Behind titles remain legible and clickable; retain arrow/Home/End keyboard support and add no automatic rotation.

Gallery: two-column desktop photo grid, one column mobile. One supplied stage photo, three honest empty image slots for later content. Existing photo opens a native lightbox; empty slots are not clickable. No landing Gallery section.

Chat: native modal dialog opened by Ask about my work. Dark restrained conversation, suggested questions, labeled input, send, and close. Local rule-based answers from configured portfolio facts with real navigation links, unknown-question fallback and honest Portfolio guide label. No external model, credentials, storage, or simulated typing. Native dialog provides Escape, modal focus, focus return. Render user text using textContent.

Acceptance:11 static routes, no broken internal links, accessible full experience anchors, both directions of sample project associations, all3 folio headers clickable, sidebar current state, mobile menu dismissal, gallery real photo/lightbox/empty slots, chat suggested/free text/unknown/empty/long input/security. Tests/build/syntax and desktop+mobile visual/interaction QA.
