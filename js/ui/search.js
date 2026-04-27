import Fuse from 'fuse.js';
import { debounce } from '../utils/helpers.js';
import { getExpertiseColor } from '../config.js';

const input    = document.getElementById('search-input');
const dropdown = document.getElementById('search-dropdown');

let fuse      = null;
let _nodeMap  = null;
let _onSelect = null;

export function initSearch(nodes, nodeMap, onSelect) {
  _nodeMap  = nodeMap;
  _onSelect = onSelect;

  fuse = new Fuse(nodes.filter(n => !n.isGhost), {
    keys: [
      { name: 'name',       weight: 0.7 },
      { name: 'definition', weight: 0.3 },
    ],
    threshold: 0.35,
    includeScore: true,
  });

  input.addEventListener('input', debounce(handleInput, 200));
  input.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) hideDropdown();
  });
}

function handleInput() {
  const q = input.value.trim();
  if (q.length < 2) { hideDropdown(); return; }

  const results = fuse.search(q).slice(0, 8);
  if (!results.length) { hideDropdown(); return; }

  dropdown.innerHTML = results.map(r => {
    const color = getExpertiseColor(r.item.primaryExpertise);
    return `<li class="search-item" data-id="${r.item.id}" role="option">
      <span class="search-item-dot" style="background:${color}"></span>
      <span class="search-item-name">${r.item.name}</span>
      <span class="search-item-exp" style="color:${color}">${r.item.primaryExpertise || ''}</span>
    </li>`;
  }).join('');

  dropdown.classList.add('open');
}

function handleKeydown(e) {
  if (e.key === 'Escape') { hideDropdown(); input.blur(); return; }
  if (e.key === 'Enter') {
    const first = dropdown.querySelector('.search-item');
    if (first) selectById(first.dataset.id);
  }
  if (e.key === 'ArrowDown') {
    const first = dropdown.querySelector('.search-item');
    first?.focus();
  }
}

dropdown.addEventListener('click', (e) => {
  const item = e.target.closest('.search-item');
  if (item) selectById(item.dataset.id);
});

function selectById(id) {
  hideDropdown();
  input.value = '';
  if (!_nodeMap || !_onSelect) return;
  const node = _nodeMap.get(id);
  if (node) _onSelect(node);
}

function hideDropdown() {
  dropdown.classList.remove('open');
  dropdown.innerHTML = '';
}
