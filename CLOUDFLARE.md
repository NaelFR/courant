# Déploiement Cloudflare Workers

Le projet génère un site statique dans `dist`. Le fichier `wrangler.jsonc`
configure le Worker **courant** pour servir ces fichiers. Aucun adaptateur SSR,
base de données Cloudflare ni secret applicatif n’est nécessaire.

## Build connecté au dépôt Git

Dans **Workers & Pages → courant → Settings → Build**, connecter le dépôt et
choisir la branche de production. Les libellés peuvent varier avec la langue du
tableau de bord. Configurer :

- Répertoire racine : racine du projet.
- Commande de build : `npm run build`.
- Commande de déploiement : `npx wrangler deploy`.

Dans la section **Variables and secrets du build**, ajouter les variables texte :

| Variable | Valeur |
| --- | --- |
| `PUBLIC_SITE_URL` | `https://courant.abou-chahine-nael.workers.dev` |
| `PUBLIC_QUOTE_FORM_URL` | URL `/exec` du déploiement Apps Script, déjà utilisée dans `.env` |
| `PUBLIC_NOINDEX` | `true` si le site est en préproduction ; `false` pour autoriser l’indexation |
| `NODE_VERSION` | `24` |

Ces valeurs sont lues **pendant la compilation**, pas au moment des visites.
Les configurer uniquement comme bindings/variables d’exécution du Worker ne
suffit pas. Les fichiers `.env` locaux ne sont pas envoyés au dépôt.
Après un changement, relancer un build et un déploiement.

Pour les builds de prévisualisation Cloudflare, configurer également
`PUBLIC_NOINDEX=true` dans leurs paramètres de build : la détection automatique
Vercel/Netlify ne couvre pas Cloudflare.

## Secrets

Les variables `PUBLIC_*` sont publiques par conception : utiliser des variables
texte ordinaires. Il n’y a pas de clé privée Sanity ou Google à ajouter dans le
site actuel. Les propriétés `SPREADSHEET_ID`, `RECIPIENT_EMAIL`, `ALLOWED_ORIGINS`
restent configurées dans Apps Script.

Pour un dépôt connecté via Workers Builds, Cloudflare gère l’authentification du
déploiement. Un token personnel n’a pas à être injecté dans le code du site.
Si un CI externe est utilisé, son token Cloudflare doit rester dans les secrets
du CI, avec les permissions minimales nécessaires au déploiement.

## Autoriser les services externes

1. **Sanity → Manage → API → CORS origins** : ajouter
   `https://courant.abou-chahine-nael.workers.dev` avec **Allow credentials**
   pour permettre la connexion au Studio `/admin/`.
2. **Apps Script → Paramètres du projet → Propriétés du script** : ajouter
   `https://courant.abou-chahine-nael.workers.dev` à `ALLOWED_ORIGINS`, en
   conservant les autres origines nécessaires et en les séparant par des virgules.
3. Tester une demande de devis depuis l’adresse publique, idéalement en navigation privée.

## Domaine définitif

1. Ajouter le domaine dans **Settings → Domains & Routes → Custom Domain**
   et suivre les instructions DNS de Cloudflare. Préserver les réglages email.
2. Changer `PUBLIC_SITE_URL` dans les variables de build et dans `.env` local.
   Le site exige cette variable : aucun ancien domaine n’est utilisé en repli.
3. Ajouter le domaine dans les origines Sanity et Apps Script.
4. Ajuster les éventuelles URL écrites dans les textes légaux Sanity.
5. Passer `PUBLIC_NOINDEX=false` quand le site est prêt, reconstruire et redéployer.
6. Vérifier canonical, aperçu social, `robots.txt`, `sitemap.xml` et le formulaire.
7. Gérer l’ancienne adresse Workers et les variantes du domaine pour éviter
   plusieurs versions publiques concurrentes ; prévoir les redirections lorsque
   possible et déclarer le domaine définitif dans Search Console.

La variable met à jour les URL canoniques, les métadonnées Open Graph, le JSON-LD
et le sitemap. Elle ne modifie ni les DNS ni les textes saisis dans Sanity.

Documentation : [Astro statique sur Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/),
[configuration Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).
