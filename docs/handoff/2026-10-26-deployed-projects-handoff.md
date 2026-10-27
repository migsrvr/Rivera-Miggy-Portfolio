# Handoff: real deployed projects in the portfolio (2026-10-26)

> Follow-up: [confirmed project roles and experience associations](2026-10-26-project-roles-handoff.md) records the owner's supplied roles, replacement of sample associations, and the newer active release. Read that handoff after this historical session record.

Context for the next agent (Codex) picking up this repo. It covers what was changed in the session that replaced the mockup "Deployed projects" with real Vercel deployments, how content flows through this app, and what's still open.

## TL;DR

- The **Deployed projects** entries now use real live URLs, GitHub repos, purposes, and tool stacks taken from the Vercel projects and their READMEs.
- **Hydra** stays in Deployed with `url: null` ("Website link coming soon") because it isn't deployed yet. **Rule VII** is live on Vercel.
- The changes went into **three places**: the seed file (`src/content.mjs`), the **Neon draft database**, and a **new published release** (`5ac23b9b-fc42-4bb9-bbcb-a85655d0cab6`) that the local server now shows.
- Nothing is committed. The working tree also contains earlier uncommitted work that this session didn't make (listed below).

## How content works in this app (read this first)

Editing `src/content.mjs` does **not** change the running site by itself.

```
src/content.mjs  ──(npm run seed: only when the DB is EMPTY)──▶  Neon DB draft (portfolio.content_entries)
                                                                        │
                                              admin editor (/admin/) edits the draft
                                                                        │
                                              Publish (admin button / Publisher.publish)
                                                                        ▼
                                              .local/releases/<uuid>/   (rendered static site)
                                              .local/active-release.json → { "id": "<uuid>" }
                                                                        │
                                              npm run dev (server/app.mjs) serves the active release
                                              (falls back to dist/ only if no active release exists)
```

Key files:
- `src/content.mjs`: seed content (profile, `deployed`, `recorded`, `featured`, experiences, credentials, community, gallery)
- `src/model.mjs`: `createSeedDraft()` turns the seed into draft entries; zod schemas in `entrySchemas`, plus `validateDraft()` and `toContent()`
- `src/render.mjs`: renders every page from content (`deployedTile()`, `folio()`, and so on)
- `src/media.mjs`: `safeExternalUrl()` normalizes URLs with `new URL().href`, which **adds a trailing slash** (`https://x.vercel.app` becomes `https://x.vercel.app/`)
- `server/repository.mjs`: `getDraft()` and `saveEntry(collection, entry)` (upsert on `(collection,id)`)
- `server/publisher.mjs`: `Publisher.publish(repo)` builds a release into `.local/releases/<id>` and switches the active pointer. **A running server reads the active release only at startup**, so restart `npm run dev` after publishing from a script.
- `scripts/seed-content.mjs`: seeds only when the DB is empty; it never overwrites existing content
- `.env.local`: `DATABASE_URL` (Neon, `ep-tiny-pond-b4at22zm...neon.tech`), `SESSION_SECRET`, `APP_ORIGIN`, `HOST`, `PORT`. Never print or commit its values.

## What was verified on the hosting platforms

| Platform | Access | Findings |
|---|---|---|
| Vercel | `npx vercel` (CLI 65.2.0, not installed globally), account `hyakkimaru0123-7781`, team `hyakkimaru0123-7781s-projects` (hobby) | 6 projects, all returning HTTP 200 (table below) |
| Railway | `railway` CLI 5.54.1, logged in as `rivera.dev.miggy@gmail.com` | 1 project, `captivating-delight`, with 1 service, `AWS-Photobooth` (the Photobooth backend) |
| Render | **Render CLI not installed** on this machine | Not checked |

Project mapping (Vercel project to portfolio id):

| Portfolio id | Vercel project | Live URL | GitHub repo (public) |
|---|---|---|---|
| `aws-website` | awssbgjru | https://www.awssbgjru.me | https://github.com/migsrvr/awssbgjru |
| `aws-photobooth` | aws-photobooth (+ Railway backend) | https://aws-photobooth.vercel.app | https://github.com/migsrvr/AWS-Photobooth |
| `care-cures` | **health-service** (Care Cures = the health one) | https://health-service-one.vercel.app | https://github.com/migsrvr/Health-Service |
| `mediseena` | mediseena | https://mediseena.vercel.app | https://github.com/migsrvr/Mediseena |
| `pax-virentia` | pax-virentia | https://pax-virentia.vercel.app | https://github.com/migsrvr/Pax-Virentia |
| `rule-vii` | rule-vii-frontend | https://rule-vii-frontend.vercel.app | https://github.com/migsrvr/Rule-VII---AI-Architect |
| `hydra` | not deployed yet (the owner will deploy it) | `null` | no public repo found |

## Changes made this session

### 1. `src/content.mjs`
- Replaced the placeholder `.map()` (which produced Photobooth, Care Cures, Mediseena, and Pax Virentia with all-null fields) with explicit entries holding real `url`, `repositoryUrl`, `purpose`, and `tools`. Mediseena got the role `Capstone team project · JRU`; Pax Virentia got `Research team project · JRU`.
- `aws-website`: added `url` and `repositoryUrl`; the copy is unchanged.
- `rule-vii`: added `url` and `repositoryUrl`. Changed `tools` from `Python, FastAPI, PostgreSQL` to the real stack, `Next.js, FastAPI, Supabase, pgvector, Groq`. The `featured` entry's tools string is now `Next.js · FastAPI · Supabase · Groq`.
- `hydra`: unchanged (`url: null`).
- `contribution` is deliberately **`null`** for Photobooth, Care Cures, Mediseena, and Pax Virentia. The READMEs describe the projects, not the owner's personal part, and the owner hasn't supplied that text yet. Don't invent it.

### 2. `tests/content.test.mjs`
Added the test `deployed projects link to their live sites and repositories, except Hydra until it deploys`. It asserts that every deployed project except Hydra has an `https://` `url` and a `github.com` `repositoryUrl`, and that `/projects/` renders each link (compared via `new URL(url).href` because of the trailing-slash normalization). It also asserts that Hydra shows "Website link coming soon".

Verification at handoff: `npm test` passed 49/49, `npm run check` passed, and `npm run build` built 11 pages.

### 3. Neon draft DB and a new release
A one-off script (copied in the appendix below) did the following:
1. Backed up the full draft to `C:\Users\Miggy\AppData\Local\Temp\claude\C--Users-Miggy-Documents-ChatGPT-Portfolio\77a856c0-fcf0-4904-b371-edcf4b8ca8b7\scratchpad\draft-backup-1793004890696.json`. That's a temp folder, so copy the backup somewhere permanent if it matters.
2. Updated 6 `projects` entries in the draft. Every change filled a field that was null or an empty array, except Rule VII's `tools`, which was overwritten. Hydra and Rule VII were already `kind: 'deployed'` in the DB.
3. Published release `5ac23b9b-fc42-4bb9-bbcb-a85655d0cab6`, which is now the active release. The previous active release was `7f102f4e-7414-4ad2-8d00-9092dcaa5502` (2:39 PM), and you can restore it from the admin's release list.

## Uncommitted work NOT made in this session

These files were already modified when the session started (git status at session start): `DESIGN.md`, `PRODUCT.md`, `src/client.mjs`, `src/render.mjs`, `src/styles.css`, `tests/portfolio.test.mjs`, the new `tests/project-revision.test.mjs`, and the part of `src/content.mjs` / `tests/content.test.mjs` that moved Hydra and Rule VII from `recorded` to `deployed`. Review them before committing. Only commit when the owner asks.

## Running it locally

```powershell
cd C:\Users\Miggy\Documents\ChatGPT\Portfolio
npm run dev          # http://127.0.0.1:4173/  (admin: /admin/)
npm test             # unit tests
npm run check        # syntax check
npm run build        # builds dist/. NOT what the server shows while an active release exists
```

- If you get `EADDRINUSE 127.0.0.1:4173`, an old dev server is still running. Free the port with `Stop-Process -Id (Get-NetTCPConnection -LocalPort 4173 -State Listen).OwningProcess`.
- To make content or code changes visible, edit in the admin (or use the script below), then **Publish**, then restart `npm run dev`.

## Open items

1. **Hydra URL.** When Hydra is deployed, set `url` (and `repositoryUrl` if it becomes public) in `src/content.mjs` **and** in the draft DB, then publish. Update the new test, which currently expects Hydra's url to be `null`.
2. **Contribution text** for Photobooth, Care Cures, Mediseena, and Pax Virentia. Wait for the owner to write it.
3. **AWS Photobooth honesty.** Its README (Sep 2026) says the backend is a stub, so avoid claiming finished print or email features.
4. **Render.** The CLI isn't installed, so whether anything is hosted there is unknown.
5. **Commit.** Nothing is committed yet (branch `master`).

## Appendix: sync script used (content.mjs to draft DB to publish)

Run from the Portfolio root. With no flag it's a dry run that writes a backup and prints a diff; `--apply` saves the changes and publishes. Seed values win where they're set, and fields the seed leaves empty keep the draft's value.

```js
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.cwd(),load=p=>import(pathToFileURL(path.join(root,p)).href);
const {prepareEnvironment}=await load('scripts/local-setup.mjs');
const {createDatabase}=await load('server/database.mjs');
const {createRepository}=await load('server/repository.mjs');
const {Publisher}=await load('server/publisher.mjs');
const {createSeedDraft,validateDraft,validateEntry}=await load('src/model.mjs');
const seed=await load('src/content.mjs');

const apply=process.argv.includes('--apply'),here=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const database=createDatabase(await prepareEnvironment(root)),repo=createRepository(database,{originalsRoot:path.join(root,'.local/originals')});
try{
  const draft=await repo.getDraft();
  const backup=path.join(here,`draft-backup-${Date.now()}.json`);await writeFile(backup,JSON.stringify(draft,null,2));console.log('Backup:',backup);
  const ids=new Set(seed.deployed.map(p=>p.id)),seeded=createSeedDraft().entries.filter(e=>e.collection==='projects'&&ids.has(e.id));
  const updates=[];
  for(const source of seeded){
    const current=draft.entries.find(e=>e.collection==='projects'&&e.id===source.id);
    const data=current?{...current.data}:{...source.data};
    if(current)for(const [key,value] of Object.entries(source.data))if(value!==null&&!(Array.isArray(value)&&!value.length))data[key]=value;
    const next=validateEntry('projects',{...(current||source),data,position:source.position,updated_at:undefined});
    const changed=Object.keys({...data,...current?.data}).filter(k=>JSON.stringify(data[k])!==JSON.stringify(current?.data?.[k]));
    if(current&&current.position!==source.position)changed.push('position');
    if(!changed.length)continue;
    updates.push(next);
    console.log(`\n${source.id}${current?'':' (new)'}`);
    for(const k of changed)console.log(`  ${k}: ${JSON.stringify(k==='position'?current.position:current?.data?.[k])} -> ${JSON.stringify(k==='position'?source.position:data[k])}`);
  }
  validateDraft({entries:draft.entries.map(e=>updates.find(u=>u.collection===e.collection&&u.id===e.id)||e).concat(updates.filter(u=>!draft.entries.some(e=>e.collection===u.collection&&e.id===u.id))),relationships:draft.relationships});
  console.log(`\n${updates.length} project entr${updates.length===1?'y':'ies'} to update.`);
  if(apply&&updates.length){
    for(const entry of updates)await repo.saveEntry('projects',entry);
    const publisher=await new Publisher({root}).init(),release=await publisher.publish(repo);await publisher.job;
    if(publisher.lastError)throw publisher.lastError;
    console.log('Published release',release.id,'->',publisher.activeId());
  }else if(!apply)console.log('Dry run only. Re-run with --apply to save and publish.');
}finally{await database.close();}
```
