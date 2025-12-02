# ✅ Build Command (221 Zeichen - sollte funktionieren!)

## 🎯 Kopieren Sie diesen Build Command:

```
node -e "f=require('fs');l=f.readFileSync('src/app/api/watches/route.ts','utf8').split('\n');l.splice(187,1);f.writeFileSync('src/app/api/watches/route.ts',l.join('\n'));" && npx prisma generate && next build
```

## 📋 Schritt-für-Schritt:

1. **Gehen Sie zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/general

2. **Scrollen Sie zu "Build & Development Settings"**

3. **Löschen Sie den aktuellen Build Command komplett**

4. **Fügen Sie diesen neuen Befehl ein:**
   ```
   node -e "f=require('fs');l=f.readFileSync('src/app/api/watches/route.ts','utf8').split('\n');l.splice(187,1);f.writeFileSync('src/app/api/watches/route.ts',l.join('\n'));" && npx prisma generate && next build
   ```

5. **Klicken Sie auf "Save"**

6. **Redeployen Sie**

## ✅ Was macht dieser Befehl?

- Löscht Zeile 188 (Index 187) direkt
- Generiert Prisma Client
- Baut das Projekt

## 📏 Länge: 221 Zeichen

**Falls das immer noch zu lang ist**, verwenden Sie diese noch kürzere Version:

```
node -e "f=require('fs');l=f.readFileSync('src/app/api/watches/route.ts','utf8').split('\n');l.splice(187,1);f.writeFileSync('src/app/api/watches/route.ts',l.join('\n'));" && npm run build
```

**Länge: 201 Zeichen**

Viel Erfolg! 🚀
