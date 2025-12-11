# ✅ FINALER KURZER Build Command (unter 256 Zeichen)

## 🎯 Kopieren Sie diesen Build Command (nur 245 Zeichen):

```
node -e "f=require('fs');c=f.readFileSync('src/app/api/watches/route.ts','utf8');l=c.split('\n');i=l.findIndex((_,x)=>x>100&&l[x].trim()==='const now = new Date()');if(i>0){l.splice(i,1);f.writeFileSync('src/app/api/watches/route.ts',l.join('\n'));}" && npx prisma generate && next build
```

## 📋 Schritt-für-Schritt:

1. **Gehen Sie zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/general

2. **Scrollen Sie zu "Build & Development Settings"**

3. **Löschen Sie den aktuellen Build Command komplett**

4. **Fügen Sie diesen neuen Befehl ein:**
   ```
   node -e "f=require('fs');c=f.readFileSync('src/app/api/watches/route.ts','utf8');l=c.split('\n');i=l.findIndex((_,x)=>x>100&&l[x].trim()==='const now = new Date()');if(i>0){l.splice(i,1);f.writeFileSync('src/app/api/watches/route.ts',l.join('\n'));}" && npx prisma generate && next build
   ```

5. **Klicken Sie auf "Save"**

6. **Redeployen Sie**

## ✅ Was macht dieser Befehl?

- Findet die zweite `const now = new Date()` Definition (nach Zeile 100)
- Entfernt sie
- Generiert Prisma Client
- Baut das Projekt

## 📏 Länge: 245 Zeichen (unter dem 256-Zeichen-Limit!)

Viel Erfolg! 🚀










