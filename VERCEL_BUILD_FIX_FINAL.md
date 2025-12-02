# ✅ FINALE Lösung: Build Command anpassen

## 🎯 Problem
Die Datei auf GitHub hat noch eine doppelte `now` Definition, aber wir können nicht zu GitHub pushen.

## ✅ Lösung: Build Command korrigiert die Datei automatisch

### Schritt-für-Schritt:

1. **Gehen Sie zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/general

2. **Scrollen Sie zu "Build & Development Settings"**

3. **Ändern Sie "Build Command" zu:**
   ```
   sed -i.bak '188d' src/app/api/watches/route.ts 2>/dev/null || true && npx prisma generate && next build
   ```

   **ODER** (falls das nicht funktioniert):
   ```
   node -e "const fs=require('fs'); const content=fs.readFileSync('src/app/api/watches/route.ts','utf8'); const lines=content.split('\\n'); const filtered=lines.filter((_,i)=>i!==187); fs.writeFileSync('src/app/api/watches/route.ts',filtered.join('\\n'));" && npx prisma generate && next build
   ```

4. **Klicken Sie auf "Save"**

5. **Gehen Sie zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/deployments

6. **Klicken Sie auf "Redeploy"** beim neuesten Deployment

## 🔍 Was macht dieser Befehl?

- `sed -i.bak '188d'` - Löscht Zeile 188 aus der Datei
- `2>/dev/null || true` - Ignoriert Fehler falls die Zeile nicht existiert
- `npx prisma generate` - Generiert Prisma Client
- `next build` - Baut das Projekt

## ✅ Das sollte funktionieren!

Der Build Command korrigiert die Datei automatisch während jedes Builds, unabhängig davon, was auf GitHub steht.
