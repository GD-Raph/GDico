import Fuse from 'fuse.js';

const FUSE_OPTIONS = {
  keys: [
    { name: 'name',        weight: 0.7 },
    { name: 'equivalents', weight: 0.6 },
    { name: 'definition',  weight: 0.2 },
  ],
  threshold: 0.35,
  includeMatches: true,
};

let _fuse = null;
const searchInput   = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

export function updateSearch(nodes) {
  _fuse = new Fuse(nodes.filter(n => !n.isGhost), FUSE_OPTIONS);
}

export function initSearch(nodes, onSelect) {
  _fuse = new Fuse(nodes.filter(n => !n.isGhost), FUSE_OPTIONS);

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (!query) { searchResults.classList.remove('active'); return; }
    renderResults(_fuse.search(query).slice(0, 8), onSelect);
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.remove('active');
    }
  });
}

function renderResults(results, onSelect) {
  if (results.length === 0) {
    searchResults.innerHTML = '<div class="search-no-result">Aucun résultat</div>';
  } else {
    searchResults.innerHTML = results.map(r => {
      const equivMatch = r.matches?.find(m => m.key === 'equivalents');
      const equivHint  = equivMatch
        ? `<span class="search-item-equiv">≡ ${r.item.equivalents[equivMatch.refIndex]}</span>`
        : '';
      return `
        <div class="search-item" data-id="${r.item.id}">
          <span class="search-item-name">${r.item.name}</span>
          ${equivHint}
          <span class="search-item-cat">${r.item.primaryExpertise || ''}</span>
        </div>`;
    }).join('');
  }

  searchResults.classList.add('active');

  searchResults.querySelectorAll('.search-item').forEach(item => {
    item.addEventListener('click', () => {
      const node = results.find(r => r.item.id === item.dataset.id)?.item;
      if (node) { onSelect(node); searchInput.value = ''; searchResults.classList.remove('active'); }
    });
  });
}
