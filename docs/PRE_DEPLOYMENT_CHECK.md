# 🔍 Pre-Deployment-Check

## Übersicht

Das Pre-Deployment-Check-Script verhindert kritische Deployment-Fehler durch Schema-Mismatches zwischen Prisma Schema und Datenbank.

## Verwendung

```bash
npm run pre-deploy-check
```

## Was wird geprüft?

1. **DATABASE_URL Check** - Ist die Datenbank-URL gesetzt?
2. **Prisma Schema Check** - Existiert das Schema-File?
3. **Prisma Client Sync Check** - Wurde Prisma Client generiert?
4. **Kritische Tabellen Check** - Existieren alle wichtigen Tabellen?
5. **Kritische Spalten Check** - Existieren alle wichtigen Spalten?
6. **Migration Status Check** - Gibt es ausstehende Migrationen?
7. **Schema-DB Synchronisation Check** - Stimmt Schema mit DB überein?

## Wann ausführen?

**IMMER vor jedem Deployment:**
```bash
npm run pre-deploy-check
```

**Wenn der Check fehlschlägt:**
- ❌ **NICHT deployen!**
- Prüfe die Fehlermeldungen
- Führe die vorgeschlagenen Lösungen aus
- Führe den Check erneut aus

## Häufige Probleme

### Problem: "Spalte fehlt in Datenbank"

**Lösung:**
```bash
npx prisma migrate deploy
```

### Problem: "Ausstehende Migrationen"

**Lösung:**
```bash
npx prisma migrate deploy
```

### Problem: "Schema stimmt nicht mit DB überein"

**Lösung:**
1. Prüfe, welche Spalten fehlen
2. Führe Migration aus: `npx prisma migrate deploy`
3. ODER passe Schema temporär an (nur wenn Migration nicht möglich)

## Integration in CI/CD

Das Script gibt Exit-Code 1 bei Fehlern, kann also in CI/CD integriert werden:

```yaml
# Beispiel: GitHub Actions
- name: Pre-Deployment Check
  run: npm run pre-deploy-check
```

## Wichtig

- **NIE** Code deployen, wenn der Check fehlschlägt
- **IMMER** Migrationen ausführen, bevor Code deployed wird
- **NIE** Schema ändern ohne entsprechende Migration
