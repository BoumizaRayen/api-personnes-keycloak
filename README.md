# API Personnes - TP4 / TP4.5

API REST de gestion de personnes, construite avec Express + SQLite, securisee par Keycloak (OAuth2/OpenID Connect), avec CORS et rate limiting.

## 1. Fonctionnalites

- CRUD complet sur `personnes`
- base SQLite creee automatiquement au demarrage
- routes metier securisees via Bearer token
- CORS global active
- limitation de debit: `100` requetes / `15` minutes / IP

## 2. Stack technique

- Node.js
- Express
- SQLite3
- keycloak-connect
- express-session
- cors
- express-rate-limit

## 3. Arborescence

```text
api-realm/
|- index.js
|- database.js
|- keycloak-config.example.json
|- keycloak-config.json            # local uniquement (ignore)
|- .env.example
|- API Personnes.postman_collection.json
|- test-cors.html
|- package.json
|- .gitignore
|- LICENSE
|- README.md
```

## 4. Prerequis

- Node.js (18+ recommande)
- npm
- Keycloak local sur `http://localhost:8080`
- Postman

## 5. Installation

```bash
cd "C:\Users\LENOVO\Desktop\SOA\api-realm"
npm install
```

## 6. Configuration locale

Option A: fichier Keycloak local
```powershell
Copy-Item keycloak-config.example.json keycloak-config.json
```
Puis remplace `credentials.secret` dans `keycloak-config.json`.

Option B: variables d'environnement
- partir de `.env.example`
- ou definir les variables dans la session PowerShell

Variables supportees:
- `PORT`
- `KEYCLOAK_REALM`
- `KEYCLOAK_AUTH_SERVER_URL`
- `KEYCLOAK_SSL_REQUIRED`
- `KEYCLOAK_RESOURCE`
- `KEYCLOAK_CLIENT_SECRET`
- `KEYCLOAK_BEARER_ONLY`
- `KEYCLOAK_CONFIDENTIAL_PORT`

Note:
- si les variables Keycloak ne sont pas definies, l'API lit `keycloak-config.json`.

## 7. Lancement

Port par defaut:
```bash
npm start
```

Port personnalise (PowerShell):
```powershell
$env:PORT=3001
npm start
```

## 8. Endpoints

Route publique:
- `GET /`

Routes securisees:
- `GET /personnes`
- `GET /personnes/:id`
- `POST /personnes`
- `PUT /personnes/:id`
- `DELETE /personnes/:id`

Exemple body (`POST` / `PUT`):
```json
{
  "nom": "Amine",
  "adresse": "Tunis"
}
```

## 9. Token Keycloak (Postman)

Requete token:
- `POST http://localhost:8080/realms/api-realm/protocol/openid-connect/token`
- `Body: x-www-form-urlencoded`
  - `grant_type=password`
  - `client_id=api-personne`
  - `client_secret=<secret>`
  - `username=<username>`
  - `password=<password>`

Utilisation sur routes securisees:
- `Authorization: Bearer <access_token>`

## 10. Collection Postman incluse

Fichier inclus:
- `API Personnes.postman_collection.json`

Points importants:
- aucun token reel stocke dans le fichier
- variables de collection preconfigurees (`base_url`, `access_token`, etc.)
- la requete `Get Token` stocke automatiquement `access_token`

Ordre conseille:
1. `Get Token`
2. `GET personnes`
3. `POST cree personne`
4. `GET personnes by id`
5. `PUT update personne`
6. `DELETE personne`

## 11. CORS et Rate Limiting

Dans `index.js`:
- `app.use(cors())`
- limiter global:
  - fenetre `15 min`
  - `max = 100` requetes/IP
  - depassement: HTTP `429`

Message retourne:
```json
{
  "message": "Trop de requetes effectuees depuis cette IP, veuillez reessayer apres 15 minutes."
}
```

## 12. Depannage

- `Realm does not exist`: realm incorrect ou non cree
- `Missing form parameter: grant_type`: mauvais type de body token
- `invalid_grant`: mauvais username/password
- `Account is not fully set up`: actions obligatoires user non completees
- `401 Unauthorized`: token absent/expire/invalide
- `403 Access denied`: token non valide pour ce realm/client
- `429 Too Many Requests`: limite atteinte


