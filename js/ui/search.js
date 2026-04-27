import Fuse from 'fuse.js';

let _fuse = null;
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

export function initSearch(nodes, onSelect) {
  const searchableNodes = nodes.filter(n => !n.isGhost);
  _fuse = new Fuse(searchableNodes, {
    keys: ['name', 'definition'],
    threshold: 0.3,
  });

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (!query) {
      searchResults.classList.remove('active');
      return;
    }

    const results = _fuse.search(query).slice(0, 8);
    renderResults(results, onSelect);
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
    searchResults.innerHTML = results.map(r => `
      <div class="search-item" data-id="${r.item.id}">
        <span class="search-item-name">${r.item.name}</span>
        <span class="search-item-cat">${r.item.primaryExpertise || ''}</span>
      </div>
    `).join('');
  }

  searchResults.classList.add('active');

  searchResults.querySelectorAll('.search-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      const node = results.find(r => r.item.id === id)?.item;
      if (node) {
        onSelect(node);
        searchInput.value = '';
        searchResults.classList.remove('active');
      }
    });
  });
}
