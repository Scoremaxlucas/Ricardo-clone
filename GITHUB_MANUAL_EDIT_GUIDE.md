# 📝 Schritt-für-Schritt: Datei auf GitHub bearbeiten

## ✅ Was muss geändert werden:

Die Datei `src/app/api/watches/route.ts` hat bereits die korrekte Version lokal. Sie müssen sicherstellen, dass die Version auf GitHub auch korrekt ist.

## 🔍 Prüfen Sie zuerst die GitHub-Version:

1. **Gehen Sie zu:** https://github.com/gregorgafner-dev/Ricardo-clone/blob/main/src/app/api/watches/route.ts

2. **Prüfen Sie Zeile 188:** Wenn dort `const now = new Date()` steht, muss diese Zeile entfernt werden.

## ✏️ So bearbeiten Sie die Datei auf GitHub:

### Schritt 1: Datei öffnen
1. Gehen Sie zu: https://github.com/gregorgafner-dev/Ricardo-clone
2. Navigieren Sie zu: `src/app/api/watches/route.ts`
3. Klicken Sie auf das **Stift-Symbol** (✏️) oben rechts neben "Raw" und "Blame"

### Schritt 2: Zeile finden und entfernen
1. Scrollen Sie zu **Zeile 188** (oder suchen Sie nach `const now = new Date()`)
2. Wenn Sie diese Zeile sehen:
   ```typescript
   const now = new Date()
   ```
   **UND** diese Zeile bereits bei Zeile 108 existiert, dann:
   - **Löschen Sie Zeile 188 komplett** (die Zeile mit `const now = new Date()`)
   - Lassen Sie nur die Zeile bei Zeile 108 stehen

### Schritt 3: Commit erstellen
1. Scrollen Sie nach **unten** auf der Seite
2. Im Feld **"Commit changes"** geben Sie ein:
   ```
   Fix: Remove duplicate 'now' variable definition
   ```
3. Stellen Sie sicher, dass **"Commit directly to the main branch"** ausgewählt ist
4. Klicken Sie auf **"Commit changes"** (grüner Button)

### Schritt 4: Warten auf Vercel Deployment
- Nach dem Commit wird Vercel automatisch ein neues Deployment starten
- Sie können den Fortschritt hier sehen: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/deployments

## ✅ Erwartetes Ergebnis:

Nach der Änderung sollte die Datei so aussehen:

**Zeile 108:**
```typescript
const now = new Date()
```

**Zeile 186-188:**
```typescript
    }

    const watches = await prisma.watch.findMany({
```

**WICHTIG:** Zwischen Zeile 186 und 188 sollte KEINE Zeile mit `const now = new Date()` mehr stehen!

## 🎯 Falls Sie Hilfe brauchen:

Falls die Datei auf GitHub bereits korrekt ist (keine doppelte `now` Definition), dann ist das Problem möglicherweise etwas anderes. In diesem Fall sollten Sie:
1. Die Vercel Build-Logs nochmal prüfen
2. Sicherstellen, dass alle anderen Änderungen auch auf GitHub sind

Viel Erfolg! 🚀




