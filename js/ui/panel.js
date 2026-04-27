import { getExpertiseColor } from '../config.js';
import { sanitize } from '../utils/helpers.js';

const panel     = document.getElementById('detail-panel');
const titleEl   = panel.querySelector('.panel-title');
const expEl     = panel.querySelector('.panel-expertises');
const defEl     = panel.querySelector('.panel-definition');
const equivEl   = panel.querySelector('.panel-equivalents');
const linksEl   = panel.querySelector('.panel-links');
const closeBtn  = panel.querySelector('.panel-close');

let _nodeMap = null;
let _onNavigate = null;

closeBtn.addEventListener('click', closePanel);

document.addEventListener('mousedown', (e) => {
  if (panel.classList.contains('open') &&
      !panel.contains(e.target) &&
      !e.target.closest('#graph-container')) {
    closePanel();
  }
});

linksEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.linked-term-btn');
  if (!btn || !_nodeMap) return;
  const termName = btn.dataset.term;
  for (const [, n] of _nodeMap) {
    if (n.name === termName && !n.isGhost) {
      openPanel(n, _nodeMap, _onNavigate);
      _onNavigate?.(n);
      return;
    }
  }
});

export function openPanel(node, nodeMap, onNavigate) {
  _nodeMap    = nodeMap;
  _onNavigate = onNavigate;

  titleEl.textContent = node.name;

  expEl.innerHTML = node.expertises.map(e =>
    `<span class="expertise-badge" style="--badge-color:${getExpertiseColor(e)}">${sanitize(e)}</span>`
  ).join('');

  defEl.innerHTML = node.definition
    ? `<p>${sanitize(node.definition)}</p>`
    : `<p class="no-def"><em>Aucune définition disponible.</em></p>`;

  if (node.equivalents?.length) {
    equivEl.innerHTML =
      `<h4 class="links-title">Aussi appelé</h4>` +
      `<div class="equiv-list">${
        node.equivalents.map(e =>
          `<span class="equiv-tag">${sanitize(e)}</span>`
        ).join('')
      }</div>`;
  } else {
    equivEl.innerHTML = '';
  }

  if (node.linkedTerms.length) {
    linksEl.innerHTML =
      `<h4 class="links-title">Termes liés</h4>` +
      `<div class="linked-terms-list">${
        node.linkedTerms.map(t =>
          `<button class="linked-term-btn" data-term="${sanitize(t)}">${sanitize(t)}</button>`
        ).join('')
      }</div>`;
  } else {
    linksEl.innerHTML = '';
  }

  panel.classList.add('open');
}

export function closePanel() {
  panel.classList.remove('open');
}
