# Glossaire Interactif GDS — Knowledge Graph

Application web légère et visuellement premium permettant à l'équipe Marketing de GDS (Groupe Dubreuil Services) de consulter un glossaire métier sous forme de Knowledge Graph interactif. Les données sont maintenues dans un Google Sheet public, modifiable sans intervention technique.

## Réponses aux remarques de l'utilisateur

### Multi-expertise visuelle
> L'utilisateur souhaite une **expertise principale** (la première listée) qui détermine la couleur du nœud, et des **expertises secondaires** affichées en badges dans le panel. Pour les termes véritablement transverses, on ajoutera une catégorie **"Marketing général"** comme expertise principale.

✅ **Approche retenue** : couleur du nœud = expertise principale. Le nœud apparaît dans les filtres de **toutes** ses expertises. Un léger contour ou indicateur visuel signale les nœuds multi-expertise.

### Volume de données (~100-300+ termes)
> 10 expertises × ~10 termes chacune = ~100 minimum, potentiellement 300.

✅ **Approche retenue** : prévoir un **mode double** :
- **Graphe interactif** (Knowledge Graph) pour l'exploration visuelle et la découverte de termes proches
- **Mode liste/tableau** pour l'accès factuel et rapide aux définitions, avec lien vers le visualisateur pour chaque terme

Les deux modes sont interconnectés : cliquer sur un terme en mode liste ouvre le graphe centré sur ce nœud.

### Nœuds fantômes
> L'utilisateur confirme les nœuds fantômes : un mot lié non défini dans le Sheet apparaît dans le graphe (avec le terme visible) mais **sans définition** et avec un style atténué (gris, bordure pointillée).

### Responsive
> Priorité au **desktop**, mais l'app doit rester utilisable sur tablette/mobile (responsive mais pas mobile-first).

### Langue
> Français uniquement, "français corporate" avec anglicismes courants. Pas de multilingue à prévoir.

### Design
> Pas de charte imposée. Style **pro mais pas terne** — couleurs vives autorisées, joie de vivre. On pourra affiner plus tard.

### Hébergement
> Site indépendant avec son propre nom de domaine. → On utilise **Vite** comme bundler pour un build optimisé déployable n'importe où.

---

## Décisions d'architecture clés

| Décision | Choix | Justification |
|----------|-------|---------------|
| Bundler | **Vite** | Hébergement indépendant → besoin d'un build optimisé, HMR en dev |
| Framework | **Vanilla JS (ES6+)** | Léger, pas de dépendance framework, maintenable |
| Graphe | **Apache ECharts 5.5+** | Force-directed natif, performant, bonne API interactions |
| Parsing CSV | **PapaParse 5.x** | Standard, robuste, stream-capable |
| Recherche | **Fuse.js 7.x** | Fuzzy search légère côté client |
| Typo | **Inter** (Google Fonts) | Moderne, lisible, pro |
| CSS | **Vanilla CSS** avec custom properties | Contrôle total, pas de dépendance build CSS |

---

## Expertises & Couleurs

| Expertise | Couleur | Hex |
|-----------|---------|-----|
| Devs (Front) | Bleu électrique | `#3B82F6` |
| Devs (Back) | Bleu marine | `#1E40AF` |
| Devs (Mobile) | Bleu ciel | `#38BDF8` |
| Data Scientists | Violet | `#8B5CF6` |
| SEA | Orange vif | `#F97316` |
| SEO | Émeraude | `#10B981` |
| Automation | Cyan | `#06B6D4` |
| Webdesign | Rose | `#EC4899` |
| Audiovisuel | Corail | `#EF4444` |
| Chef de projet / PO | Ambre | `#F59E0B` |
| Innovation | Indigo | `#6366F1` |
| Marketing général | Gris ardoise | `#64748B` |

> Couleurs extensibles dans `config.js`. Si une expertise inconnue apparaît dans le Sheet, une couleur est générée automatiquement par hash du nom.

---

## Architecture de fichiers

```
GPTW-Glossaire/
├── index.html                     # Point d'entrée HTML
├── vite.config.js                 # Config Vite
├── package.json
├── css/
│   ├── variables.css              # Design tokens
│   ├── base.css                   # Reset + styles globaux
│   ├── layout.css                 # Grid principale
│   └── components/
│       ├── search.css             # Barre de recherche
│       ├── filters.css            # Chips filtres expertise
│       ├── panel.css              # Panel latéral détail
│       ├── tooltip.css            # Tooltip survol
│       ├── loader.css             # Écran de chargement
│       └── list-view.css          # Mode liste/tableau
├── js/
│   ├── app.js                     # Orchestration principale
│   ├── config.js                  # URL Sheet, couleurs, params ECharts
│   ├── data/
│   │   ├── fetcher.js             # Fetch CSV + PapaParse + cache
│   │   └── transformer.js         # CSV → { nodes, links, categories }
│   ├── graph/
│   │   ├── chart.js               # Init ECharts + config
│   │   ├── interactions.js        # Click, hover, zoom, highlight
│   │   └── layout.js              # Paramètres force layout
│   ├── ui/
│   │   ├── search.js              # Recherche fuzzy Fuse.js
│   │   ├── filters.js             # Filtres par expertise
│   │   ├── panel.js               # Panel latéral slide-in
│   │   ├── list-view.js           # Mode liste/tableau factuel
│   │   ├── view-toggle.js         # Bascule graphe ↔ liste
│   │   └── loader.js              # Écran de chargement
│   └── utils/
│       └── helpers.js             # Debounce, sanitize, hash couleur
└── public/
    └── favicon.svg                # Favicon
```

---

## Proposed Changes

### Data Layer

#### [NEW] [config.js](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/js/config.js)
Constantes centralisées : URL du Google Sheet, mapping expertises → couleurs, paramètres ECharts (répulsion, gravité, longueur arêtes), TTL du cache sessionStorage.

#### [NEW] [fetcher.js](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/js/data/fetcher.js)
Fetch CSV depuis Google Sheets via `export?format=csv`. Parse avec PapaParse. Cache en `sessionStorage` avec TTL 5 min. Affiche un message clair si le Sheet est inaccessible.

#### [NEW] [transformer.js](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/js/data/transformer.js)
Transforme le CSV parsé en `{ nodes[], links[], categories[] }` pour ECharts :
- Crée un nœud par terme (id normalisé, name original, taille, catégorie principale, toutes catégories, définition)
- Crée les liens depuis "Mots Liés" (dédupliqués)
- Génère des **nœuds fantômes** pour les mots liés non définis (terme visible, pas de définition, flag `isGhost: true`)
- Extrait la liste unique des catégories pour la légende

---

### Graph Engine

#### [NEW] [chart.js](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/js/graph/chart.js)
Init du graphe ECharts force-directed. Config : `repulsion: 300-500`, `gravity: 0.1`, `edgeLength: [80, 200]`, nœuds circulaires avec taille proportionnelle, liens semi-transparents avec courbure légère, animation fluide (1500ms, quinticInOut).

#### [NEW] [interactions.js](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/js/graph/interactions.js)
Événements : hover → tooltip natif ECharts, clic → panel latéral + highlight nœud + voisins (autres semi-transparents), zoom animé depuis recherche, double-clic → reset zoom.

#### [NEW] [layout.js](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/js/graph/layout.js)
Paramètres physiques du force layout, exportés pour `chart.js`.

---

### UI Components

#### [NEW] [search.js](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/js/ui/search.js)
Barre de recherche fuzzy (Fuse.js) sur Terme + Définition. Dropdown suggestions (debounce 200ms). Au clic : ferme dropdown → anime le graphe pour centrer → highlight → ouvre panel.

#### [NEW] [filters.js](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/js/ui/filters.js)
Chips colorées par expertise. Toggle on/off individuel. Bouton "Tous" pour reset. Filtre le graphe via `setOption` dynamique.

#### [NEW] [panel.js](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/js/ui/panel.js)
Panel latéral slide-in (droite). Affiche : titre, badges expertise colorés, définition complète, mots liés cliquables (naviguent vers le nœud). Bouton ×, fermeture au clic extérieur.

#### [NEW] [list-view.js](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/js/ui/list-view.js)
Mode liste/tableau factuel : tableau triable/filtrable de tous les termes avec colonnes Terme, Expertise, Définition (tronquée). Clic sur un terme → bascule vers le graphe centré sur ce nœud.

#### [NEW] [view-toggle.js](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/js/ui/view-toggle.js)
Bouton de bascule Graphe ↔ Liste. Gère la visibilité des deux vues et la synchronisation de l'état sélectionné.

#### [NEW] [loader.js](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/js/ui/loader.js)
Écran de chargement élégant (animation pulse/spinner + "Chargement du glossaire..."). Fondu de sortie après init du graphe.

---

### Styles

#### [NEW] [variables.css](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/css/variables.css)
Design tokens : `--bg-primary: #F8F9FC`, `--bg-surface: #FFFFFF`, `--text-primary: #1A1D2E`, `--text-secondary: #6B7294`, `--border: #E2E5F1`, `--accent: #6366F1`, plus couleurs par expertise.

#### [NEW] [base.css](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/css/base.css)
Reset CSS, styles globaux, import Google Fonts (Inter).

#### [NEW] [layout.css](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/css/layout.css)
Grid principale : zone graphe (pleine largeur/hauteur) + zone panel latéral. Responsive : panel en overlay sur petit écran.

#### [NEW] CSS components
Un fichier par composant : `search.css`, `filters.css`, `panel.css`, `tooltip.css`, `loader.css`, `list-view.css`.

---

### Entry Point

#### [NEW] [index.html](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/index.html)
HTML sémantique :
- `<header>` : titre + recherche + filtres + toggle vue
- `<main>` : conteneur ECharts (graphe) + conteneur liste (caché par défaut)
- `<aside>` : panel latéral (caché par défaut)
- `<div id="loader">` : écran de chargement

#### [NEW] [vite.config.js](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/vite.config.js)
Configuration Vite minimale pour servir le projet en dev et builder en production.

#### [NEW] [package.json](file:///Users/miller.raphael/Documents/_Projets/GPTW-Glossaire/package.json)
Dépendances : `echarts`, `papaparse`, `fuse.js`. Dev : `vite`.

---

## Design — Direction artistique

### Palette (light mode)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--bg-primary` | `#F8F9FC` | Fond de page |
| `--bg-surface` | `#FFFFFF` | Panel, cards |
| `--text-primary` | `#1A1D2E` | Texte principal |
| `--text-secondary` | `#6B7294` | Texte secondaire |
| `--border` | `#E2E5F1` | Bordures subtiles |
| `--accent` | `#6366F1` | Accent interactif (indigo) |

### Typographie
- **Titres** : Inter Bold
- **Corps** : Inter Regular

### Animations / Micro-interactions
- Panel slide-in : `transform: translateX()` + `transition: 0.3s ease-out`
- Nœuds hover : scale-up (1.15×) + ombre
- Recherche suggestions : fade-in (0.15s)
- Filtres toggle : couleur → gris avec transition
- Graphe : animation fluide continue via ECharts
- Transition graphe ↔ liste : crossfade (0.3s)

### Nœuds fantômes (mots liés non définis)
- Couleur gris clair (`#CBD5E1`)
- Bordure pointillée
- Taille réduite
- Le terme est affiché sur le nœud
- Au clic : tooltip "Terme non encore défini" (pas de panel complet)

---

## Verification Plan

### Tests dans le navigateur (browser subagent)

1. **Chargement des données** : ouvrir `http://localhost:5173`, vérifier que le loader s'affiche puis disparaît, et que le graphe contient les nœuds du Sheet de test
2. **Interactions graphe** : cliquer sur un nœud → vérifier que le panel s'ouvre avec les bonnes informations (terme, définition, expertises, mots liés)
3. **Nœuds fantômes** : vérifier qu'un mot lié non défini apparaît en gris avec bordure pointillée et affiche le terme
4. **Recherche** : taper un terme → vérifier dropdown de suggestions → cliquer → le graphe zoome et le panel s'ouvre
5. **Filtres** : cliquer sur un filtre expertise → vérifier que les nœuds correspondants sont masqués/affichés
6. **Mode liste** : basculer en vue liste → vérifier le tableau avec tous les termes → cliquer un terme → retour au graphe centré
7. **Responsive** : redimensionner le navigateur → vérifier que le layout s'adapte (panel en overlay, graphe redimensionné)

### Vérification manuelle par l'utilisateur

1. Ajouter une nouvelle ligne dans le Google Sheet, recharger la page, vérifier que le nouveau terme apparaît
2. Vérifier que les couleurs et liens correspondent aux attentes visuelles
3. Valider le rendu sur son navigateur / écran cible
