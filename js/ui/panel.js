import { getExpertiseColor } from '../config.js';
import { sanitize } from '../utils/helpers.js';

const panel = document.getElementById('side-panel');
const panelContent = document.getElementById('panel-content');
const closeBtn = document.getElementById('panel-close');

let _onNavigate = null;

export function initPanel(onNavigate) {
  _onNavigate = onNavigate;
  closeBtn.addEventListener('click', hidePanel);
  
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('active') && !panel.contains(e.target) && !e.target.closest('.echarts-container') && !e.target.closest('.table-row')) {
      // hidePanel(); // Temporarily disabled to avoid accidental closing when clicking graph nodes
    }
  });
}

export function showTerm(node) {
  if (node.isGhost) return;

  const color = getExpertiseColor(node.primaryExpertise);
  
  panelContent.innerHTML = `
    <div class="panel-header">
      <div class="panel-category-badges">
        ${(node.expertises || [node.primaryExpertise]).map(exp => `
          <span class="panel-badge" style="--badge-color: ${getExpertiseColor(exp)}">${sanitize(exp)}</span>
        `).join('')}
      </div>
      <h2 class="panel-title">${sanitize(node.name)}</h2>
    </div>
    
    <div class="panel-section">
      <h3 class="panel-section-title">Définition</h3>
      <div class="panel-definition">${sanitize(node.definition) || '<p class="empty-msg">Aucune définition disponible.</p>'}</div>
    </div>

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
  `;

  panel.classList.add('active');

  panelContent.querySelectorAll('.related-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _onNavigate?.(btn.dataset.target);
    });
  });
}

export function hidePanel() {
  panel.classList.remove('active');
}
