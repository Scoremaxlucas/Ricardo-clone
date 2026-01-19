# Cleanup Status prüfen

## Prüfe ob Cleanup erfolgreich war:

Führe diesen Code in der Browser-Konsole aus (F12 → Console):

```javascript
// Prüfe Cleanup-Status
fetch('/api/admin/users/cleanup-test-users')
  .then(r => r.json())
  .then(data => {
    console.log('📊 Aktuelle Statistiken:', data);
    console.log('Admin-User:', data.stats.adminUsers);
    console.log('Nicht-Admin-User:', data.stats.nonAdminUsers);
    
    if (data.stats.nonAdminUsers > 0) {
      console.warn('⚠️ Es gibt noch Nicht-Admin-User!');
      console.log('Möchtest du den Cleanup nochmal durchführen?');
    } else {
      console.log('✅ Keine Nicht-Admin-User mehr vorhanden!');
    }
  });
```

## Prüfe ob bestimmte User Admin-User sind:

```javascript
// Prüfe ob ein User Admin ist (ersetze EMAIL mit der E-Mail)
fetch('/api/admin/users')
  .then(r => r.json())
  .then(users => {
    const user = users.find(u => u.email === 'EMAIL_HIER_EINFÜGEN');
    if (user) {
      console.log('User gefunden:', user);
      console.log('Ist Admin:', user.isAdmin);
    } else {
      console.log('User nicht gefunden');
    }
  });
```

## Wenn noch Nicht-Admin-User vorhanden sind:

Führe den Cleanup nochmal aus:

```javascript
fetch('/api/admin/users/cleanup-test-users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ confirm: true })
})
  .then(r => r.json())
  .then(result => {
    console.log('✅ Cleanup Ergebnis:', result);
    alert(`Cleanup abgeschlossen!\n${result.stats.deletedUsers} User gelöscht`);
    // Seite neu laden
    location.reload();
  });
```
