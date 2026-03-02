const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const db = require('./database');

const app = express();
app.use(express.json());
app.use(cors());

const normalizeIp = (ip) => {
  if (!ip) {
    return 'unknown';
  }

  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }

  return ip;
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => normalizeIp(req.ip || req.socket.remoteAddress),
  message: {
    message: 'Trop de requetes effectuees depuis cette IP, veuillez reessayer apres 15 minutes.'
  }
});
app.use(limiter);

const PORT = Number(process.env.PORT) || 3000;
const memoryStore = new session.MemoryStore();

app.use(
  session({
    secret: 'api-secret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
  })
);

const parseBoolean = (value, defaultValue) => {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
};

const hasEnvKeycloakConfig = Boolean(
  process.env.KEYCLOAK_REALM &&
    process.env.KEYCLOAK_AUTH_SERVER_URL &&
    process.env.KEYCLOAK_RESOURCE &&
    process.env.KEYCLOAK_CLIENT_SECRET
);

const keycloakConfig = hasEnvKeycloakConfig
  ? {
      realm: process.env.KEYCLOAK_REALM,
      'auth-server-url': process.env.KEYCLOAK_AUTH_SERVER_URL,
      'ssl-required': process.env.KEYCLOAK_SSL_REQUIRED || 'external',
      resource: process.env.KEYCLOAK_RESOURCE,
      'bearer-only': parseBoolean(process.env.KEYCLOAK_BEARER_ONLY, true),
      credentials: {
        secret: process.env.KEYCLOAK_CLIENT_SECRET
      },
      'confidential-port': Number(process.env.KEYCLOAK_CONFIDENTIAL_PORT || 0)
    }
  : './keycloak-config.json';

const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);
app.use(keycloak.middleware());

app.get('/', (req, res) => {
  res.json('Registre de personnes! Choisissez le bon routage!');
});

app.get('/secure', keycloak.protect(), (req, res) => {
  res.json({ message: 'Vous etes authentifie !' });
});

// Recuperer toutes les personnes
app.get('/personnes', keycloak.protect(), (req, res) => {
  db.all('SELECT * FROM personnes', [], (err, rows) => {
    if (err) {
      res.status(400).json({
        error: err.message
      });
      return;
    }

    res.json({
      message: 'success',
      data: rows
    });
  });
});

// Recuperer une personne par ID
app.get('/personnes/:id', keycloak.protect(), (req, res) => {
  const id = req.params.id;

  db.get('SELECT * FROM personnes WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(400).json({
        error: err.message
      });
      return;
    }

    res.json({
      message: 'success',
      data: row
    });
  });
});

// Creer une nouvelle personne
app.post('/personnes', keycloak.protect(), (req, res) => {
  const { nom, adresse } = req.body;

  db.run('INSERT INTO personnes (nom, adresse) VALUES (?, ?)', [nom, adresse], function (err) {
    if (err) {
      res.status(400).json({
        error: err.message
      });
      return;
    }

    res.json({
      message: 'success',
      data: {
        id: this.lastID
      }
    });
  });
});

// Mettre a jour une personne
app.put('/personnes/:id', keycloak.protect(), (req, res) => {
  const id = req.params.id;
  const { nom, adresse } = req.body;

  db.run('UPDATE personnes SET nom = ?, adresse = ? WHERE id = ?', [nom, adresse, id], function (err) {
    if (err) {
      res.status(400).json({
        error: err.message
      });
      return;
    }

    res.json({
      message: 'success'
    });
  });
});

// Supprimer une personne
app.delete('/personnes/:id', keycloak.protect(), (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM personnes WHERE id = ?', id, function (err) {
    if (err) {
      res.status(400).json({
        error: err.message
      });
      return;
    }

    res.json({
      message: 'success'
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
