# BladWijzer

Persoonlijke PWA-plantenapp voor binnen- en buitenplanten, met focus op **snoei-inzicht** per plant.

## Voor wie is dit?

Eén gebruiker (Jim). Alle data staat lokaal in je browser (IndexedDB). Geen account, geen cloud, gratis te gebruiken en te hosten.

## Lokaal draaien

```bash
pnpm install
pnpm dev
# open http://localhost:5173
```

## Productie-build

```bash
pnpm build
pnpm preview   # test de build lokaal
```

## Deploy (GitHub Pages)

1. Repo aanmaken op GitHub met de naam **BladWijzer**
2. Lokaal:
   ```bash
   git init
   git branch -M main
   git remote add origin https://github.com/<jouw-user>/BladWijzer.git
   git add .
   git commit -m "initial commit"
   git push -u origin main
   ```
3. In GitHub: **Settings → Pages → Source = GitHub Actions**
4. De workflow `.github/workflows/deploy.yml` bouwt en deployt bij elke push naar `main`
5. App komt beschikbaar op `https://<jouw-user>.github.io/BladWijzer/`
6. Open op je telefoon → "Installeer app" in browsermenu → icoon op homescreen

## Projectdocumentatie

- **`CLAUDE.md`** — volledige scope, architectuur en werkinstructies voor Claude Code
- **`DESIGN_SYSTEM.md`** — tokens, typografie, componentregels

## Ontwikkelcommando's

| Commando | Wat doet het |
|---|---|
| `pnpm dev` | Development server met hot reload |
| `pnpm build` | Productie-build naar `dist/` |
| `pnpm preview` | De productie-build lokaal serveren |
| `pnpm lint` | ESLint over de code |
