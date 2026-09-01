# ForgeMarket - Frontend

Plateforme web de mise en relation entre clients, forgerons et soudeurs au Togo.

## 🎨 Couleurs de la marque

- **Orange (#C2652A)** - Couleur principale
- **Rouge foncé (#8C3C3C)** - Couleur secondaire
- **Gris (#82746E)** - Couleur neutre
- **Crème (#FAF5EE)** - Couleur de fond

## 📁 Structure du projet

```
ForgeMarket/
├── index.html                 # Page d'accueil
├── login.html                 # Page de connexion
├── register.html              # Page d'inscription
├── artisans.html              # Liste des artisans
├── artisan-profile.html       # Profil d'un artisan
├── orders.html                # Gestion des commandes
├── create-quote.html          # Demande de devis/appel d'offres
├── messages.html              # Messagerie
├── review.html                # Évaluation de commande
├── dashboard.html             # Tableau de bord utilisateur
├── admin-dashboard.html       # Tableau de bord administration
├── css/
│   ├── styles.css            # Styles principaux
│   ├── responsive.css        # Styles responsives
│   ├── auth.css              # Styles d'authentification
│   ├── artisans.css          # Styles de la page artisans
│   ├── artisan-profile.css   # Styles du profil artisan
│   ├── orders.css            # Styles des commandes
│   ├── quote.css             # Styles des devis
│   ├── messages.css          # Styles de la messagerie
│   ├── review.css            # Styles des évaluations
│   ├── admin.css             # Styles de l'administration
│   └── dashboard.css         # Styles du tableau de bord
├── js/
│   ├── main.js               # Fonctionnalités principales
│   ├── navigation.js         # Navigation
│   ├── auth.js               # Authentification
│   ├── artisans.js           # Page artisans
│   ├── artisan-profile.js    # Profil artisan
│   ├── orders.js             # Gestion des commandes
│   ├── quote.js              # Devis et appels d'offres
│   ├── messages.js           # Messagerie
│   ├── review.js             # Évaluations
│   ├── admin.js              # Administration
│   └── dashboard.js          # Tableau de bord
├── manifest.json             # Configuration PWA
├── package.json              # Configuration du projet
└── README.md                 # Documentation
```

## 🚀 Fonctionnalités

### Pour les clients
- ✅ Inscription et connexion sécurisées
- ✅ Recherche et filtrage d'artisans
- ✅ Consultation des profils et portfolios
- ✅ Passer des commandes et suivre leur avancement
- ✅ Accès aux demandes de devis (après 5 commandes)
- ✅ Appels d'offres avec confidentialité
- ✅ Messagerie avec artisans
- ✅ Évaluation des services
- ✅ Système de fidélisation

### Pour les artisans
- ✅ Inscription professionnelle
- ✅ Vérification de dossier
- ✅ Portfolio de réalisations
- ✅ Gestion des commandes
- ✅ Réponse aux appels d'offres
- ✅ Messagerie avec clients
- ✅ Évaluation et réputation
- ✅ Tableau de bord statistique

### Pour l'administration
- ✅ Tableau de bord avec statistiques
- ✅ Validation des artisans
- ✅ Gestion des commandes
- ✅ Résolution des litiges
- ✅ Journal d'audit
- ✅ Suivi des revenus

## 🌐 Démarrage local

### Option 1: Python
```bash
python -m http.server 8000
```

### Option 2: Node.js (avec serve)
```bash
npm install
npm run dev
```

### Option 3: PHP
```bash
php -S localhost:8000
```

Ouvrez ensuite votre navigateur sur `http://localhost:8000`

## 📱 PWA (Progressive Web App)

Le projet est configuré comme une PWA avec le fichier `manifest.json`. Pour un fonctionnement complet hors-ligne, vous devrez ajouter un Service Worker (`sw.js`).

## 🔧 Configuration

### Couleurs
Les couleurs sont définies dans `css/styles.css` avec les variables CSS :
```css
:root {
    --primary-color: #C2652A;
    --secondary-color: #8C3C3C;
    --neutral-color: #82746E;
    --background-color: #FAF5EE;
}
```

### API
Le frontend est configuré pour communiquer avec une API REST sur `/api/v1/`. Vous devrez adapter les endpoints selon votre backend.

## 📝 Notes de développement

### Règle des 5 commandes
Cette fonctionnalité est implémentée dans plusieurs pages :
- `dashboard.html` - Affiche la progression
- `create-quote.html` - Restreint l'accès aux demandes de devis
- `orders.html` - Affiche le compteur de commandes finalisées

### Système d'évaluation
- Note sur 5 étoiles
- Commentaire obligatoire
- Évaluation détaillée (qualité, délais, communication, rapport qualité/prix)

### Messagerie
- Messages texte
- Support pour les pièces jointes
- Messages vocaux (à implémenter avec backend)
- Confidentialité des appels d'offres

## 🔐 Sécurité

- Validation des formulaires côté client
- Gestion des sessions avec JWT (à connecter au backend)
- Protection CSRF (à implémenter avec backend)
- Validation des entrées

## 📱 Responsive Design

Le site est entièrement responsive et optimisé pour :
- Mobile (320px+)
- Tablette (768px+)
- Desktop (1024px+)

## 🌍 Conformité

Le projet est conçu pour être conforme à la loi togolaise n°2019-014 relative à la protection des données à caractère personnel.

## 📧 Contact

Pour toute question ou suggestion, contactez l'équipe ForgeMarket.

---

**Note**: Ce frontend est une interface utilisateur complète. Pour une application fonctionnelle, il doit être connecté à un backend (API REST) pour la gestion des données, l'authentification, et les fonctionnalités en temps réel.