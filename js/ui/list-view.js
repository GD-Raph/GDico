import { getExpertiseColor } from '../config.js';
import { sanitize } from '../utils/helpers.js';

const listContainer = document.getElementById('list-container');

let _onSelectNode = null;

export function initListView(nodes, nodeMap, onSelectNode) {
  _onSelectNode = onSelectNode;
  const realNodes = nodes.filter(n => !n.isGhost).sort((a, b) =>
    a.name.localeCompare(b.name, 'fr')
  );
  renderTable(realNodes, nodeMap);
}

function renderTable(initialNodes, nodeMap) {
  listContainer.innerHTML = `
    <div class="table-wrapper">
      <table class="glossary-table">
        <thead>
          <tr>
            <th class="sortable" data-col="name">Terme <span class="sort-icon">↕</span></th>
            <th class="sortable" data-col="expertise">Expertise <span class="sort-icon">↕</span></th>
            <th>Définition</th>
          </tr>
        </thead>
        <tbody id="table-body"></tbody>
      </table>
    </div>
  `;

  let sortCol = 'name';
  let sortDir = 1;
  const nodes = [...initialNodes];

  function render() {
    const data = [...nodes].sort((a, b) => {
      const av = sortCol === 'expertise' ? (a.primaryExpertise || '') : a.name;
      const bv = sortCol === 'expertise' ? (b.primaryExpertise || '') : b.name;
      return av.localeCompare(bv, 'fr') * sortDir;
    });

    document.getElementById('table-body').innerHTML = data.map(n => {
      const color = getExpertiseColor(n.primaryExpertise);
      return `<tr class="table-row" data-id="${n.id}">
        <td class="table-term">${sanitize(n.name)}</td>
        <td><span class="table-badge" style="--badge-color:${color}">${sanitize(n.primaryExpertise || '—')}</span></td>
        <td class="table-def">${truncate(n.definition, 120)}</td>
      </tr>`;
    }).join('');
  }

  render();

  listContainer.addEventListener('click', (e) => {
    const row = e.target.closest('.table-row');
    if (row) {
      const node = nodeMap.get(row.dataset.id);
      if (node) _onSelectNode?.(node);
      return;
    }
    const th = e.target.closest('th.sortable');
    if (th) {
      const col = th.dataset.col;
      if (sortCol === col) sortDir *= -1;
      else { sortCol = col; sortDir = 1; }
      render();
    }
  });
}

function truncate(str, max) {
  if (!str) return '<span class="empty-def">—</span>';
  const safe = sanitize(str);
  return safe.length > max ? safe.slice(0, max) + '…' : safe;
}
