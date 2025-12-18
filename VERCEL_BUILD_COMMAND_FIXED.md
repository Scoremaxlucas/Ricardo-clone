# ✅ Korrigierter Build Command für Vercel

## 🎯 Problem
Der `sed` Befehl funktioniert nicht auf Vercel. Wir verwenden stattdessen ein Node.js Script.

## ✅ Lösung: Build Command mit Node.js Script

### Schritt-für-Schritt:

1. **Gehen Sie zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/general

2. **Scrollen Sie zu "Build & Development Settings"**

3. **Ändern Sie "Build Command" zu:**
   ```
   node fix-watches-route.js && npx prisma generate && next build
   ```

4. **Klicken Sie auf "Save"**

5. **Gehen Sie zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/deployments

6. **Klicken Sie auf "Redeploy"**

## 🔍 Was macht dieser Befehl?

1. `node fix-watches-route.js` - Führt das Node.js Script aus, das die doppelte `now` Definition entfernt
2. `npx prisma generate` - Generiert Prisma Client
3. `next build` - Baut das Projekt

## ✅ Das Script wurde erstellt!

Die Datei `fix-watches-route.js` wurde im Projekt erstellt und wird automatisch die doppelte `now` Definition entfernen.














