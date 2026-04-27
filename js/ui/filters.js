import { getExpertiseColor } from '../config.js';
import { filterByExpertises } from '../graph/chart.js';

const container = document.getElementById('filters-container');
const activeSet = new Set();

let _chart          = null;
let _allNodes       = [];
let _allLinks       = [];
let _onFilterChange = null;

export function initFilters(categories, nodes, links, chart, onFilterChange) {
  _chart          = chart;
  _allNodes       = nodes;
  _allLinks       = links;
  _onFilterChange = onFilterChange;

  container.innerHTML = '';

  const allBtn = makeChip('Tous', null, true);
  allBtn.addEventListener('click', () => {
    activeSet.clear();
    refreshChips();
    filterByExpertises(chart, activeSet, _allNodes, _allLinks);
    _onFilterChange?.(activeSet);
  });
  container.appendChild(allBtn);

  categories.forEach(({ name }) => {
    const chip = makeChip(name, getExpertiseColor(name), false);
    chip.addEventListener('click', () => {
      activeSet.has(name) ? activeSet.delete(name) : activeSet.add(name);
      refreshChips();
      filterByExpertises(chart, activeSet, _allNodes, _allLinks);
      _onFilterChange?.(activeSet);
    });
    container.appendChild(chip);
  });
}

function makeChip(label, color, active) {
  const btn = document.createElement('button');
  btn.className = 'filter-chip' + (active ? ' active' : '');
  btn.dataset.label = label;
  btn.textContent = label;
  if (color) {
    btn.style.setProperty('--chip-color', color);
    btn.style.setProperty('--chip-color-dim', color + '22');
  }
  return btn;
}

function refreshChips() {
  container.querySelectorAll('.filter-chip').forEach(chip => {
    if (chip.dataset.label === 'Tous') {
      chip.classList.toggle('active', activeSet.size === 0);
    } else {
      chip.classList.toggle('active', activeSet.has(chip.dataset.label));
    }
  });
}
