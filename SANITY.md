# Contenu du site dans Sanity

Ouvrir `/admin` et se connecter au projet Sanity.

- **Informations de l’entreprise** : fiche unique pour le téléphone, le mail,
  l’adresse, les spécialités, le SIRET et l’année du pied de page. Les coordonnées
  actuelles sont préremplies à la première ouverture. Cliquer sur **Publish** pour
  les utiliser sur le site.
- **Service** : nom, description, icône parmi les six icônes du site, liste
  d’exemples et ordre d’affichage (le plus petit nombre en premier).
- **Avis client** : note entière de 1 à 5, texte, auteur, ville, type de prestation
  et ordre d’affichage. Seuls les avis publiés sont affichés. La section reste
  masquée tant qu’aucun avis n’est publié.
- **Réalisation** : titre, photo, description de la photo (texte alternatif) et
  ordre d’affichage. La galerie utilise uniquement les réalisations publiées avec
  une photo disponible dans Sanity. Sans description, le titre sert de texte
  alternatif. À ordre égal, les plus récentes apparaissent en premier. La section
  est masquée tant qu’aucune réalisation avec photo n’est publiée. Les images
  locales de `src/assets/works` ne sont plus utilisées par la galerie.

Les services et les coordonnées actuels servent de valeurs de départ tant
qu’aucun service ou paramètre n’est publié. Dès qu’un premier service est publié,
seuls les services Sanity sont affichés.

## Publication

Le site Astro est statique : les données publiées sont lues à la compilation
(`npm run build`). Après une modification dans le Studio, reconstruire et
redéployer le site pour actualiser la version publique. En développement,
recharger la page suffit. Les brouillons ne sont jamais affichés.

Pour automatiser les mises à jour en production, connecter un webhook Sanity au
build hook de l’hébergeur. Cela dépend de l’hébergeur choisi et n’est pas encore
configuré dans ce dépôt.

## Année automatique

Laisser le champ « Année du pied de page » vide pour utiliser l’année courante.
Le navigateur actualise cette année à l’ouverture de la page, même si le dernier
build date de l’année précédente. Sans JavaScript, l’année est celle du build.
Une année renseignée dans le Studio reste fixe.

## Accès

Le frontend utilise les données publiques du dataset `production`, sans jeton.
Pour un dataset privé, il faut une lecture authentifiée côté serveur avec un
jeton non public. Les erreurs de lecture Sanity font échouer le build, pour ne
pas publier silencieusement des coordonnées obsolètes.

Dans Sanity → API → CORS origins, autoriser l’origine du Studio (par exemple
`http://localhost:4321`, ou le port indiqué par Astro) avec **Allow credentials**.
