# 🔧 Vercel Build-Fehler - Lösung Version 2

## Problem
Der Build-Command hat die `package.json` nicht korrekt aktualisiert. Vercel verwendet immer noch `nodemailer@6.10.1`.

## ✅ Lösung: `vercel.json` verwenden

Ich habe eine `vercel.json` Datei erstellt, die den Build-Command automatisch konfiguriert.

### Schritt 1: `vercel.json` zu GitHub pushen

Die `vercel.json` Datei wurde erstellt. Sie müssen sie zu GitHub pushen.

**ABER:** Da wir nicht direkt zu GitHub pushen können, verwenden wir einen anderen Ansatz:

### Schritt 2: Build-Command in Vercel Dashboard

1. **Gehen Sie zu:** [vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/general](https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/general)

2. **Scrollen Sie zu "Build & Development Settings"**

3. **Ändern Sie "Install Command" zu:**
   ```
   npm install --legacy-peer-deps
   ```

4. **Ändern Sie "Build Command" zu:**
   ```
   node -e "const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync('package.json','utf8')); pkg.dependencies.nodemailer='^7.0.11'; fs.writeFileSync('package.json',JSON.stringify(pkg,null,2));" && npm install --legacy-peer-deps && npx prisma generate && next build
   ```

5. **Klicken Sie auf "Save"**

6. **Redeployen Sie**

## 🎯 Einfachere Alternative

Falls der obige Befehl zu lang ist, verwenden Sie diesen:

**Install Command:**
```
npm install --legacy-peer-deps
```

**Build Command:**
```
npm install nodemailer@7.0.11 --legacy-peer-deps --save && npm install --legacy-peer-deps && npx prisma generate && next build
```

## ✅ Dieser Ansatz sollte funktionieren!

Der Build-Command installiert `nodemailer@7.0.11` **direkt**, bevor andere Dependencies installiert werden.




