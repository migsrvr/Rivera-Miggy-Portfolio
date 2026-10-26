# Portfolio annotations implementation plan

Goal: Deliver the five requested revisions and a useful local chatbot UI in the existing static portfolio.
Architecture: Reuse content-driven generation, shared page shell and vanilla progressive enhancement. Add isolated assistant answer logic in src/assistant.mjs; all copy and sample relationships remain in src/content.mjs.
Tech: Node built-ins, HTML/CSS, native dialog, vanilla JavaScript; no dependencies.
Spec: docs/superpowers/specs/2026-10-26-portfolio-annotations-design.md
Constraints: preserve fonts/palette, original10projects, sample content labels, no fabricated factual claims, no Figma, no external service calls, no publishing.

1. Write navigation/detail/gallery/folio and assistant behavior tests, observe failures.
2. Add experience ids/projectIds/sample flags and gallery slots; generate detail routes.
3. Replace shell navigation with desktop sidebar/mobile dialog; render experience links and reverse associations; layer title tabs, gallery and chatbot.
4. Add accessible dialog and folio interaction handlers, pure assistant answer matching using serialized site data. Update build to copy assistant.mjs; syntax check it.
5. Run tests/syntax/build. Review all page/interaction surfaces at mobile+desktop, narrow and tablet overflow, keyboard and console. Fix material findings in one batch.
6. Review scoped code/screenshots and update existing documentation; preserve normative tokens. No commit because no Git repository.
