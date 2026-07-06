# CodeMentor

CodeMentor est une application web d'analyse de code assistée par IA, réalisée dans le cadre du
Travail Pratique Individuel (TPI 2026) de Thibaud Gamez.

> **Provenance.** Ce projet a été développé de février à juin 2026 sur le GitLab de l'École des
> Métiers de Fribourg (`gitlab.emf-infopro.ch`), dépôt privé utilisé pendant le TPI. Ce dépôt GitHub
> en est le miroir public, publié après la fin du travail : l'historique des commits est celui du
> développement d'origine.

Après connexion via GitHub, l'utilisateur ajoute un projet lié à un dépôt GitHub et lance une
analyse. L'application parcourt le code, génère une explication de chaque fichier, détecte des
erreurs potentielles avec une correction suggérée, et produit un diagramme Mermaid de la structure
du projet.

> La documentation complète du projet (analyse, conception, tests, etc.) se trouve dans le **rapport
> de TPI** (`doc/GAMEZ_rapport_TPI.docx`). Ce README constitue la **documentation d'utilisation** du
> projet : il explique comment installer, configurer et utiliser les deux applications (l'interface
> web et l'API backend).

## Architecture

```
tpi2026-codementor/
├── server/            Backend Node.js / Express (API REST, OAuth GitHub, file d'analyse, OpenRouter)
├── client/            Frontend Vue 3 + Vite + Pinia + Tailwind
├── mysql/script.sql   Schéma de la base de données MySQL
└── docker-compose.yml MySQL + phpMyAdmin pour le développement local
```

## Prérequis

- [Node.js](https://nodejs.org/) 20 ou plus récent
- [Docker](https://www.docker.com/) (pour la base de données)
- Un compte GitHub et un compte [OpenRouter](https://openrouter.ai/)

## Installation

### 1. Base de données (Docker)

Depuis la racine du projet, lancer la base et phpMyAdmin :

```bash
docker compose up -d
```

Cela démarre un conteneur **MySQL** (port 3306) et **phpMyAdmin** (http://localhost:8080).
Le schéma `mysql/script.sql` est exécuté automatiquement au premier démarrage : toutes les tables
sont créées sans action supplémentaire.

> Le volume de données pointe vers `C:/docker-data/codementor-mysql` dans `docker-compose.yml`.
> Sous Windows, créer ce dossier avant le premier lancement (`mkdir C:\docker-data\codementor-mysql`).
> Sur une autre plateforme ou pour un environnement portable, remplacer ce chemin par un volume
> Docker nommé (`mysql-data:/var/lib/mysql`, déclaré dans une section `volumes:` du fichier).

### 2. Backend

```bash
cd server
copy .env.example .env      # Windows  (Linux/macOS : cp .env.example .env)
# remplir les valeurs du .env (voir le tableau ci-dessous)
npm install
npm start
```

L'API est alors disponible sur http://localhost:3000/codementor/api et la documentation
interactive Swagger sur **http://localhost:3000/codementor/api-docs**.

### 3. Frontend

```bash
cd client
copy .env.example .env      # Windows  (Linux/macOS : cp .env.example .env)
npm install
npm run dev
```

Le fichier `client/.env` définit `VITE_API_URL`, l'URL de base de l'API backend (valeur par défaut
`http://localhost:3000/codementor/api`, qui convient pour l'installation locale). Si la variable
n'est pas renseignée, l'application retombe automatiquement sur cette même valeur.

L'interface est servie sur **http://localhost:5173**.

> **Démarrage complet.** Les trois services doivent tourner en même temps : 1) la base de données
> (`docker compose up -d`), 2) le backend (`npm start` dans `server/`), 3) le frontend
> (`npm run dev` dans `client/`). L'OAuth App GitHub (voir ci-dessous) doit être créée avant la
> première connexion.

## Configuration du `.env` (backend)

Toutes les variables sont à renseigner dans `server/.env` (copié depuis `server/.env.example`).

| Variable | Rôle | Comment l'obtenir |
|---|---|---|
| `PORT` | Port d'écoute du backend | `3000` (valeur par défaut) |
| `FRONTEND_URL` | URL du frontend (origine CORS autorisée et redirection après login) | `http://localhost:5173` |
| `DB_HOST` / `DB_PORT` | Hôte et port MySQL | `localhost` / `3306` (cf. `docker-compose.yml`) |
| `DB_USER` / `DB_PASSWORD` | Compte applicatif MySQL | `emf` / `emf123` (définis dans `docker-compose.yml`) |
| `DB_NAME` | Nom de la base | `codementor` |
| `SESSION_SECRET` | Clé de signature du cookie de session | Chaîne aléatoire : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `TOKEN_ENC_KEY` | Clé de chiffrement AES-256-GCM du token GitHub (64 caractères hexadécimaux) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GITHUB_CLIENT_ID` | Identifiant de l'OAuth App GitHub | Voir « Créer l'OAuth App GitHub » ci-dessous |
| `GITHUB_CLIENT_SECRET` | Secret de l'OAuth App GitHub | Idem |
| `GITHUB_CALLBACK_URL` | URL de callback OAuth | `http://localhost:3000/codementor/api/auth/callback` |
| `OPENROUTER_API_KEY` | Clé de l'API OpenRouter (appels LLM) | https://openrouter.ai/keys |
| `OPENROUTER_MODEL` | Modèle LLM utilisé | `google/gemini-3.5-flash` (modèle retenu ; défaut du code si la variable est vide : `anthropic/claude-3.5-sonnet`) |
| `AI_THINKING` | Mode de raisonnement du LLM | `true` = raisonnement libre ; vide/`false` = effort minimal (moins cher) |
| `ANALYSIS_CONCURRENCY` | Nombre d'analyses traitées en parallèle par la file | Défaut `1` |
| `FILE_CONCURRENCY` | Nombre de fichiers analysés en parallèle par analyse | Défaut `5` |

### Créer l'OAuth App GitHub

1. Aller sur https://github.com/settings/developers → **New OAuth App**.
2. **Homepage URL** : `http://localhost:5173`
3. **Authorization callback URL** : `http://localhost:3000/codementor/api/auth/callback`
   (doit correspondre exactement à `GITHUB_CALLBACK_URL`).
4. Reporter le **Client ID** et le **Client secret** générés dans `GITHUB_CLIENT_ID` et
   `GITHUB_CLIENT_SECRET`.

## URLs utiles

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API backend | http://localhost:3000/codementor/api |
| Documentation Swagger | http://localhost:3000/codementor/api-docs |
| phpMyAdmin | http://localhost:8080 |

## Utilisation

CodeMentor se compose de deux applications, l'interface web (frontend) utilisée par la personne et
l'API REST (backend) consommée par cette interface. Les écrans correspondants sont illustrés dans le
rapport de TPI (chapitre « Maquette Web » et « Réalisation »).

### Application web (interface utilisateur)

Une fois le backend et le frontend démarrés, ouvrir http://localhost:5173.

1. **Se connecter.** Sur la page d'accueil, cliquer sur « Continuer avec GitHub », puis autoriser
   l'application sur GitHub. Après autorisation, la redirection vers la liste des projets est
   automatique. Aucun mot de passe n'est demandé ni stocké, l'identification passe entièrement par
   GitHub.
2. **Ajouter un projet.** Cliquer sur « Nouveau projet », coller l'URL d'un dépôt GitHub auquel le
   compte a accès, au format `https://github.com/utilisateur/depot`, puis valider avec « Ajouter le
   projet ». Le dépôt doit exister et être accessible, sinon un message d'erreur précise la cause
   (dépôt introuvable, accès refusé ou projet déjà ajouté).
3. **Parcourir ses projets.** La page « Mes projets » affiche chaque dépôt sous forme de carte (nom
   du dépôt, nombre d'analyses et date d'ajout). La barre de recherche en haut filtre les projets par
   nom. Cliquer sur une carte ouvre la page de détail du projet, qui affiche ses métadonnées GitHub
   (langage, visibilité, date) et l'historique de ses analyses.
4. **Lancer une analyse.** Ouvrir un projet en cliquant sur sa carte, puis cliquer sur « Lancer une
   analyse ». Le traitement démarre en arrière-plan, l'interface n'est pas bloquée.
5. **Suivre la progression.** Un écran d'avancement affiche une barre de progression mise à jour
   automatiquement (toutes les deux secondes) jusqu'à 100 %.
6. **Consulter les résultats.** À la fin de l'analyse, la page présente, de haut en bas, le diagramme
   Mermaid de la structure du projet, une vue d'ensemble du dépôt, puis la liste des erreurs
   détectées. Chaque erreur est dépliable et indique sa sévérité (Élevée, Moyenne ou Faible), un
   extrait du code concerné et la correction suggérée par l'IA.
7. **Relancer une analyse.** Le bouton « Relancer » en haut de la page de résultats lance une
   nouvelle analyse du même dépôt, par exemple après une mise à jour du code.
8. **Supprimer un projet.** Depuis la page d'un projet, la suppression retire le projet et tout son
   historique d'analyses. Elle est refusée tant qu'une analyse est en cours sur ce projet.
9. **Se déconnecter.** Le menu latéral propose « Déconnexion », qui ferme la session et ramène à la
   page de connexion.

### API backend (via Swagger)

La seconde application est l'API REST. Elle se découvre et se teste via sa documentation interactive
Swagger, sur http://localhost:3000/codementor/api-docs.

- Les routes du groupe `auth` (connexion) sont publiques. **Toutes les autres routes exigent une
  session active** et renvoient un code `401` sinon. Pour ouvrir une session, **se connecter d'abord
  depuis l'interface web** (http://localhost:5173) dans le même navigateur : le cookie de session est
  ensuite réutilisé automatiquement par Swagger. `GET /auth/login` est une redirection vers GitHub à
  ouvrir dans le navigateur, pas un appel testable tel quel depuis « Try it out ».
- Principaux endpoints, regroupés par ressource :
  - **Authentification :** `GET /auth/login`, `GET /auth/callback`, `POST /auth/logout`,
    `GET /auth/me`.
  - **Projets :** `GET /projects`, `POST /projects`, `GET /projects/:id`, `DELETE /projects/:id`.
  - **Analyses :** `POST /projects/:id/analyses` (lancer), `GET /analyses/:id` (résultat complet),
    `GET /analyses/:id/status` (progression).
- Chaque endpoint est documenté dans Swagger avec ses paramètres, ses codes de réponse et un exemple.
  Le bouton « Try it out » permet de l'exécuter directement depuis le navigateur.

> Les adresses ci-dessus correspondent à l'installation locale par défaut. Tous les endpoints sont
> relatifs à la base `/codementor/api` (par exemple `GET /projects` correspond à
> `http://localhost:3000/codementor/api/projects`).
