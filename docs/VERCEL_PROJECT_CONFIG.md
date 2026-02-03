# Vercel Projekt-Konfiguration – Nur Helvenda deployen

## Problem

Wenn **ricardo-clone** und **helvenda** beide mit demselben Git-Repository verbunden sind, führt jeder Push zu **zwei parallelen Deployments**:

- Doppelte Build-Zeit
- Verzögerungen / „Initializing“-Stau
- Konkurrenz um Vercel-Ressourcen

## Lösung: Nur helvenda verwenden

**helvenda** ist das Produktions-Projekt (helvenda.ch). **ricardo-clone** wird nicht mehr für Deployments benötigt und sollte von Git getrennt werden.

---

## Schritt-für-Schritt: ricardo-clone von Git trennen

### 1. Vercel Dashboard öffnen

1. Gehe zu [vercel.com](https://vercel.com) und melde dich an
2. Wähle dein Team / deinen Account

### 2. ricardo-clone Projekt öffnen

1. Klicke auf **ricardo-clone**
2. Gehe zu **Settings** (⚙️)

### 3. Git-Verbindung trennen

1. Scrolle zu **Git** → **Connected Git Repository**
2. Klicke auf **Disconnect** (oder **Unlink**)
3. Bestätige die Aktion

### 4. Überprüfen

- **ricardo-clone**: Keine automatischen Deployments mehr bei Push
- **helvenda**: Deployments laufen weiterhin bei jedem Push

---

## Alternative: ricardo-clone löschen

Falls du **ricardo-clone** gar nicht mehr brauchst:

1. Öffne **ricardo-clone** in Vercel
2. **Settings** → ganz unten: **Delete Project**
3. Projektnamen eingeben und löschen bestätigen

---

## Nach der Änderung

Bei jedem `git push` auf `main`:

- Es wird nur **helvenda** deployed
- Keine doppelten Builds
- Weniger „Initializing“- und Verzögerungsprobleme

---

## Checkliste (einmalig)

- [ ] ricardo-clone von Git getrennt **oder** ricardo-clone gelöscht
- [ ] Push auf `main` ausführen
- [ ] Im Vercel Dashboard prüfen: Nur **helvenda** zeigt neue Deployments
