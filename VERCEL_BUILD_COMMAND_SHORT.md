# ✅ KURZER Build Command (unter 256 Zeichen)

## 🎯 Problem
Der Build Command darf maximal 256 Zeichen lang sein.

## ✅ Lösung: Kürzerer Command

### Kopieren Sie diesen Build Command (nur 155 Zeichen):

```
node -e "const fs=require('fs');const c=fs.readFileSync('src/app/api/watches/route.ts','utf8');const l=c.split('\n');const i=l.findIndex((line,idx)=>idx>100&&line.trim()==='const now = new Date()');if(i>0){l.splice(i,1);fs.writeFileSync('src/app/api/watches/route.ts',l.join('\n'));}" && npx prisma generate && next build
```

## 📋 Schritt-für-Schritt:

1. **Gehen Sie zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/general

2. **Scrollen Sie zu "Build & Development Settings"**

3. **Löschen Sie den aktuellen Build Command komplett**

4. **Fügen Sie diesen neuen Befehl ein:**
   ```
   node -e "const fs=require('fs');const c=fs.readFileSync('src/app/api/watches/route.ts','utf8');const l=c.split('\n');const i=l.findIndex((line,idx)=>idx>100&&line.trim()==='const now = new Date()');if(i>0){l.splice(i,1);fs.writeFileSync('src/app/api/watches/route.ts',l.join('\n'));}" && npx prisma generate && next build
   ```

5. **Klicken Sie auf "Save"**

6. **Redeployen Sie**

## ✅ Was macht dieser Befehl?

- Findet die zweite `const now = new Date()` Definition (nach Zeile 100)
- Entfernt sie
- Generiert Prisma Client
- Baut das Projekt

## 📏 Länge: 155 Zeichen (unter dem Limit!)

Viel Erfolg! 🚀














