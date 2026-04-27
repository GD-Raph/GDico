const filtersContainer = document.getElementById('filters-container');
let _onFilterChange = null;
let _activeExpertises = new Set();

export function initFilters(categories, onFilterChange) {
  _onFilterChange = onFilterChange;
  
  const cats = categories
    .map(c => c.name)
    .filter(name => name !== 'Fantôme')
    .sort((a, b) => a.localeCompare(b, 'fr'));

  renderFilters(cats);
}

function renderFilters(categories) {
  filtersContainer.innerHTML = `
    <button class="filter-chip active" data-type="all">Tous</button>
    ${categories.map(cat => `
      <button class="filter-chip" data-cat="${cat}">${cat}</button>
    `).join('')}
  `;

  filtersContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;

    if (btn.dataset.type === 'all') {
      _activeExpertises.clear();
      filtersContainer.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    } else {
      const cat = btn.dataset.cat;
      filtersContainer.querySelector('[data-type="all"]').classList.remove('active');
      
      if (_activeExpertises.has(cat)) {
        _activeExpertises.delete(cat);
        btn.classList.remove('active');
      } else {
        _activeExpertises.add(cat);
        btn.classList.add('active');
      }

      if (_activeExpertises.size === 0) {
        filtersContainer.querySelector('[data-type="all"]').classList.add('active');
      }
    }

    _onFilterChange?.(_activeExpertises);
  });
}
