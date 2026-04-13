# BladWijzer — PWA Plantenapp

> Persoonlijke Progressive Web App voor inventaris van binnen- en buitenplanten, met focus op **snoei-inzicht** per plant.

De eigenaar (Jim) is **geen developer**. Wees expliciet over commando's, aannames en gevolgen. Leg keuzes kort uit waar relevant. Vraag bij twijfel door voordat je grote wijzigingen maakt.

---

## 1. Scope & kernprincipes

**Kernprobleem**: één plek om alle eigen planten (binnen + buiten) vast te leggen, met inzicht in wanneer elke plant gesnoeid mag worden.

**Niet in scope**:
- Geen wateringsplan, geen kalender, geen herinneringen/notificaties
- Geen plantidentificatie via foto (AI/ML)
- Geen multi-user, geen auth, geen cloud-sync
- Geen financiële/commerciële functies

**Kernprincipes**:
- **Single-user, lokaal-eerst**: alle eigen data in IndexedDB
- **Volledig gratis**: geen betaalde API's, geen API-keys vereist
- **Rijk assortiment**: via Wikimedia + curated catalogus
- **Nederlandse UI**, Engelse code-termen

---

## 2. Tech stack

| Laag | Keuze | Reden |
|---|---|---|
| Framework | **React 18 + Vite** | Breed ecosysteem, bekend vanuit BCS Connect |
| Taal | **TypeScript** | Voorkomt fouten, Claude Code werkt er beter mee |
| Styling | **Tailwind CSS** + CSS-variabelen uit design system | Consistentie met `DESIGN_SYSTEM.md` |
| UI-componenten | **shadcn/ui** + Radix primitives | Toegankelijk, kopieerbaar, past bij Tailwind |
| Icons | **lucide-react** | Consistent, gratis, bevat `Leaf`, `Scissors`, etc. |
| State | **Zustand** (global) + React state (lokaal) | Eenvoudiger dan Redux |
| Lokale opslag | **Dexie.js** (IndexedDB-wrapper) | Planten, foto's (als Blob), catalogus-cache |
| Routing | **React Router v6** | Standaard |
| PWA | **vite-plugin-pwa** (Workbox onder de motorkap) | Service worker, manifest, install prompt |
| Fonts | **@fontsource/inter** + **@fontsource/fraunces** | Self-hosted, offline |
| Linting | **ESLint + Prettier** | Auto-format |
| Package manager | **pnpm** (bij voorkeur) of npm | |

**Externe bronnen (runtime, online)**:
- **Wikimedia Commons API** → meerdere referentie-afbeeldingen per soort
- **Wikipedia REST API** (nl + en fallback) → korte beschrijving per soort
- Geen API-key nodig, redelijk gebruik onbeperkt

---

## 3. Mappenstructuur

```
/
├── CLAUDE.md                    # dit bestand
├── DESIGN_SYSTEM.md             # tokens, componenten, regels
├── README.md                    # korte gebruikersinstructies
├── Icons/                       # BRON-assets (niet aanraken)
│   ├── App icon.svg             # app-icoon voor homescreen/PWA
│   └── Wordlogo.svg             # woordmerk voor in-app header/splash
├── public/
│   ├── icon.svg                 # kopie van "App icon.svg" (PWA)
│   ├── icon-192.png             # afgeleiden (genereren uit SVG)
│   ├── icon-512.png
│   ├── icon-maskable-512.png    # maskable versie voor Android
│   ├── wordlogo.svg             # kopie van "Wordlogo.svg"
│   └── manifest.webmanifest
├── src/
│   ├── main.tsx                 # entry
│   ├── App.tsx                  # router + layout
│   ├── index.css                # Tailwind + design tokens
│   ├── components/
│   │   ├── ui/                  # shadcn componenten (Button, Card, etc.)
│   │   ├── PlantCard.tsx
│   │   ├── PlantForm.tsx
│   │   ├── PlantSearch.tsx      # Command-palette stijl zoeker
│   │   ├── BottomNav.tsx
│   │   └── ...
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Mijn planten (grid)
│   │   ├── PlantDetailScreen.tsx
│   │   ├── AddPlantScreen.tsx   # zoeker + handmatig
│   │   ├── CatalogScreen.tsx    # bladeren door assortiment
│   │   ├── PruneNowScreen.tsx   # deze maand te snoeien
│   │   └── SettingsScreen.tsx   # export/import, thema
│   ├── data/
│   │   ├── db.ts                # Dexie schema + hooks
│   │   ├── catalog.ts           # loader voor plants-catalog.json
│   │   └── plants-catalog.json  # curated database (zie §5)
│   ├── services/
│   │   ├── wikimedia.ts         # image fetch + cache
│   │   └── wikipedia.ts         # beschrijving fetch
│   ├── store/
│   │   └── useAppStore.ts       # Zustand
│   ├── lib/
│   │   ├── prune.ts             # logica "mag ik nu snoeien?"
│   │   ├── export.ts            # JSON backup
│   │   └── utils.ts             # cn(), date helpers
│   └── types/
│       └── plant.ts             # TypeScript types
├── index.html
├── vite.config.ts               # incl. vite-plugin-pwa config
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Data-model

```ts
// src/types/plant.ts

export type Location = 'binnen' | 'buiten';
export type Category = 'kamerplant' | 'tuinplant' | 'kruid' | 'fruit' | 'overig';
export type PruneType = 'bloei-op-oud-hout' | 'bloei-op-nieuw-hout' | 'vorm-snoei' | 'onderhoud' | 'geen';

/** Eén plant in de eigen inventaris (IndexedDB) */
export interface MyPlant {
  id: string;              // uuid
  name: string;            // bijnaam/label, bv. "Hortensia naast keukendeur"
  commonName: string;      // NL-naam, bv. "Hortensia"
  latinName?: string;      // bv. "Hydrangea macrophylla"
  catalogId?: string;      // link naar CatalogEntry (als uit catalogus toegevoegd)
  location: Location;
  room?: string;           // vrij veld: "woonkamer", "voortuin"
  photo?: Blob;            // eigen foto (1 voor MVP)
  notes?: string;
  lastPrunedAt?: string;   // ISO date
  addedAt: string;         // ISO date
}

/** Eén soort uit de curated catalogus (plants-catalog.json, read-only) */
export interface CatalogEntry {
  id: string;              // slug, bv. "hydrangea-macrophylla"
  commonName: string;      // "Hortensia"
  latinName: string;       // "Hydrangea macrophylla"
  category: Category;
  locationHint: Location[];// waar komt hij meestal voor
  pruneMonths: number[];   // 1-12, maanden waarin snoeien oké is
  pruneType: PruneType;
  pruneNotes?: string;     // korte tip in NL
  aliases?: string[];      // alt NL-namen voor zoeken
}
```

**Dexie schema**:
```ts
db.version(1).stores({
  plants: 'id, location, category, addedAt',
  imageCache: 'url, fetchedAt',         // Wikimedia cache
  descriptionCache: 'latinName, fetchedAt',
});
```

---

## 5. Curated plant-catalogus (`plants-catalog.json`)

- **~300-500 planten**, samengesteld door Claude Code bij eerste setup (dekking: veelvoorkomende NL tuin- en kamerplanten, kruiden, fruitbomen)
- Nauwkeurigheid ~80-90% verwacht; Jim kan corrigeren in `src/data/plants-catalog.json` of via toekomstig beheerscherm
- **Velden per entry**: zie `CatalogEntry` hierboven
- **Bronnen voor generatie**: algemene plantenkennis; voor twijfelgevallen `pruneType: 'onderhoud'` + conservatieve snoeimaanden
- **Generatie-prompt** (bij hergenereren gebruiken): "Genereer een NL-talige catalogus van ~400 veelvoorkomende binnen- en buitenplanten volgens het schema `CatalogEntry`. Neem per soort correcte snoeimaanden op. Verifieer bekende 'oud-hout' bloeiers (hortensia macrophylla, sering, forsythia) zorgvuldig."

---

## 6. Schermen (fase 1)

1. **Home** (`/`) — Grid van eigen planten, filter binnen/buiten, zoekbalk, FAB "+ Plant"
2. **Plant-detail** (`/plant/:id`) — Grote foto, snoeiperiode-badge, "laatst gesnoeid" + knop "nu gesnoeid", notities, bewerk/verwijder
3. **Plant toevoegen** (`/add`) — Command-palette zoeker (Cmd+K-stijl) + "Handmatig invoeren"
4. **Catalogus** (`/catalog`) — Bladeren door assortiment, categorie-tabs
5. **Snoei nu** (`/prune`) — Lijst eigen planten waarvoor de huidige maand in `pruneMonths` zit
6. **Instellingen** (`/settings`) — Export/import JSON-backup, thema (systeem/licht/donker), versie-info

**Navigatie**: bottom-nav op mobiel (Home / Snoeien / Toevoegen / Catalogus / Instellingen), zij-nav op desktop.

---

## 7. Offline-strategie (niveau A)

- **App-shell** (HTML/JS/CSS) → precached via Workbox, werkt zonder internet
- **Eigen data** (IndexedDB) → altijd lokaal, altijd beschikbaar
- **`plants-catalog.json`** → gebundeld in build, altijd offline
- **Wikimedia-afbeeldingen** + Wikipedia-beschrijvingen → **alleen online** (geen precache), wel LRU-cache via Dexie voor beelden die eerder bekeken zijn (max ~100 entries)
- **Geen push-notificaties**

PWA-manifest: standalone display, icoon `public/icon.svg` + PNG-afgeleiden (incl. maskable voor Android), thema-kleur primary-green.

**Assets**:
- `Icons/App icon.svg` → gebruikt als PWA-icoon (homescreen, splash)
- `Icons/Wordlogo.svg` → gebruikt als woordmerk in Home-header en in Splash/Instellingen
- Beide SVG's worden bij build naar `public/` gekopieerd; PNG-afgeleiden (192/512/maskable-512) genereer je eenmalig met bv. `sharp` of online tool en commit je in `public/`

---

## 8. Export / import

- Knop in Instellingen → `bladwijzer-backup-YYYY-MM-DD.json`
- Bevat: alle `MyPlant`-records, foto's als base64-strings
- Importknop: bestand kiezen → bevestigingsdialoog → vervangt óf merged (Jim bevestigt per keer)

---

## 9. Deployment

- **Hosting**: **GitHub Pages**
- **Repo**: `BladWijzer` onder Jim's GitHub-account
- Deploy via **GitHub Actions** (`.github/workflows/deploy.yml`) — bouwt op push naar `main` en publiceert `dist/` naar de `gh-pages` branch
- Vite-config: `base: '/BladWijzer/'` zodat assets correct laden onder `https://<user>.github.io/BladWijzer/`
- Custom domein optioneel, later

Na eerste deploy: open URL op telefoon → "Installeer app" in browsermenu → icoon op homescreen.

---

## 10. UI-taal

- **Alle UI-teksten in het Nederlands** (labels, knoppen, foutmeldingen, toasts)
- **Code blijft Engels**: variabelen, componentnamen, functies (`PlantCard`, `addPlant`, `pruneMonth`)
- Geen i18n-library in fase 1 — strings direct in componenten
- Datums in NL-formaat (`Intl.DateTimeFormat('nl-NL')`)

---

## 11. Design system

Zie **`DESIGN_SYSTEM.md`** in de root. Bevat kleuren, typografie, spacing, radius, shadows, motion, componentregels.

Claude Code **moet** dit document raadplegen bij elke UI-wijziging en de daar gedefinieerde tokens (CSS-variabelen + Tailwind-theme) gebruiken in plaats van hardcoded waarden.

---

## 12. Setup-commando's

**Eerste keer (scaffolding)**:
```bash
# Vanuit /Users/jim.van.stratum/Applications/BladWijzer
pnpm create vite@latest . -- --template react-ts
pnpm install
pnpm add react-router-dom zustand dexie dexie-react-hooks lucide-react \
  @fontsource/inter @fontsource/fraunces clsx tailwind-merge
pnpm add -D tailwindcss postcss autoprefixer vite-plugin-pwa workbox-window
pnpm dlx tailwindcss init -p
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input dialog sheet tabs badge \
  select textarea toast skeleton scroll-area command
```

**Dagelijks**:
```bash
pnpm dev          # lokaal draaien (http://localhost:5173)
pnpm build        # productie-build
pnpm preview      # build testen
pnpm lint         # controleren
```

**Git**:
```bash
git init
git add .
git commit -m "initial commit"
# GitHub-repo aanmaken en linken — Claude Code mag dit via `gh` CLI doen na bevestiging
```

---

## 13. Fase 2 (later, niet bouwen zonder vragen)

- Meerdere eigen foto's per plant (fotodagboek)
- Events-log (geschiedenis van snoeibeurten, verpottingen, ziektes)
- Catalogus-browse met rijke categorie-filters
- Kamer/locatie-view met visuele groepering
- Plantidentificatie via foto (Pl@ntNet API)
- Cloud-sync optie

**Niet doen zonder expliciete opdracht**: notificaties, accounts, betaalde integraties, scraping van externe sites.

---

## 14. Werkwijze voor Claude Code

- **Lees eerst** `DESIGN_SYSTEM.md` voordat je UI-code schrijft.
- **Kleine stappen**: bouw/toon resultaten per scherm, niet alles tegelijk.
- **Vraag door** bij ambiguïteit. Jim is geen developer — doe geen onomkeerbare git-operaties zonder bevestiging (push, reset, branch delete).
- **Geen scope-creep**: features buiten fase 1 alleen na expliciet akkoord.
- **Commit-berichten** in Engels, korte imperatief (`add plant detail screen`).
- **Testen**: geen unit-tests verplicht in fase 1. Wel handmatig testen in `pnpm dev` voor elke wijziging.
- **Accessibility-basis**: semantische HTML, focus-states, voldoende contrast (AA), alt-teksten op alle plant-foto's.
- **Performance-basis**: lazy-load images, code-splitting per scherm, `<img loading="lazy">`.
