# Marketplace PSL - Documentation Technique

---

## Table des matières

1. [Architecture globale](#architecture-globale)  
2. [Frontend](#frontend)  
   - Pages  
   - Composants  
3. [Backend](#backend)  
   - Endpoints PHP  
4. [Flux d'authentification](#flux-dauthentification)  
5. [Flux Marketplace](#flux-marketplace)  
   - Produits  
   - Panier  
   - Commande  
   - Gestion du stock  
6. [Fonctionnalités professionnelles](#fonctionnalites-professionnelles)  
   - Tableau de bord  
   - Performances  
   - Catalogue  
7. [Schéma de la base de données](#schema-de-la-base-de-donnees)  
8. [Installation et configuration locale](#installation-et-configuration-locale)  

---

## Architecture globale

Le projet Marketplace PSL est une application web structurée selon une architecture client-serveur classique :

- **Frontend** : Application React.js, responsable de l'interface utilisateur et de l'expérience client.
- **Backend** : API REST en PHP, gérant la logique métier, la sécurité, et les interactions avec la base de données.
- **Base de données** : MySQL, stockant les données utilisateurs, produits, commandes, etc.

Cette séparation permet une évolutivité et une maintenance facilitées.

---

## Frontend

L'application frontend est développée en React.js avec une organisation claire des pages et composants.

### Pages principales

| Page                   | Description                                               |
|------------------------|-----------------------------------------------------------|
| **Accueil**            | Présentation générale, mise en avant des produits phares |
| **Catalogue**          | Liste paginée des produits disponibles                   |
| **Détail produit**     | Informations détaillées, options d'ajout au panier       |
| **Panier**             | Visualisation et modification des articles sélectionnés  |
| **Commande**           | Formulaire de validation et paiement                     |
| **Profil utilisateur** | Gestion des informations personnelles et historiques     |
| **Connexion / Inscription** | Authentification et création de compte              |
| **Espace professionnel** | Accès réservé aux vendeurs/professionnels              |

### Composants clés

- **Header** : Navigation principale, accès au panier et profil.
- **Footer** : Informations légales et contacts.
- **ProductCard** : Carte produit réutilisable dans les listes.
- **CartItem** : Ligne détaillée dans le panier.
- **OrderSummary** : Récapitulatif des commandes.
- **DashboardPro** : Composant principal de l’espace professionnel.
- **ModalAuth** : Fenêtre modale pour l’authentification.

---

## Backend

Le backend est une API REST développée en PHP, exposant plusieurs endpoints pour gérer les différentes fonctionnalités.

### Endpoints principaux

| Endpoint                  | Méthode | Description                                         |
|----------------------------|---------|----------------------------------------------------|
| `/api/auth/login`          | POST    | Authentification utilisateur                       |
| `/api/auth/register`       | POST    | Création de compte utilisateur                     |
| `/api/auth/logout`         | POST    | Déconnexion                                        |
| `/api/products`            | GET     | Récupération de la liste des produits              |
| `/api/products/{id}`       | GET     | Détail d’un produit                                |
| `/api/orders`              | POST    | Création d’une commande                            |
| `/api/orders/{id}`         | GET     | Détail d’une commande                              |

---

## Flux d'authentification

1. **Inscription** : L’utilisateur remplit un formulaire avec ses informations. Les données sont envoyées au backend via `/api/auth/register`.
2. **Connexion** : L’utilisateur fournit ses identifiants via `/api/auth/login`. En cas de succès, un token JWT est retourné et stocké côté client.
3. **Gestion de session** : Le token est envoyé dans les headers Authorization pour les requêtes sécurisées.
4. **Déconnexion** : Le token est invalidé côté client via `/api/auth/logout`.

---

## Flux Marketplace

### Produits

- Les produits sont affichés dans le catalogue avec pagination.
- Chaque produit possède un stock géré en base.
- Les détails incluent description, prix, images, et disponibilité.

### Panier

- L’utilisateur peut ajouter, modifier ou supprimer des produits.
- Le panier est stocké côté backend et synchronisé avec le frontend.
- Les quantités sont vérifiées en fonction du stock disponible.

### Commande

- Lors de la validation, une commande est créée avec les détails du panier.
- Le stock est automatiquement mis à jour.
- Un récapitulatif est envoyé à l’utilisateur.

### Gestion du stock

- Le stock est décrémenté lors de la validation de commande.
- Les vendeurs professionnels peuvent gérer leur stock via leur espace dédié.

---

## Fonctionnalités professionnelles

### Tableau de bord

- Vue synthétique des ventes, commandes en cours, et performances.
- Graphiques et indicateurs clés.

### Performances

- Statistiques détaillées par produit et période.
- Analyse des tendances et recommandations.

### Catalogue

- Gestion complète des produits : création, modification, suppression.
- Contrôle des stocks et mise en ligne.

---

## Schéma de la base de données

| Table          | Description                                 | Principaux champs                        |
|----------------|---------------------------------------------|------------------------------------------|
| `users`        | Utilisateurs (clients et professionnels)    | id, nom, email, mot_de_passe, raison_soc |
| `products`     | Produits du catalogue                       | id, nom, description, prix, stock, pro_id|
| `commande`     | Commandes passées                           | id, user_id, date, statut, total         |
| `compose_commande`| Articles dans une commande               | id, order_id, product_id, quantite       |
| `adresse`      | adresse utilisateur                         | id, user_id                              |
 
---

## Installation et configuration locale

### Prérequis

- PHP 7.4+  
- MySQL 5.7+  
- Node.js 14+  
- Composer  
- npm ou yarn  

### Étapes

1. **Cloner le dépôt**

```bash
git clone https://github.com/psl/marketplace-psl.git
cd marketplace-psl
```

2. **Installer le backend**

```bash
cd backend
composer install
cp .env.example .env
# Modifier .env avec vos paramètres MySQL
php -S localhost:8000 -t public
```

3. **Installer le frontend**

```bash
cd ../frontend
npm install
npm start
```

4. **Initialiser la base de données**

- Importer le fichier SQL `database/schema.sql` dans MySQL.

5. **Accéder à l’application**

- Frontend : `http://localhost:3000`  
- Backend API : `http://localhost:8000/api`

---

Pour toute question ou contribution, merci de consulter le fichier CONTRIBUTING.md ou contacter l’équipe technique.

---

*Marketplace PSL - Projet Paris Dauphine 2024*
