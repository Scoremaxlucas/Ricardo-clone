#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  GIT PUSH HELPER                                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")/.."

# Prüfe ob es ungepushte Commits gibt
AHEAD=$(git rev-list --count origin/main..main 2>/dev/null || echo "0")

if [ "$AHEAD" = "0" ]; then
    echo "✅ Keine ungepushten Commits gefunden."
    exit 0
fi

echo "📊 $AHEAD Commit(s) bereit zum Pushen"
echo ""

# Versuche Push
echo "🔄 Versuche Push..."
if git push origin main 2>&1; then
    echo ""
    echo "✅ Push erfolgreich!"
    echo "🚀 Vercel wird automatisch deployen..."
    exit 0
else
    echo ""
    echo "❌ Push fehlgeschlagen - Authentifizierung erforderlich"
    echo ""
    echo "📋 OPTIONEN:"
    echo ""
    echo "OPTION 1: Personal Access Token verwenden"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "1. GitHub → Settings → Developer settings → Personal access tokens"
    echo "2. 'Generate new token (classic)'"
    echo "3. Name: 'Helvenda Push'"
    echo "4. Berechtigung: 'repo' aktivieren"
    echo "5. Token kopieren"
    echo "6. Bei Passwort-Abfrage: Token einfügen"
    echo ""
    echo "OPTION 2: GitHub CLI verwenden"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "brew install gh"
    echo "gh auth login"
    echo "git push"
    echo ""
    echo "OPTION 3: SSH verwenden"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "1. SSH Key kopieren: cat ~/.ssh/id_ed25519.pub"
    echo "2. GitHub → Settings → SSH and GPG keys → New SSH key"
    echo "3. Dann: git remote set-url origin git@github.com:Scoremaxlucas/Ricardo-clone.git"
    echo "4. git push"
    echo ""
    exit 1
fi



