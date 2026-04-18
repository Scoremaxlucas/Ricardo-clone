# DNS-Anleitung automatisch öffnen (`wohnen.helvenda.ch`)

Beim **ersten** Öffnen dieses Ordners in Cursor/VS Code kann eine Meldung erscheinen, ob **automatische Tasks** erlaubt sind. Bitte **Zulassen** („Allow Automatic Tasks in Folder“), damit die Anleitung zu **`wohnen.helvenda.ch`** geöffnet wird.

## Manuell

- **Befehlspalette** (`Cmd+Shift+P`) → **Tasks: Run Task** → **Helvenda: DNS-Anleitung wohnen.helvenda.ch öffnen**
- Oder: `npm run docs:open-dns-wohnen`

## Automatik abschalten

`Cmd+Shift+P` → **Tasks: Manage Automatic Tasks in Folder** → **Disallow**

## Inhalt

**[docs/dns-wohnen-helvenda-ch.md](docs/dns-wohnen-helvenda-ch.md)** (inkl. Vercel-Screenshots unter `docs/images/`).

Technik: [.vscode/tasks.json](.vscode/tasks.json) (`runOn: folderOpen`).
