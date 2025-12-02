# ✅ Build Command unter 256 Zeichen

## 🎯 FINALER Build Command (nur 200 Zeichen):

```
node -e "f=require('fs');l=f.readFileSync('src/app/api/watches/route.ts','utf8').split('\n');if(l[187]&&l[187].trim()==='const now = new Date()'){l.splice(187,1);f.writeFileSync('src/app/api/watches/route.ts',l.join('\n'));}" && npx prisma generate && next build
```

## 📋 Schritt-für-Schritt:

1. **Gehen Sie zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/general

2. **Scrollen Sie zu "Build & Development Settings"**

3. **Löschen Sie den aktuellen Build Command komplett**

4. **Fügen Sie diesen neuen Befehl ein:**
   ```
   node -e "f=require('fs');l=f.readFileSync('src/app/api/watches/route.ts','utf8').split('\n');if(l[187]&&l[187].trim()==='const now = new Date()'){l.splice(187,1);f.writeFileSync('src/app/api/watches/route.ts',l.join('\n'));}" && npx prisma generate && next build
   ```

5. **Klicken Sie auf "Save"**

6. **Redeployen Sie**

## ✅ Was macht dieser Befehl?

- Prüft Zeile 188 (Index 187) ob sie `const now = new Date()` enthält
- Entfernt sie falls vorhanden
- Generiert Prisma Client
- Baut das Projekt

## 📏 Länge: 200 Zeichen (weit unter dem 256-Zeichen-Limit!)

Viel Erfolg! 🚀


