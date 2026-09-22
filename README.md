# ForgeMarket

ForgeMarket est une plateforme web de mise en relation entre clients, artisans, forgerons et soudeurs au Togo.

Le projet est un MVP complet compose de :

- un frontend HTML, CSS et JavaScript natif ;
- une API backend PHP ;
- une base de donnees MySQL/MariaDB ;
- trois espaces utilisateurs : client, artisan et administrateur ;
- une interface responsive et une configuration PWA ;
- un catalogue de produits standards avec panier d'achat.

## Sommaire

- [Fonctionnalites](#fonctionnalites)
- [Architecture](#architecture)
- [Structure du projet](#structure-du-projet)
- [Installation XAMPP](#installation-xampp)
- [Configuration MySQL](#configuration-mysql)
- [Creation de l'administrateur](#creation-de-ladministrateur)
- [Pages frontend](#pages-frontend)
- [API backend](#api-backend)
- [Base de donnees](#base-de-donnees)
- [Securite](#securite)
- [Parcours principaux](#parcours-principaux)
- [Etat du projet](#etat-du-projet)

## Fonctionnalites

### Espace client

- Inscription avec le role client.
- Connexion et session PHP.
- Tableau de bord personnel.
- Recherche d'artisans verifies.
- Filtres par categorie, ville, note et disponibilite.
- Consultation des profils artisans.
- Demande directe a un artisan.
- Appel d'offres a plusieurs artisans.
- Regle metier : les demandes detaillees sont disponibles apres 5 commandes finalisees.
- Consultation des propositions recues.
- Acceptation d'une proposition.
- Creation automatique d'une commande apres acceptation.
- Suivi des commandes et de leurs statuts.
- Messagerie avec les artisans.
- Notifications.
- Signalement d'un probleme.
- Ouverture d'un litige.
- Evaluation d'une commande terminee.
- Notes detaillees : qualite, delais, communication et rapport qualite/prix.
- **Catalogue de produits standards** : Parcourir les produits disponibles sans inscription.
- **Panier d'achat** : Ajouter plusieurs produits au panier.
- **Commandes multi-artisans** : Commander des produits de plusieurs artisans differents.
- **Achat sans inscription** : Possibilite de commander sans compte (redirection vers inscription).

### Espace artisan

- Inscription avec le role artisan.
- Creation et modification du profil professionnel.
- Nom professionnel, categorie, ville, adresse et experience.
- Gestion de la disponibilite.
- Statut de verification : `pending`, `verified` ou `rejected`.
- Tableau de bord artisan.
- Consultation des appels d'offres ouverts.
- Filtrage des appels d'offres par categorie et ville.
- Envoi d'une proposition avec montant, delai et message.
- Consultation des commandes recues.
- Acceptation d'une commande.
- Passage en fabrication.
- Finalisation d'une commande.
- Messagerie avec les clients.
- Notifications lorsqu'une proposition est acceptee.
- **Gestion de produits standards** : Ajouter des produits au catalogue.
- **Notifications de panier** : Alertes quand un client ajoute leurs produits au panier.
- **Commandes catalogue** : Reception et traitement des commandes depuis le catalogue.

### Espace administrateur

- Connexion avec le role admin.
- Tableau de bord avec donnees MySQL.
- Nombre d'utilisateurs.
- Nombre d'artisans verifies.
- Nombre de commandes.
- Revenus des commandes terminees.
- Validation ou rejet des profils artisans.
- Consultation des utilisateurs.
- Consultation des commandes.
- Consultation des litiges.
- Resolution ou rejet des litiges.
- Notifications liees aux actions importantes.

## Architecture

```text
Navigateur
    |
    | fetch() en JSON
    v
Frontend HTML/CSS/JavaScript
    |
    | /api/v1/*.php
    v
API PHP avec sessions et PDO
    |
    v
MySQL / MariaDB
```

Le frontend ne contient plus de donnees metier fictives pour les parcours principaux. Les artisans, commandes, messages, devis, avis, litiges, notifications et statistiques sont charges depuis la base de donnees.

## Structure du projet

```text
ForgeMarket/
|
|-- Pages publiques et authentification
|   |-- index.html                  Accueil
|   |-- about.html                  Presentation du projet
|   |-- contact.html                Contact
|   |-- login.html                  Connexion
|   |-- register.html               Inscription client ou artisan
|   |-- forgot-password.html        Recuperation de mot de passe, interface a completer
|   |-- cgu.html                    Conditions generales d'utilisation
|   |-- cgv.html                    Conditions generales de vente
|   |-- privacy.html                Politique de confidentialite
|
|-- Pages client
|   |-- dashboard.html              Tableau de bord client
|   |-- artisans.html               Recherche et liste des artisans
|   |-- artisan-profile.html        Profil public d'un artisan
|   |-- create-quote.html           Demande de devis ou appel d'offres
|   |-- orders.html                 Liste et suivi des commandes
|   |-- messages.html               Messagerie
|   |-- review.html                 Evaluation d'une commande
|   |-- dispute.html                Ouverture d'un litige
|   |-- profile.html                Profil utilisateur, interface a completer
   |-- catalogue.html              Catalogue de produits standards
   |-- product-detail.html         Detail d'un produit
   |-- cart.html                   Panier d'achat
   |-- checkout.html               Finalisation de commande
|
|-- Pages artisan
|   |-- artisan-dashboard.html      Tableau de bord professionnel
|
|-- Pages administrateur
|   |-- admin-dashboard.html        Statistiques et activite globale
|   |-- admin-users.html            Liste des utilisateurs
|   |-- admin-artisans.html         Validation des artisans
|   |-- admin-orders.html           Liste des commandes
|   |-- admin-disputes.html         Gestion des litiges
|
|-- API PHP
|   |-- api/
|       |-- v1/
|           |-- auth/
|           |   |-- login.php       Connexion
|           |   |-- register.php    Inscription
|           |
|           |-- artisans/
|           |   |-- index.php       Liste des artisans verifies
|           |   |-- show.php        Detail d'un artisan
|           |   |-- profile.php     Gestion du profil artisan connecte
|           |
|           |-- admin/
|           |   |-- artisans.php    Validation et rejet des artisans
|           |
|           |-- health.php           Test de connexion PHP/MySQL
|           |-- dashboard.php        Statistiques du dashboard client
|           |-- admin-dashboard.php  Statistiques du dashboard admin
|           |-- admin-users.php      Liste admin des utilisateurs
|           |-- admin-orders.php     Liste admin des commandes
|           |-- artisan-quotes.php   Appels d'offres pour artisans verifies
|           |-- client-quotes.php    Devis et propositions du client
|           |-- quotes.php           Creation et lecture des demandes de devis
|           |-- quote-responses.php  Reponses et acceptation des propositions
|           |-- orders.php            Lecture et transitions de commandes
|           |-- messages.php         Conversations et messages
|           |-- reviews.php          Lecture et publication des avis
|           |-- disputes.php         Ouverture et traitement des litiges
|           |-- notifications.php    Lecture et marquage des notifications
|           |-- notification-helper.php
|           |                         Helper de creation des notifications
|
|-- Configuration et donnees
|   |-- config/
|   |   |-- database.php             Connexion PDO a MySQL
|   |-- database.sql                 Schema complet de la base
|
|-- Outils
|   |-- tools/
|   |   |-- create_admin.php         Creation CLI du premier administrateur
|   |   |-- README.md                Utilisation de l'outil admin
|
|-- Styles CSS
|   |-- css/
|       |-- styles.css               Styles generaux et variables
|       |-- responsive.css           Responsive mobile, tablette et desktop
|       |-- auth.css                 Authentification
|       |-- artisans.css              Liste des artisans
|       |-- artisan-profile.css       Profil artisan
|       |-- dashboard.css             Dashboards
|       |-- orders.css                Commandes
|       |-- quote.css                 Devis et appels d'offres
|       |-- messages.css              Messagerie
|       |-- review.css                Evaluations
|       |-- admin.css                 Administration
|
|-- JavaScript frontend
|   |-- js/
|       |-- main.js                  Etat global, session et fonctions communes
|       |-- navigation.js             Navigation responsive
|       |-- auth.js                  Inscription et connexion
|       |-- artisans.js              Liste, filtres et recherche artisans
|       |-- artisan-profile.js       Affichage du profil public
|       |-- artisan-dashboard.js     Espace artisan et reponses aux devis
|       |-- dashboard.js              Dashboard client
|       |-- admin.js                 Dashboard admin
|       |-- admin-users.js           Liste admin des utilisateurs
|       |-- admin-orders.js          Liste admin des commandes
|       |-- admin-artisans.js        Validation des artisans
|       |-- admin-disputes.js        Gestion des litiges
|       |-- orders.js                Affichage et actions des commandes
|       |-- quote.js                 Formulaire de demande de devis
|       |-- messages.js              Messagerie
|       |-- review.js                Formulaire d'evaluation
|       |-- dispute.js               Formulaire de litige
|       |-- notifications.js         Affichage des notifications
|
|-- Configuration frontend
|   |-- manifest.json                Manifest PWA
|   |-- sw.js                       Service worker
|   |-- package.json                Scripts npm et dependance serve
|   |-- README.md                   Documentation du projet
```

## Installation XAMPP

### 1. Copier le projet

Copiez le dossier dans :

```text
C:\xampp\htdocs\ForgeMarket
```

### 2. Demarrer XAMPP

Dans le panneau XAMPP, demarrez :

- Apache ;
- MySQL.

### 3. Importer la base

1. Ouvrez `http://localhost/phpmyadmin`.
2. Cliquez sur **Importer**.
3. Selectionnez `database.sql`.
4. Lancez l'importation.

Le script cree la base `forgemarket` et toutes les tables necessaires.

Attention : le script SQL supprime puis recree les tables ForgeMarket. Utilisez-le sur une base de developpement ou sauvegardez vos donnees avant un nouvel import.

### 4. Tester l'API

Ouvrez :

```text
http://localhost/ForgeMarket/api/v1/health.php
```

Reponse attendue :

```json
{
  "success": true,
  "message": "Connexion réussie",
  "database": "forgemarket"
}
```

## Configuration MySQL

La configuration par defaut est dans `config/database.php` :

```text
Hote          : 127.0.0.1
Base          : forgemarket
Utilisateur   : root
Mot de passe  : vide
Encodage      : utf8mb4
```

Si MySQL utilise un mot de passe, modifiez la variable correspondante dans `config/database.php` et dans la copie situee dans `C:\xampp\htdocs\ForgeMarket\config\database.php`.

## Creation de l'administrateur

Depuis PowerShell :

```powershell
cd C:\xampp\htdocs\ForgeMarket
C:\xampp\php\php.exe tools\create_admin.php Admin Forge admin@forgemarket.tg "+228 90000000" "MotDePasseFort123!"
```

Le script :

- fonctionne uniquement en ligne de commande ;
- refuse l'execution depuis un navigateur ;
- verifie l'adresse email ;
- refuse un mot de passe trop court ;
- utilise `password_hash()` avant l'insertion.

## URLs principales

```text
Accueil             http://localhost/ForgeMarket/
Inscription         http://localhost/ForgeMarket/register.html
Connexion           http://localhost/ForgeMarket/login.html
Liste artisans      http://localhost/ForgeMarket/artisans.html
Dashboard client    http://localhost/ForgeMarket/dashboard.html
Dashboard artisan   http://localhost/ForgeMarket/artisan-dashboard.html
Dashboard admin     http://localhost/ForgeMarket/admin-dashboard.html
Commandes           http://localhost/ForgeMarket/orders.html
Messagerie          http://localhost/ForgeMarket/messages.html
```

## API backend

Toutes les routes sont disponibles sous `/api/v1/`.

| Route | Methode | Acces | Fonction |
|---|---|---|---|
| `auth/register.php` | POST | Public | Creer un compte client ou artisan |
| `auth/login.php` | POST | Public | Ouvrir une session PHP |
| `health.php` | GET | Public | Tester la connexion a MySQL |
| `artisans/index.php` | GET | Public | Rechercher les artisans verifies |
| `artisans/show.php` | GET | Public | Consulter un profil artisan |
| `artisans/profile.php` | GET/POST | Artisan | Lire ou modifier son profil |
| `dashboard.php` | GET | Client | Charger les statistiques client |
| `quotes.php` | GET/POST | Client | Creer ou lister les demandes de devis |
| `client-quotes.php` | GET | Client | Voir les propositions recues |
| `artisan-quotes.php` | GET | Artisan verifie | Voir les appels d'offres compatibles |
| `quote-responses.php` | GET/POST | Client/Artisan | Repondre ou accepter une proposition |
| `orders.php` | GET/POST | Client/Artisan | Lire et mettre a jour les commandes |
| `messages.php` | GET/POST | Connecte | Lire et envoyer des messages |
| `reviews.php` | GET/POST | Client | Lire une commande et publier un avis |
| `disputes.php` | GET/POST | Client/Admin | Ouvrir ou traiter un litige |
| `notifications.php` | GET/POST | Connecte | Lire et marquer les notifications |
| `admin-dashboard.php` | GET | Admin | Charger les statistiques admin |
| `admin-users.php` | GET | Admin | Lister les utilisateurs |
| `admin-orders.php` | GET | Admin | Lister les commandes |
| `admin/artisans.php` | GET/POST | Admin | Valider ou rejeter un artisan |

## Base de donnees

Le fichier `database.sql` cree les tables suivantes :

- `users` : comptes, roles, contacts et sessions metier ;
- `artisan_profiles` : informations professionnelles et verification ;
- `artisan_portfolio` : realisations futures des artisans ;
- `quotes` : demandes directes et appels d'offres ;
- `quote_responses` : propositions des artisans ;
- `orders` : commandes et statuts ;
- `order_attachments` : fichiers lies aux commandes ;
- `messages` : conversations et messages ;
- `reviews` : evaluations et notes detaillees ;
- `disputes` : litiges et decisions admin ;
- `notifications` : alertes utilisateur.

Relations principales :

```text
users
  -> artisan_profiles
  -> quotes
  -> orders
  -> messages
  -> reviews
  -> disputes
  -> notifications

quotes
  -> quote_responses
  -> orders

orders
  -> order_attachments
  -> reviews
  -> disputes
```

## Statuts metier

### Profil artisan

```text
pending -> verified
pending -> rejected
rejected -> pending
```

### Commande

```text
pending -> accepted
pending -> cancelled
accepted -> in_progress
in_progress -> completed
```

Une commande peut aussi passer a `disputed` lorsqu'un client ouvre un litige eligible.

### Demande de devis

```text
open -> accepted
open -> rejected
open -> cancelled
open -> expired
```

## Securite

Le backend applique :

- `password_hash()` et `password_verify()` pour les mots de passe ;
- sessions PHP ;
- controle des roles `client`, `artisan` et `admin` ;
- requetes preparees PDO ;
- validation des donnees cote serveur ;
- verification de la propriete des commandes, devis et litiges ;
- limitation des actions selon le role ;
- echappement HTML des donnees affichees par JavaScript ;
- prevention des doubles evaluations ;
- refus des acces anonymes aux ressources privees.

Avant la production, il faudra encore ajouter HTTPS, une protection CSRF complete, une gestion externe des secrets, une politique stricte d'upload et une journalisation de securite centralisee.

## Parcours principaux

### Parcours client

```text
Inscription
  -> Connexion
  -> Recherche d'un artisan verifie
  -> Demande directe ou appel d'offres
  -> Reception des propositions
  -> Acceptation d'une proposition
  -> Creation de la commande
  -> Suivi de la commande
  -> Confirmation ou litige
  -> Evaluation
```

### Parcours artisan

```text
Inscription artisan
  -> Creation du profil professionnel
  -> Verification par un admin
  -> Consultation des appels d'offres
  -> Envoi d'une proposition
  -> Acceptation par le client
  -> Acceptation de la commande
  -> Fabrication
  -> Finalisation
```

### Parcours administrateur

```text
Connexion admin
  -> Dashboard statistiques
  -> Validation des artisans
  -> Suivi des utilisateurs et commandes
  -> Traitement des litiges
```

## Fonctionnalites encore a developper

Le MVP couvre les parcours principaux. Les fonctions suivantes restent a finaliser :

- paiement en ligne ;
- upload reel et securise des photos, plans et documents ;
- messages vocaux ;
- recuperation de mot de passe ;
- portfolio dynamique ;
- affichage des avis directement dans le profil artisan ;
- communication temps reel par WebSocket ;
- tests automatises et tests d'integration ;
- statistiques admin detaillees par periode ;
- gestion complete du profil utilisateur ;
- configuration de production ;
- interface de gestion des produits pour les artisans ;
- systeme de paiement en ligne pour le catalogue.

## Demarrage alternatif

Pour servir uniquement les fichiers statiques :

```powershell
python -m http.server 8000
```

Pour utiliser le backend PHP, les sessions et MySQL, utilisez Apache avec XAMPP.

## Identite visuelle

- Orange principal : `#C2652A`
- Rouge secondaire : `#8C3C3C`
- Gris neutre : `#82746E`
- Fond creme : `#FAF5EE`

## Conformite

Le projet est destine a respecter les principes de la loi togolaise n°2019-014 relative a la protection des donnees a caractere personnel. Une validation juridique, une politique de conservation des donnees et une procedure de suppression des comptes devront etre definies avant la mise en production.
