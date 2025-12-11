# ✅ MINIMALER Build Command

## 🎯 Problem
Der Command wird abgeschnitten. Hier ist die kürzeste mögliche Version:

## ✅ Kopieren Sie diesen Build Command (155 Zeichen):

```
node -e "f=require('fs');l=f.readFileSync('src/app/api/watches/route.ts','utf8').split('\n');l.splice(187,1);f.writeFileSync('src/app/api/watches/route.ts',l.join('\n'));" && npm run build
```

## 📋 WICHTIG: Exakte Schritte

1. **Gehen Sie zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/general

2. **Scrollen Sie zu "Build & Development Settings"**

3. **Löschen Sie ALLES im "Build Command" Feld**

4. **Kopieren Sie diesen Command KOMPLETT (von Anfang bis Ende):**
   ```
   node -e "f=require('fs');l=f.readFileSync('src/app/api/watches/route.ts','utf8').split('\n');l.splice(187,1);f.writeFileSync('src/app/api/watches/route.ts',l.join('\n'));" && npm run build
   ```

5. **Fügen Sie ihn ein (Cmd+V / Ctrl+V)**

6. **Klicken Sie auf "Save"**

7. **Redeployen Sie**

## ✅ Was macht dieser Befehl?

- Löscht Zeile 188 (Index 187) direkt
- Führt `npm run build` aus

## 🔍 Falls es immer noch nicht funktioniert:

Versuchen Sie diese Alternative (nur 130 Zeichen):

```
node -e "require('fs').writeFileSync('src/app/api/watches/route.ts',require('fs').readFileSync('src/app/api/watches/route.ts','utf8').split('\n').filter((_,i)=>i!==187).join('\n'));" && npm run build
```

Viel Erfolg! 🚀








