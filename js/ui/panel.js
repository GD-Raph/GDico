import { getExpertiseColor } from '../config.js';
import { sanitize } from '../utils/helpers.js';

const panelContent = document.getElementById('panel-content');

let _onNavigate = null;
let _onEdit = null;

export function initPanel(onNavigate, onEdit) {
  _onNavigate = onNavigate;
  _onEdit = onEdit;
}

export function showTerm(node, onDismiss) {
  if (node.isGhost) return;

  panelContent.innerHTML = `
    <div class="panel-header">
      <div class="panel-header-top">
        <div class="panel-category-badges">
          ${(node.expertises || [node.primaryExpertise]).map(exp => `
            <span class="panel-badge" style="--badge-color: ${getExpertiseColor(exp)}">${sanitize(exp)}</span>
          `).join('')}
        </div>
        <button class="panel-dismiss-btn" id="panel-dismiss" title="Fermer la fiche">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <h2 class="panel-title">${sanitize(node.name)}</h2>
    </div>

    <div class="panel-section">
      <h3 class="panel-section-title">Définition</h3>
      <div class="panel-definition">${sanitize(node.definition) || '<p class="empty-msg">Aucune définition disponible.</p>'}</div>
    </div>

    ${node.equivalents && node.equivalents.length > 0 ? `
      <div class="panel-section">
        <h3 class="panel-section-title">Équivalents</h3>
        <div class="panel-definition" style="color: var(--text-muted); font-style: italic">${node.equivalents.map(e => sanitize(e)).join(', ')}</div>
      </div>
    ` : ''}

    ${node.links && node.links.length > 0 ? `
      <div class="panel-section">
        <h3 class="panel-section-title">Mots liés</h3>
        <div class="panel-related-list">
          ${node.links.map(link => {
            const targetName = link.target === node.name ? link.source : link.target;
            return `<button class="related-btn" data-target="${targetName}">${sanitize(targetName)}</button>`;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <button class="panel-edit-btn" data-node="${sanitize(node.name)}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Modifier ce terme
    </button>
  `;

  document.getElementById('panel-dismiss')?.addEventListener('click', () => onDismiss?.());

  panelContent.querySelectorAll('.related-btn').forEach(btn => {
    btn.addEventListener('click', () => _onNavigate?.(btn.dataset.target));
  });

  panelContent.querySelector('.panel-edit-btn')?.addEventListener('click', () => {
    _onEdit?.(node);
  });
}

export function showPlaceholder() {
  panelContent.innerHTML = `
    <div class="panel-placeholder">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--border-medium)"><circle cx="11" cy="11" r="8"/><circle cx="11" cy="11" r="3"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <p>Cliquez sur un terme<br>pour voir sa définition</p>
    </div>
  `;
}

export function hidePanel() {
  showPlaceholder();
}
