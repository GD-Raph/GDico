Plan initial :
Glossaire Interactif GDS — Knowledge Graph

L'équipe pluridisciplinaire GPTW a besoin d'un glossaire interactif sous forme de Knowledge Graph. Les données sont maintenues dans un Google Sheet public, modifiable à distance par l'équipe sans intervention technique. L'application web doit être légère, rapide, et visuellement premium.

Source de données actuelle : Google Sheet

Colonne	Rôle	Exemple
Terme	Nom du nœud dans le graphe	KPI
Définition	Texte affiché au survol/clic	Indicateur de performance...
Expertise	Catégorie(s), couleurs + filtres	Data, SEO
Mots Liés	Arêtes du graphe (split par ,)	ROI, Dashboard
Taille	Taille visuelle du nœud (optionnel)	40
IMPORTANT
Le Sheet ne contient actuellement que 3 lignes de test. Le plan est conçu pour scaler à 50-200+ termes.

Questions ouvertes pour l'utilisateur

WARNING
Les réponses à ces questions vont influencer des choix d'architecture importants. Merci de les lire attentivement.

1. Hébergement et déploiement

Comment comptes-tu héberger/servir l'application ?

* a) Fichiers statiques ouverts localement dans le navigateur (file://)
* b) Hébergé sur GitHub Pages / Netlify / Vercel (gratuit)
* c) Intégré dans un site existant (iframe, sous-domaine, etc.)
* d) Autre (précise)

→ Cela détermine si on a besoin d'un bundler (Vite) ou si du JS natif avec modules ES suffit.

2. La colonne Expertise multi-valuée

Dans le Sheet actuel, KPI a Data, SEO comme expertise. Cela veut dire :

* a) Le nœud appartient à plusieurs catégories (il a les 2 couleurs, ou une couleur mixte)
* b) Il y a une expertise principale (la première) et des secondaires
* c) Le nœud devrait apparaître dans les filtres des deux catégories

→ Comment veux-tu gérer visuellement un nœud multi-expertise ?

3. Volume de données attendu

Combien de termes penses-tu avoir à terme ?

* a) < 30 termes
* b) 30-100 termes
* c) 100-300 termes
* d) > 300 termes

→ Au-delà de ~150 nœuds, un graphe de force devient difficile à lire. Il faudrait potentiellement prévoir un mode "liste / tableau" alternatif.

4. Design — Palette et identité

* As-tu une charte graphique / des couleurs de marque à respecter ?
* "Fond clair" est confirmé, mais souhaites-tu aussi un dark mode optionnel ?
* Préfères-tu un look corporate/clean ou créatif/vibrant ?

5. Mots liés absents du glossaire

Si KPI est lié à ROI et Dashboard, mais que ROI et Dashboard ne sont pas encore définis comme termes dans le Sheet :

* a) On crée des "nœuds fantômes" (gris, sans définition) → visuellement, on voit qu'il manque des termes
* b) On ignore les liens vers des termes inexistants
* c) Autre comportement souhaité ?

6. Responsive / Mobile

L'application doit-elle fonctionner correctement sur mobile/tablette ou est-ce un outil desktop only ?

7. Multilinguisme

Le glossaire sera-t-il uniquement en français ou faut-il prévoir du multilingue ?

Architecture de fichiers proposée

GPTW-Glossaire/
├── index.html                  # Point d'entrée HTML
├── css/
│   ├── variables.css           # Design tokens (couleurs, typos, espacements)
│   ├── base.css                # Reset + styles globaux
│   ├── layout.css              # Grid principale (graphe + panel)
│   ├── components/
│   │   ├── search.css          # Barre de recherche + suggestions
│   │   ├── filters.css         # Tags/filtres par expertise
│   │   ├── panel.css           # Panel latéral détail
│   │   ├── tooltip.css         # Tooltip au survol
│   │   └── loader.css          # Écran de chargement
├── js/
│   ├── app.js                  # Point d'entrée JS — orchestration
│   ├── config.js               # Constantes (URL du Sheet, couleurs, paramètres ECharts)
│   ├── data/
│   │   ├── fetcher.js          # Fetch CSV + parsing avec PapaParse
│   │   └── transformer.js      # CSV → { nodes[], links[], categories[] }
│   ├── graph/
│   │   ├── chart.js            # Initialisation + config ECharts
│   │   ├── interactions.js     # Logique clic, hover, zoom sur nœud
│   │   └── layout.js           # Paramètres du force-directed layout
│   ├── ui/
│   │   ├── search.js           # Barre de recherche (Fuse.js)
│   │   ├── filters.js          # Système de filtres par expertise
│   │   ├── panel.js            # Panel latéral (affichage détail terme)
│   │   └── loader.js           # Gestion écran de chargement
│   └── utils/
│       └── helpers.js          # Fonctions utilitaires (debounce, sanitize, etc.)
├── assets/
│   └── fonts/                  # Polices locales si besoin (Inter/Roboto)
└── libs/
    ├── echarts.min.js          # Apache ECharts (CDN ou local)
    ├── papaparse.min.js        # Parser CSV
    └── fuse.min.js             # Recherche fuzzy

Justification de l'architecture

Décision	Pourquoi
Pas de bundler (Vite/Webpack)	JS natif avec <script type="module"> + imports ES6. Zéro config, zéro node_modules. Maintenable par des non-devs.
CSS séparé par composant	Chaque fichier CSS est petit et ciblé. On peut modifier le panel sans risquer de casser le graphe.
config.js isolé	L'URL du Sheet, les couleurs par expertise, et les paramètres du graphe sont centralisés. Un LLM moins performant n'a qu'à modifier ce fichier pour reconfigurer l'app.
libs/ en local	Les dépendances sont versionnées dans le projet. Pas de CDN = pas de risque de rupture si le CDN tombe.
Séparation data/ vs graph/ vs ui/	Responsabilité unique. Le fetcher ne sait rien du graphe. Le graphe ne sait rien du panel.
NOTE
Si l'hébergement choisi impose un serveur (pour le CORS du fetch CSV), on pourra migrer vers Vite ultérieurement sans refactoring majeur — la structure modulaire le permet.

Stack technique

Outil	Version	Rôle
JavaScript ES6+	Natif	Logique applicative
Apache ECharts	5.5+	Visualisation du Knowledge Graph (force-directed)
PapaParse	5.x	Parsing CSV depuis Google Sheets
Fuse.js	7.x	Recherche fuzzy dans la barre de recherche
CSS3	Natif	Styling, animations, transitions
Google Fonts	Inter	Typographie moderne

Fonctionnalités détaillées

1. Data Fetching (js/data/)

plaintext

Google Sheet (public, CSV export)
        ↓ fetch()
    CSV brut (string)
        ↓ PapaParse
    Array d'objets [{Terme, Définition, Expertise, Mots Liés, Taille}]
        ↓ transformer.js
    { nodes: [...], links: [...], categories: [...] }

* URL d'export : https://docs.google.com/spreadsheets/d/{ID}/export?format=csv
* Caching : Stocker les données en sessionStorage avec un TTL de 5 min pour éviter de re-fetcher à chaque navigation
* Gestion d'erreur : Afficher un message clair si le Sheet est inaccessible

Le transformer (transformer.js)

* Itère chaque ligne du CSV
* Crée un objet node par terme, avec :
    * id = Terme (normalisé .trim().toLowerCase() pour les comparaisons)
    * name = Terme (tel quel pour l'affichage)
    * value = Taille (fallback à une valeur par défaut si vide)
    * category = première Expertise (pour la couleur ECharts)
    * allCategories = tableau de toutes les expertises
    * definition = Définition
* Pour chaque Mots Liés : .split(',').map(s => s.trim()) → crée un objet link {source, target}
* Déduplique les liens (A→B et B→A ne font qu'une arête)
* Extrait la liste unique des catégories pour la légende

2. Visualisation ECharts (js/graph/)

Configuration du graphe

* Layout : force avec repulsion: 300-500, gravity: 0.1, edgeLength: [80, 200]
* Nœuds : Circles avec taille proportionnelle à la colonne Taille
* Liens : Lignes semi-transparentes, courbure légère (curveness: 0.1)
* Catégories : Couleurs définies dans config.js, liées à chaque expertise
* Animation : animationDuration: 1500, animationEasingUpdate: 'quinticInOut'

Interactions (interactions.js)

* Hover : Tooltip ECharts natif affichant {Terme} — {Définition courte}
* Clic sur nœud : Ouvre le panel latéral + met en surbrillance le nœud et ses voisins (les autres deviennent semi-transparents)
* Zoom sur nœud (depuis la recherche) : dispatchAction pour centrer + zoomer avec animation
* Double-clic : Reset du zoom

3. Barre de recherche (js/ui/search.js)

* Input avec Fuse.js en fuzzy search sur les champs Terme et Définition
* Dropdown de suggestions en temps réel (debounce 200ms)
* Au clic sur une suggestion :
    1. Ferme le dropdown
    2. Anime le graphe pour centrer sur le nœud
    3. Met le nœud en surbrillance
    4. Ouvre le panel latéral

4. Panel latéral (js/ui/panel.js)

* Slide-in depuis la droite avec transition CSS
* Contient :
    * Titre : Nom du terme
    * Badge(s) : Expertise(s) coloré(s)
    * Définition : Texte complet
    * Mots liés : Puces cliquables qui naviguent vers le terme lié dans le graphe
    * Bouton fermer (×)
* Se ferme au clic sur × ou au clic en dehors

5. Filtres par expertise (js/ui/filters.js)

* Barre de tags/chips cliquables (une par expertise unique)
* Chaque chip a la couleur de sa catégorie
* Toggle : Cliquer désactive/réactive une catégorie
* Le graphe ECharts filtre les nœuds correspondants via legend ou via setOption dynamique
* Un bouton "Tous" pour réinitialiser

6. Loader (js/ui/loader.js)

* Écran de chargement élégant pendant le fetch du CSV
* Animation subtile (pulse ou spinner) + texte "Chargement du glossaire..."
* Disparaît en fondu une fois les données parsées et le graphe initialisé


Design — Direction artistique

Palette (light mode)

Token	Valeur	Usage
--bg-primary	#F8F9FC	Fond de page
--bg-surface	#FFFFFF	Panel, cards
--text-primary	#1A1D2E	Texte principal
--text-secondary	#6B7294	Texte secondaire
--border	#E2E5F1	Bordures subtiles
--accent	#6366F1	Accent interactif (indigo)
Couleurs par expertise (exemples extensibles via config.js)

Expertise	Couleur	Hex
Acquisition	Bleu saphir	#3B82F6
Data	Violet	#8B5CF6
SEO	Émeraude	#10B981
Content	Corail	#F97316
Branding	Rose	#EC4899
Social	Cyan	#06B6D4
→ Ces couleurs sont dans config.js. Pour ajouter une expertise, il suffit d'ajouter une entrée. → Si une expertise n'a pas de couleur dans la config, une couleur est générée automatiquement (hash du nom).

Typographie

* Titres : Inter Bold
* Corps : Inter Regular
* Code : JetBrains Mono (si besoin)

Animations / Micro-interactions

* Panel slide-in : transform: translateX() avec transition: 0.3s ease-out
* Nœuds hover : léger scale-up (1.15x) + ombre
* Recherche suggestions : fade-in rapide (0.15s)
* Filtres toggle : couleur → gris avec transition
* Graphe force : animation fluide continue via ECharts


Flux de données complet

export CSVhoverclickselecttoggleclic mot liéGoogle Sheetédité par l'équipefetcher.jsfetch + PapaParsetransformer.jsnodes + links + categorieschart.jsECharts Force Graphsearch.jsFuse.js indexfilters.jschips par expertiseTooltippanel.jsDétail terme
(Mise en forme perdue pendant la récupération)

Proposed Changes
Data Layer
[NEW] 

config.js

Constantes : URL du Sheet, mapping couleurs/expertises, paramètres ECharts, TTL cache.

[NEW] 

fetcher.js

Fetch CSV depuis Google Sheets, parse avec PapaParse, cache sessionStorage.

[NEW] 

transformer.js

Transforme le CSV parsé en { nodes, links, categories } pour ECharts.

Graph Engine

[NEW] 

chart.js

Initialisation du graphe ECharts, configuration du layout force-directed.

[NEW] 

interactions.js

Gestion des événements (click, hover, zoom, highlight voisins).

[NEW] 

layout.js

Paramètres physiques du force layout (répulsion, gravité, longueur des arêtes).



UI Components

[NEW] 

search.js

Barre de recherche fuzzy avec Fuse.js, dropdown suggestions, navigation vers nœud.

[NEW] 

filters.js

Chips filtrantes par expertise, toggle on/off, bouton reset.

[NEW] 

panel.js

Panel latéral slide-in avec détail du terme, badges expertise, mots liés cliquables.

[NEW] 

loader.js

Écran de chargement animé avec gestion du cycle fetch → parse → render.



Styles

[NEW] 

variables.css

Design tokens CSS custom properties.

[NEW] 

base.css

Reset CSS + styles globaux + import Google Fonts (Inter).

[NEW] 

layout.css

Grid principale : zone graphe + zone panel latéral.

[NEW] CSS components (search.css, filters.css, panel.css, tooltip.css, loader.css)

Un fichier par composant UI.



Entry Point

[NEW] 

index.html

HTML sémantique minimal. Charge les CSS puis les JS en modules. Structure :

* <header> : titre + barre de recherche + filtres
* <main> : conteneur ECharts (pleine largeur/hauteur)
* <aside> : panel latéral (caché par défaut)
* <div id="loader"> : écran de chargement



Verification Plan
Tests dans le navigateur (browser subagent)

1. Chargement des données : Ouvrir index.html, vérifier que le loader s'affiche puis disparaît, et que le graphe contient les 3 nœuds du Sheet de test.
2. Interactions graphe : Cliquer sur un nœud → vérifier que le panel s'ouvre avec les bonnes informations.
3. Recherche : Taper "KPI" dans la barre → vérifier que la suggestion apparaît et qu'au clic le graphe zoome.
4. Filtres : Cliquer sur un filtre expertise → vérifier que les nœuds correspondants disparaissent/réapparaissent.
5. Responsive : Redimensionner le navigateur et vérifier le comportement.

Vérification manuelle par l'utilisateur

1. Ajouter une nouvelle ligne dans le Google Sheet, recharger la page, et vérifier que le nouveau terme apparaît dans le graphe.
2. Vérifier que les couleurs et les liens correspondent aux attentes visuelles.


