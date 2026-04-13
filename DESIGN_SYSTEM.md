# BladWijzer Design System

> Het visuele en interactie-fundament voor BladWijzer. **Altijd raadplegen voor UI-wijzigingen.**
> Geen hardcoded kleuren/spacing in componenten — gebruik de tokens uit Tailwind-theme of CSS-variabelen.

---

## 1. Merkidentiteit

- **Naam**: BladWijzer
- **Toon**: rustig, vakmatig, natuurlijk — geen speelsheid, geen emoji-overload
- **Assets**:
  - App-icoon: `Icons/App icon.svg` → `public/icon.svg`
  - Woordlogo: `Icons/Wordlogo.svg` → `public/wordlogo.svg` (gebruik op Home-header en Splash)
- **Thema-kleur (meta)**: `#3e5641` (primary)

---

## 2. Kleuren

### Palet

| Token | Licht | Donker | Gebruik |
|---|---|---|---|
| `--color-bg` | `#ffffff` | `#141815` | Pagina-achtergrond |
| `--color-fg` | `#1a1f1a` | `#e8ebe6` | Primaire tekst |
| `--color-muted` | `#f3f4f1` | `#242a25` | Subtiele achtergrond (cards, inputs) |
| `--color-muted-fg` | `#5a615a` | `#9aa39a` | Secundaire tekst |
| `--color-border` | `#e4e7e0` | `#2f352f` | Randen, scheidingslijnen |
| `--color-primary` | `#3e5641` | `#6b8a6e` | Primaire acties, headers |
| `--color-primary-fg` | `#ffffff` | `#0f1410` | Tekst op primary |
| `--color-accent` | `#a8b5a0` | `#7f8f7a` | Badges, subtiele highlights |
| `--color-accent-fg` | `#1a1f1a` | `#e8ebe6` | Tekst op accent |
| `--color-destructive` | `#8b3a3a` | `#c47272` | Verwijder-acties, errors |
| `--color-destructive-fg` | `#ffffff` | `#1a0f0f` | Tekst op destructive |
| `--color-ring` | `#3e5641` | `#6b8a6e` | Focus-ring |

### Regels
- **Contrast**: minimaal WCAG AA (4.5:1) voor body, 3:1 voor grote tekst en UI.
- **Groene accenten** voor plant-gerelateerde status (in-snoeiperiode badge = accent).
- **Rood** uitsluitend voor verwijderen/destructieve bevestiging — niet voor gewone fouten (gebruik daarvoor `muted-fg`).
- **Dark mode**: volgt `prefers-color-scheme`, override mogelijk in Instellingen (`system | light | dark`).

---

## 3. Typografie

### Fonts
- **Headings**: `Fraunces` (variabel, via `@fontsource/fraunces`) — serif, botanisch karakter
- **Body / UI**: `Inter` (variabel, via `@fontsource/inter`) — sans-serif
- **Fallback stack**: `ui-sans-serif, system-ui, sans-serif`

### Schaal (modulair, ratio 1.25)

| Token | Grootte | Lijn | Gebruik |
|---|---|---|---|
| `text-xs` | 0.75rem (12px) | 1rem | Microtekst, tags |
| `text-sm` | 0.875rem (14px) | 1.25rem | Secundair, metadata |
| `text-base` | 1rem (16px) | 1.5rem | Body |
| `text-lg` | 1.125rem (18px) | 1.75rem | Lead / subheading |
| `text-xl` | 1.25rem (20px) | 1.75rem | h3 |
| `text-2xl` | 1.5rem (24px) | 2rem | h2 |
| `text-3xl` | 1.875rem (30px) | 2.25rem | h1 |
| `text-4xl` | 2.25rem (36px) | 2.5rem | Splash/hero |

### Gewichten
- Inter: `400` (regular), `500` (medium, UI-nadruk), `600` (semibold, knoppen/labels)
- Fraunces: `500` default voor headings, optisch gewicht variabel (`opsz`) via variabele font

### Regels
- Headings `font-serif font-medium tracking-tight`
- Body `font-sans leading-relaxed` (1.6)
- Nooit `text-align: justify`
- Maximaal 65-75 karakters per regel body-tekst

---

## 4. Spacing

4px-basis (Tailwind default):

| Token | px | Gebruik |
|---|---|---|
| `0.5` | 2 | Haarlijn-offsets |
| `1` | 4 | Icon-tekst gap (klein) |
| `2` | 8 | Compacte padding, icon-tekst gap |
| `3` | 12 | Kleine padding, lijst-gaps |
| `4` | 16 | Standaard padding, card-inner |
| `6` | 24 | Section-gap klein |
| `8` | 32 | Section-gap |
| `12` | 48 | Grote verticale scheiding |
| `16` | 64 | Hero-achtig |

**Scherm-padding**: mobiel `p-4`, desktop `p-6` tot `p-8`.
**Plant-grid gap**: `gap-3` mobiel, `gap-4` desktop.

---

## 5. Border radius

| Token | px | Gebruik |
|---|---|---|
| `rounded-sm` | 4 | Inputs, kleine tags |
| `rounded-md` | 8 | Knoppen, kleine cards |
| `rounded-lg` | 12 | Plant-cards, panels |
| `rounded-xl` | 16 | Modals, grote containers, foto-previews |
| `rounded-2xl` | 24 | Splash/hero illustraties |
| `rounded-full` | ∞ | Avatars, chips, FAB |

---

## 6. Shadows

Subtiel, natuurlijk, **nooit** harde zwarte schaduwen.

| Token | Waarde | Gebruik |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(26,31,26,0.05)` | Rusttoestand cards |
| `shadow-md` | `0 4px 12px rgba(26,31,26,0.08)` | Hover cards, FAB |
| `shadow-lg` | `0 8px 24px rgba(26,31,26,0.12)` | Modals, popovers |

In dark mode: shadow opacity verhogen naar 0.3-0.5 omdat achtergrond donker is.

---

## 7. Motion

| Token | Duur | Gebruik |
|---|---|---|
| `duration-fast` | 150ms | Hover, focus, kleine state-wissels |
| `duration-base` | 250ms | Modals openen, sheet in/uit |
| `duration-slow` | 400ms | Pagina-transities, grote bewegingen |

**Easing**: overal `cubic-bezier(0.4, 0, 0.2, 1)` (Tailwind `ease-in-out`).

Respecteer `prefers-reduced-motion: reduce` — schakel niet-essentiële animaties uit.

---

## 8. Iconen

- **Bibliotheek**: `lucide-react` (exclusief — geen mixen met andere sets)
- **Standaard grootte**: `size={20}` in UI, `size={16}` in dense labels, `size={24}` in headers
- **Stroke-width**: 2 (default)
- **Plant-gerelateerde icons**:
  - `Leaf` — algemeen plant/home
  - `Scissors` — snoeien
  - `Sprout` — nieuwe plant / toevoegen
  - `Home` — home
  - `Search` — zoeker
  - `Settings` — instellingen
  - `TreeDeciduous` / `Flower2` — categorie
  - `Sun` / `Cloud` — binnen/buiten hint

---

## 9. Componentregels

### Button
- Hoogtes: `sm` 32px, `md` 40px (default), `lg` 48px
- Varianten: `primary` (bg=primary), `secondary` (bg=muted), `outline`, `ghost`, `destructive`
- Min. hit-area 44×44px op mobiel (padding compenseren bij kleine varianten)
- Met icon: `gap-2`, icon eerst tenzij trailing (zoals "Opslaan →")

### Card
- `rounded-lg border bg-bg shadow-sm`
- Inner padding `p-4`
- Hover: `shadow-md transition-shadow duration-fast`
- PlantCard-specifiek: vierkante foto-bovenzijde, tekstblok onder, Latijnse naam `text-xs italic text-muted-fg`

### Input / Textarea
- `h-10 rounded-md border bg-bg px-3`
- Focus: `ring-2 ring-ring ring-offset-2`
- Label erboven, altijd zichtbaar (niet floating), `text-sm font-medium`
- Foutstatus: border `destructive`, foutmelding in `text-sm text-destructive` eronder

### Dialog / Sheet
- Modal = Dialog (desktop, getrapte), Sheet = bottom-drawer op mobiel
- Backdrop: `bg-fg/40 backdrop-blur-sm`
- Max-breedte modal: `max-w-md`
- Bevat altijd expliciete Annuleren + primaire actie

### Bottom-nav (mobiel)
- 5 items: Home · Snoeien · [+] Toevoegen (floating, gecentreerd) · Catalogus · Instellingen
- Hoogte 64px, `border-t`, safe-area-inset-bottom respecteren
- Actief item: `text-primary`, inactief: `text-muted-fg`

### Badge (snoei-status)
- "Mag nu gesnoeid" → `bg-accent/30 text-primary border border-accent`
- "Snoeien in [maand]" → `bg-muted text-muted-fg`
- "Geen snoei nodig" → `bg-muted text-muted-fg italic`

### Toast
- Positie: bottom-center mobiel, bottom-right desktop
- Max 3 zichtbaar, auto-dismiss 4s
- Succes: default styling; Destructive: destructive kleur

### Skeleton
- Gebruik tijdens Wikimedia-image fetch en bij eerste catalog-load
- `bg-muted animate-pulse rounded-md`

---

## 10. Layout

### Breakpoints
- `sm` 640px — grotere telefoons horizontaal
- `md` 768px — tablets, switch naar zij-nav
- `lg` 1024px — desktop
- `xl` 1280px — ruime desktop

### Regels
- **Mobile-first**: schrijf eerst mobiele styling, voeg `md:` toe voor grotere.
- **Content-breedte**: `max-w-2xl mx-auto` voor detail/forms; grid kan vol-breed.
- **Plant-grid**: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3`
- **Navigatie**:
  - `<md`: bottom-nav (fixed)
  - `>=md`: zij-nav links (`w-60`)
- **Safe areas**: `env(safe-area-inset-*)` voor bottom-nav en FAB op iOS

---

## 11. Toegankelijkheid

- Contrast WCAG AA minimaal
- Focus-ring altijd zichtbaar (`ring-2 ring-ring ring-offset-2`)
- Alle afbeeldingen `alt`-tekst (plant-eigen foto: "Foto van {plantnaam}"; Wikimedia: beschrijving uit API)
- Form-labels via `<label htmlFor>` of `aria-label`
- Toetsenbord: Escape sluit Dialog/Sheet, Enter submit, Cmd+K opent plantzoeker
- `prefers-reduced-motion` honoreren
- Semantische HTML: `<main>`, `<nav>`, `<article>` voor plant-card, `<button>` (nooit `<div onClick>`)

---

## 12. Tailwind-config (richtlijn voor setup)

In `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      bg: 'var(--color-bg)',
      fg: 'var(--color-fg)',
      muted: { DEFAULT: 'var(--color-muted)', foreground: 'var(--color-muted-fg)' },
      border: 'var(--color-border)',
      primary: { DEFAULT: 'var(--color-primary)', foreground: 'var(--color-primary-fg)' },
      accent: { DEFAULT: 'var(--color-accent)', foreground: 'var(--color-accent-fg)' },
      destructive: { DEFAULT: 'var(--color-destructive)', foreground: 'var(--color-destructive-fg)' },
      ring: 'var(--color-ring)',
    },
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
    },
    borderRadius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', '2xl': '24px' },
    transitionDuration: { fast: '150ms', base: '250ms', slow: '400ms' },
  },
},
```

CSS-variabelen in `src/index.css`:

```css
:root {
  --color-bg: #ffffff;
  --color-fg: #1a1f1a;
  --color-muted: #f3f4f1;
  --color-muted-fg: #5a615a;
  --color-border: #e4e7e0;
  --color-primary: #3e5641;
  --color-primary-fg: #ffffff;
  --color-accent: #a8b5a0;
  --color-accent-fg: #1a1f1a;
  --color-destructive: #8b3a3a;
  --color-destructive-fg: #ffffff;
  --color-ring: #3e5641;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #141815;
    --color-fg: #e8ebe6;
    --color-muted: #242a25;
    --color-muted-fg: #9aa39a;
    --color-border: #2f352f;
    --color-primary: #6b8a6e;
    --color-primary-fg: #0f1410;
    --color-accent: #7f8f7a;
    --color-accent-fg: #e8ebe6;
    --color-destructive: #c47272;
    --color-destructive-fg: #1a0f0f;
    --color-ring: #6b8a6e;
  }
}

/* Handmatige override via data-theme op <html> */
html[data-theme='light'] { color-scheme: light; /* tokens zoals :root */ }
html[data-theme='dark']  { color-scheme: dark;  /* tokens zoals dark */ }
```

---

## 13. Do's & Don'ts

**Wel**
- Tokens gebruiken via Tailwind classes (`bg-primary`, `text-muted-fg`)
- Consistente radius per component-type
- Ruime whitespace — planten-foto's zijn de helden
- Nederlandse UI-teksten, kort en direct

**Niet**
- Hardcoded hex/rgb in componenten
- Eigen icon-set introduceren
- Emoji-overload (max 1 per view, bij voorkeur geen)
- Tekst op afbeeldingen zonder overlay-contrast
- Meer dan 2 font-families
- Lange paragrafen in UI — splits in kleine stukken
