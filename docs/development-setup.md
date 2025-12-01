# Development Setup & Code Quality Tools

Dieses Projekt verwendet mehrere Tools zur Sicherstellung der Code-Qualität und konsistenten Formatierung.

## 📦 Installierte Tools

### Prettier

- **Zweck**: Automatische Code-Formatierung
- **Konfiguration**: `.prettierrc`
- **Plugin**: `prettier-plugin-tailwindcss` für Tailwind CSS Klassen-Sortierung

### ESLint

- **Zweck**: Code-Linting und Fehlererkennung
- **Konfiguration**: `.eslintrc.json`
- **Basiert auf**: Next.js Core Web Vitals & TypeScript Rules

### VS Code Workspace Settings

- **Zweck**: Konsistente Editor-Einstellungen für alle Entwickler
- **Dateien**: `.vscode/settings.json`, `.vscode/extensions.json`

## 🚀 Verwendung

### Code formatieren

```bash
# Alle Dateien formatieren
npm run format

# Prüfen ob Dateien formatiert sind (ohne Änderungen)
npm run format:check
```

### Code linten

```bash
# Linting durchführen
npm run lint

# Linting mit automatischen Fixes
npm run lint:fix
```

## ⚙️ VS Code Integration

### Empfohlene Extensions

Das Projekt empfiehlt automatisch die folgenden Extensions:

- **Prettier** - Code Formatierung
- **ESLint** - Code Linting
- **Tailwind CSS IntelliSense** - Tailwind Autocomplete
- **TypeScript** - TypeScript Support
- **Prisma** - Prisma Schema Support
- **Error Lens** - Inline Fehleranzeige

### Automatische Formatierung

Die Workspace-Einstellungen aktivieren automatisch:

- ✅ Formatierung beim Speichern
- ✅ ESLint Fixes beim Speichern
- ✅ Automatische Import-Organisation
- ✅ Tailwind CSS Klassen-Sortierung

## 📝 Prettier Konfiguration

Die Prettier-Konfiguration verwendet:

- **Single Quotes** für Strings
- **Keine Semikolons** (JavaScript/TypeScript Standard)
- **2 Spaces** für Einrückung
- **100 Zeichen** maximale Zeilenlänge
- **Trailing Commas** für bessere Git-Diffs
- **Tailwind Plugin** für automatische CSS-Klassen-Sortierung

## 🔍 ESLint Regeln

Die wichtigsten ESLint-Regeln:

- ⚠️ Warnung bei ungenutzten Variablen (mit `_` Prefix ignorieren)
- ⚠️ Warnung bei `any` Types
- ✅ React Hooks Exhaustive Dependencies Check
- ⚠️ Warnung bei `console.log` (erlaubt: `console.warn`, `console.error`)

## 🎯 Best Practices

1. **Vor jedem Commit**:

   ```bash
   npm run format
   npm run lint:fix
   ```

2. **In VS Code**:
   - Dateien werden automatisch beim Speichern formatiert
   - ESLint zeigt Fehler inline an

3. **CI/CD**:
   - `npm run format:check` sollte in CI-Pipeline integriert werden
   - `npm run lint` sollte ohne Fehler durchlaufen

## 🔧 Troubleshooting

### Prettier formatiert nicht richtig

- Stelle sicher, dass die Prettier Extension installiert ist
- Prüfe ob `.prettierrc` im Root-Verzeichnis existiert
- Starte VS Code neu

### ESLint zeigt falsche Fehler

- Führe `npm run lint:fix` aus
- Stelle sicher, dass TypeScript korrekt installiert ist: `npm install`
- Prüfe ob `.eslintrc.json` existiert

### VS Code verwendet falsche TypeScript Version

- Die Workspace-Einstellungen sollten automatisch die Workspace-Version verwenden
- Falls nicht: `Cmd+Shift+P` → "TypeScript: Select TypeScript Version" → "Use Workspace Version"
