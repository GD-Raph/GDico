const filterChips = document.getElementById('filter-chips');
let _onFilterChange = null;
let _activeExpertises = new Set();

export function initFilters(categories, onFilterChange) {
  _onFilterChange = onFilterChange;
  const cats = _sortCats(categories);
  renderFilters(cats);
}

export function updateFilterChips(categories) {
  _activeExpertises.clear();
  const cats = _sortCats(categories);
  filterChips.innerHTML = `
    <button class="filter-chip active" data-type="all">Tous</button>
    ${cats.map(cat => `<button class="filter-chip" data-cat="${cat}">${cat}</button>`).join('')}
  `;
}

function _sortCats(categories) {
  return categories
    .map(c => c.name)
    .filter(name => name !== 'Fantôme')
    .sort((a, b) => a.localeCompare(b, 'fr'));
}

function renderFilters(categories) {
  filterChips.innerHTML = `
    <button class="filter-chip active" data-type="all">Tous</button>
    ${categories.map(cat => `
      <button class="filter-chip" data-cat="${cat}">${cat}</button>
    `).join('')}
  `;

  filterChips.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;

    if (btn.dataset.type === 'all') {
      _activeExpertises.clear();
      filterChips.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    } else {
      const cat = btn.dataset.cat;
      filterChips.querySelector('[data-type="all"]').classList.remove('active');

      if (_activeExpertises.has(cat)) {
        _activeExpertises.delete(cat);
        btn.classList.remove('active');
      } else {
        _activeExpertises.add(cat);
        btn.classList.add('active');
      }

      if (_activeExpertises.size === 0) {
        filterChips.querySelector('[data-type="all"]').classList.add('active');
      }
    }

    _onFilterChange?.(_activeExpertises);
  });
}
