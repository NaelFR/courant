# Formulaire de demande de devis

Le site reste statique et n’a besoin d’aucune nouvelle dépendance. Le formulaire
effectue un POST classique dans une iframe invisible. Apps Script renvoie ensuite
un accusé de réception par `postMessage` à l’origine autorisée du site. Le client
vérifie l’origine Google et l’identifiant aléatoire de la demande. Un chargement
d’iframe ou un délai écoulé n’est jamais interprété comme un succès.

## 1. Préparer Google

1. Créer un **Google Sheets privé**, avec le compte de l’entreprise. Copier son
   identifiant dans l’URL : `https://docs.google.com/spreadsheets/d/IDENTIFIANT/edit`.
2. Ouvrir **Extensions → Apps Script** et remplacer le contenu de `Code.gs` par
   celui du fichier [Code.gs](./Code.gs) de ce dossier.
3. Dans **Paramètres du projet → Propriétés du script**, ajouter :

   | Propriété | Valeur |
   | --- | --- |
   | `SPREADSHEET_ID` | Identifiant du Google Sheets |
   | `RECIPIENT_EMAIL` | Adresse de l’entreprise qui reçoit les notifications |
   | `ALLOWED_ORIGINS` | Origines exactes séparées par des virgules, sans slash final |

   Exemple pour `ALLOWED_ORIGINS` :
   `https://courantabc.fr,https://www.courantabc.fr,http://localhost:4321`.
   Ajouter l’adresse réelle de l’hébergement et les éventuelles prévisualisations
   utilisées pour les tests. Retirer localhost quand il n’est plus nécessaire.
4. Sélectionner la fonction **setup**, cliquer sur **Exécuter**, puis autoriser
   l’accès au tableur et l’envoi d’emails. L’onglet **Demandes de devis** est créé.
   Ne pas exécuter `doPost` manuellement : il attend une requête du formulaire.

## 2. Déployer le script

Dans **Déployer → Nouveau déploiement → Application Web** :

- **Exécuter en tant que : Moi** (compte de l’entreprise).
- **Qui a accès : Tout le monde**, y compris les personnes sans compte Google.

Copier l’URL se terminant par **`/exec`**, et non `/dev`. Si l’organisation Google
interdit l’accès anonyme, cette intégration ne peut pas recevoir de demandes de
visiteurs anonymes avec ce compte.

Après une modification du code : **Déployer → Gérer les déploiements → Modifier →
Nouvelle version → Déployer**. Garder le même déploiement conserve l’URL.

## 3. Configurer le site

Ajouter à `.env` en local et aux variables d’environnement de l’hébergeur :

```dotenv
PUBLIC_QUOTE_FORM_URL=https://script.google.com/macros/s/IDENTIFIANT_DU_DEPLOIEMENT/exec
```

Redémarrer le serveur local ou reconstruire et redéployer le site. Cette URL est
publique ; ne jamais mettre de mot de passe ou de jeton dans une variable `PUBLIC_`.
Sans URL valide, le bouton reste désactivé et un message invite à contacter
l’entreprise directement. JavaScript doit être activé pour utiliser le formulaire.

## 4. Tester avant ouverture

1. Ouvrir le site dans une fenêtre privée, sans connexion Google.
2. Envoyer une demande de test avec une adresse email que vous contrôlez.
3. Vérifier le message de confirmation, la ligne du tableur et la notification.
4. Utiliser **Répondre** dans l’email : le destinataire doit être l’adresse saisie.
5. Tester sur mobile. En cas de délai dépassé, les champs restent remplis et un
   nouvel envoi inchangé conserve le même identifiant pour éviter les doublons.

Les tests locaux automatisés ne contactent pas Google et n’envoient aucun email :

```sh
node --test google-apps-script/*.test.mjs
```

## Exploitation et limites

- Une confirmation signifie que la demande est **enregistrée dans le tableur**.
  L’email n’est qu’une notification. La colonne **Notification** affiche
  **Envoyée** ou reste **À notifier** si le quota ou le service email échoue.
  Consulter régulièrement le tableur ; aucune relance automatique n’est prévue.
- L’expéditeur est le compte Google qui déploie le script ; le champ `replyTo`
  contient l’adresse du visiteur. Aucun email automatique n’est envoyé au visiteur.
- Validation côté serveur, champ piège invisible, verrou contre les écritures
  simultanées, neutralisation des formules dans Sheets et plafond de **50 nouvelles
  demandes par jour**, calculé à l’heure de Paris. Les doublons d’identifiant ne
  consomment pas ce plafond. Ne pas modifier la propriété interne `DAILY_REQUESTS`.
- Ce sont des protections de base, pas une protection complète contre les robots.
  L’URL est publique et l’origine déclarée est falsifiable hors navigateur. En cas
  d’abus, ajouter un CAPTCHA vérifié côté serveur ou passer par un backend avec
  limitation des requêtes. Le plafond peut être épuisé par du spam.
- Garder le tableur privé, limiter les accès et définir une durée de conservation
  adaptée. La politique de confidentialité du site doit décrire le traitement
  réellement utilisé, dont Google Sheets. Aucun contenu légal n’est modifié ici.
- Les bloqueurs, les restrictions de cookies ou une politique CSP peuvent bloquer
  l’iframe Google : le formulaire affichera un délai dépassé, jamais un faux succès.
  Si une CSP est configurée, tenir compte des domaines `script.google.com` et
  `*.googleusercontent.com` pour les frames et de l’URL Google pour `form-action`.

Documentation Google : [applications web](https://developers.google.com/apps-script/guides/web),
[HTML Service et iframe](https://developers.google.com/apps-script/guides/html/restrictions),
[XFrameOptionsMode](https://developers.google.com/apps-script/reference/html/x-frame-options-mode),
[quotas](https://developers.google.com/apps-script/guides/services/quotas).
