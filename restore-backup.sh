#!/bin/bash

# Backup-Wiederherstellungs-Script
# Setzt das Projekt auf den Stand des letzten Backups zurück

cd "$(dirname "$0")"

# Backup-Commit-Hash (vom letzten Backup)
BACKUP_COMMIT="e67339b"

echo "🔄 Wiederherstellung zum Backup-Stand"
echo "======================================"
echo ""
echo "⚠️  WICHTIG: Alle nicht gespeicherten Änderungen gehen verloren!"
echo ""
read -p "Möchten Sie wirklich zum Backup zurückkehren? (j/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[JjYy]$ ]]; then
    echo "❌ Abgebrochen"
    exit 1
fi

echo ""
echo "📋 Aktueller Status:"
git status --short | head -5
echo ""

echo "🔄 Setze zurück zum Backup-Commit: $BACKUP_COMMIT"
git reset --hard $BACKUP_COMMIT

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Erfolgreich zum Backup zurückgesetzt!"
    echo ""
    echo "📦 Aktueller Commit:"
    git log --oneline -1
    echo ""
    echo "💡 Tipp: Falls Sie die Änderungen doch behalten möchten, können Sie sie mit 'git reflog' wiederfinden"
else
    echo ""
    echo "❌ Fehler beim Zurücksetzen"
    exit 1
fi

