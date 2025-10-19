# Fokus

Et React + TypeScript projekt oprettet med Vite.

## Kørsel

1. Installer afhængigheder:
   ```bash
   npm install
   ```
2. Start udviklingsserveren:
   ```bash
   npm run dev
   ```

### Lokal udvikling med Vercel storage

Vercel KV og Blob kører via serverless routes i `/api`. For at teste lokalt skal du køre
Vercel CLI samtidig med Vite:

1. Start Vercel dev-serveren (kræver installeret Vercel CLI):
   ```bash
   vercel dev --listen 3000
   ```
2. Start Vite og peg API-kaldene mod Vercel-dev instansen:
   ```bash
   VITE_API_BASE_URL=http://localhost:3000 npm run dev
   ```

Sørg for at konfigurere følgende miljøvariabler på Vercel (og lokalt, hvis du bruger `vercel dev`):

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `BLOB_READ_WRITE_TOKEN`

## Scripts

- `npm run dev` – starter Vite udviklingsserveren.
- `npm run build` – typechecker projektet og bygger en produktionklar version i `dist/`.
- `npm run preview` – server den byggede app lokalt.
- `npm run test` – placeholder der markerer, at tests endnu ikke er sat op.

## Spil

- **Reaktionstest** – klik så hurtigt som muligt, når skærmen skifter farve, og jagt dine hurtigste reaktionstider.
- **Memory** – vend to kort ad gangen og find alle par. Du kan vælge mellem tre sværhedsgrader: Let (4 × 4, 8 par), Mellem (5 × 4, 10 par) og Svær (6 × 4, 12 par). Spillet holder nu styr på dine bedste tider og færreste træk pr. niveau via Vercel KV og lagrer en JSON-log i Vercel Blob for persistens.
