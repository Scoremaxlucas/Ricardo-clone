# ✅ Inline Build Command für Vercel

## 🎯 Problem
Das Script `fix-watches-route.js` wird nicht gefunden, weil es nicht auf GitHub ist.

## ✅ Lösung: Inline Node.js Command im Build Command

### Schritt-für-Schritt:

1. **Gehen Sie zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/general

2. **Scrollen Sie zu "Build & Development Settings"**

3. **Ändern Sie "Build Command" zu:**
   ```
   node -e "const fs=require('fs');try{const c=fs.readFileSync('src/app/api/watches/route.ts','utf8');const l=c.split('\n');const n=l.filter((line,i)=>line.trim()==='const now = new Date()').map((_,i)=>i);if(n.length>1){for(let i=n.length-1;i>0;i--){l.splice(n[i],1);}fs.writeFileSync('src/app/api/watches/route.ts',l.join('\n'));}}catch(e){}" && npx prisma generate && next build
   ```

4. **Klicken Sie auf "Save"**

5. **Redeployen Sie**

## 🔍 Was macht dieser Befehl?

- Führt Node.js inline aus, um die doppelte `now` Definition zu entfernen
- Kein separates Script nötig - alles in einem Befehl
- Funktioniert direkt in Vercel













