const sqlite3 = require('sqlite3').verbose();

// Connexion a la base de donnees SQLite
const db = new sqlite3.Database(
  './maBaseDeDonnees.sqlite',
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error(err.message);
      return;
    }

    console.log('Connecte a la base de donnees SQLite.');

    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS personnes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nom TEXT NOT NULL,
          adresse TEXT
        )`,
        (createErr) => {
          if (createErr) {
            console.error(createErr.message);
          }
        }
      );

      db.all('PRAGMA table_info(personnes)', [], (pragmaErr, columns) => {
        if (pragmaErr) {
          console.error(pragmaErr.message);
          return;
        }

        const hasAdresse = columns.some((column) => column.name === 'adresse');

        const seedInitialData = () => {
          db.get('SELECT COUNT(*) AS count FROM personnes', [], (countErr, row) => {
            if (countErr) {
              console.error(countErr.message);
              return;
            }

            if (row.count > 0) {
              return;
            }

            const personnes = [
              { nom: 'Bob', adresse: 'Tunis' },
              { nom: 'Alice', adresse: 'Sfax' },
              { nom: 'Charlie', adresse: 'Sousse' }
            ];

            personnes.forEach(({ nom, adresse }) => {
              db.run('INSERT INTO personnes (nom, adresse) VALUES (?, ?)', [nom, adresse]);
            });
          });
        };

        if (!hasAdresse) {
          db.run('ALTER TABLE personnes ADD COLUMN adresse TEXT', (alterErr) => {
            if (alterErr) {
              console.error(alterErr.message);
              return;
            }
            seedInitialData();
          });
          return;
        }

        seedInitialData();
      });
    });
  }
);

module.exports = db;
