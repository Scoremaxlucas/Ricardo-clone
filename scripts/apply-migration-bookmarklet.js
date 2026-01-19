// Bookmarklet zum Anwenden der Notification Preferences Migration
// 
// Anleitung:
// 1. Kopiere den gesamten Code unten
// 2. Erstelle ein neues Bookmark in deinem Browser
// 3. Füge den Code als URL ein (beginnt mit javascript:)
// 4. Gehe zu helvenda.ch, logge dich als Admin ein
// 5. Klicke auf das Bookmark

javascript:(function(){
  if(!confirm('Möchtest du die Notification Preferences Migration anwenden?')) return;
  
  fetch('/api/admin/apply-migration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
    .then(r => r.json())
    .then(data => {
      if(data.success) {
        alert('✅ Migration erfolgreich!\n\n' + data.results.join('\n'));
        console.log('Migration Ergebnis:', data);
      } else {
        alert('❌ Fehler: ' + (data.error || data.message));
        console.error('Migration Fehler:', data);
      }
    })
    .catch(err => {
      alert('❌ Fehler beim Anwenden der Migration:\n' + err.message);
      console.error('Fehler:', err);
    });
})();
