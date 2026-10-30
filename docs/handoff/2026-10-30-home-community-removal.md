# Remove Home community section — October 30 2026

Follow-up to the Home experience/navigation cleanup: the owner also requested removing the Practice & community section from the landing-page body and discussing possible sidebar additions.

Removed the Home section renderer, its invocation and unused community-link styles. Home now flows from Selected work to its three Experience rows, Credentials, Tech stack and GitHub contributions. Navigation retains the four main destinations. Existing community records and direct page URLs remain intact; no entries were deleted or archived. New sidebar additions are ideas only and have not been implemented.

Updated the former Home-community-link test to require the section's absence while preserving the direct category pages. Adjusted older build tests to check primary navigation prefixes rather than removed community links. Observed the updated test fail before implementation; the full suite now passes 66/66. Static build produces 7 pages with 44 verified local asset references; syntax checks cover 45 JavaScript modules.

Rebuilt the previously published snapshot with the updated templates and asserted that entries, relationships, assets and the saved draft were unchanged. Previous local release: `7cd41f09-0e35-4d82-b15f-76828720a5c1`. Current local release: `caa579fd-1290-4214-a699-dc194ad0dcd0`, published at `2026-10-30T05:47:15.332Z`. Task-local backups and verification reports are in `.local/home-community-removal/`. Refreshed the confirmed portfolio server.

Browser checks at 1440px, 390px and 320px confirmed the five Home section headings in sequence, absence of community markup, the three selected experience rows, the full six-row Experience page, four navigation links and no horizontal overflow or JavaScript errors. All six credentials remain present. Local preview: `http://127.0.0.1:4173/`.

Kept local under the owner's existing instruction. No Vercel deployment or commit was attempted. Earlier uncommitted changes were preserved.
