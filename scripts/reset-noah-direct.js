const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcryptjs')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db')
const db = new sqlite3.Database(dbPath)

async function resetNoahPassword() {
  try {
    // Finde Noah
    db.get(
      'SELECT id, email, name, nickname, isBlocked FROM users WHERE email = ?',
      ['noah@test.com'],
      async (err, row) => {
        if (err) {
          console.error('❌ Fehler beim Suchen:', err)
          db.close()
          return
        }

        if (!row) {
          console.log('❌ Noah nicht gefunden!')
          db.close()
          return
        }

        console.log('✅ Noah gefunden:')
        console.log(`   Email: ${row.email}`)
        console.log(`   Name: ${row.name}`)
        console.log(`   Nickname: ${row.nickname}`)
        console.log(`   Blockiert: ${row.isBlocked}`)

        // Hash neues Passwort
        const newPassword = 'noah123'
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        // Update User
        db.run(
          'UPDATE users SET password = ?, isBlocked = 0, blockedAt = NULL, blockedReason = NULL WHERE email = ?',
          [hashedPassword, 'noah@test.com'],
          function (updateErr) {
            if (updateErr) {
              console.error('❌ Fehler beim Update:', updateErr)
            } else {
              console.log('\n✅ Noah Passwort zurückgesetzt!')
              console.log('✅ Account entsperrt')
              console.log('\n📧 Login-Daten:')
              console.log(`   Email: ${row.email}`)
              console.log(`   Passwort: ${newPassword}`)
              console.log('\n✅ Login sollte jetzt funktionieren!')
            }
            db.close()
          }
        )
      }
    )
  } catch (error) {
    console.error('❌ Fehler:', error)
    db.close()
  }
}

resetNoahPassword()
