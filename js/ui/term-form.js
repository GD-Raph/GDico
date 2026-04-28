import Fuse from 'fuse.js';
import { getExpertiseColor } from '../config.js';
import { sanitize } from '../utils/helpers.js';
import { SHEET_WRITE_URL } from '../config.js';

const overlay   = document.getElementById('term-form-overlay');
const dialog    = document.getElementById('term-form-dialog');
const formTitle = document.getElementById('form-title');
const form      = document.getElementById('term-form');
const closeBtn  = document.getElementById('form-close');
const cancelBtn = document.getElementById('form-cancel');
const deleteBtn = document.getElementById('form-delete');
const submitBtn = document.getElementById('form-submit');
const addBtn    = document.getElementById('add-term-btn');

const nameInput       = document.getElementById('form-name');
const definitionInput = document.getElementById('form-definition');
const equivalentsInput= document.getElementById('form-equivalents');
const linkedInput     = document.getElementById('form-linked');
const sizeInput       = document.getElementById('form-size');
const expertisesEl    = document.getElementById('form-expertises');
const nameSuggestions = document.getElementById('form-name-suggestions');
const similarWarning  = document.getElementById('form-similar-warning');
const linkedSuggestions = document.getElementById('form-linked-suggestions');

let _allData   = null;
let _nodeMap   = null;
let _editNode  = null;
let _onRefresh = null;
let _fuse      = null;
let _selectedExpertises = new Set();
let _allCategories = [];

export function updateTermFormData(allData, nodeMap) {
  _allData = allData;
  _nodeMap = nodeMap;
  _fuse = new Fuse(allData.nodes.filter(n => !n.isGhost), {
    keys: [
      { name: 'name',        weight: 0.8 },
      { name: 'equivalents', weight: 0.5 },
    ],
    threshold: 0.3,
  });
  _allCategories = allData.categories
    .map(c => c.name)
    .filter(n => n !== 'Fantôme')
    .sort((a, b) => a.localeCompare(b, 'fr'));
}

export function initTermForm(allData, nodeMap, editNode, onRefresh) {
  _allData   = allData;
  _nodeMap   = nodeMap;
  _onRefresh = onRefresh;
  _allCategories = allData.categories
    .map(c => c.name)
    .filter(n => n !== 'Fantôme')
    .sort((a, b) => a.localeCompare(b, 'fr'));

  _fuse = new Fuse(allData.nodes.filter(n => !n.isGhost), {
    keys: [
      { name: 'name',        weight: 0.8 },
      { name: 'equivalents', weight: 0.5 },
    ],
    threshold: 0.3,
  });

  // Only wire up listeners once (first call without editNode)
  if (!editNode) {
    addBtn.addEventListener('click', () => openForm(null));
    closeBtn.addEventListener('click', closeForm);
    cancelBtn.addEventListener('click', closeForm);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeForm(); });
    form.addEventListener('submit', handleSubmit);
    deleteBtn.addEventListener('click', handleDelete);

    nameInput.addEventListener('input', handleNameInput);
    linkedInput.addEventListener('input', handleLinkedInput);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeForm();
    });
  } else {
    // Called from panel "Modifier" button
    openForm(editNode);
  }
}

function openForm(node) {
  _editNode = node;
  _selectedExpertises = new Set(node?.expertises || []);

  formTitle.textContent = node ? `Modifier : ${node.name}` : 'Ajouter un terme';
  deleteBtn.classList.toggle('hidden', !node);

  nameInput.value        = node?.name        || '';
  definitionInput.value  = node?.definition  || '';
  equivalentsInput.value = (node?.equivalents || []).join(', ');
  linkedInput.value      = (node?.links || []).map(l => l.target === node?.name ? l.source : l.target).join(', ');
  sizeInput.value        = node?.value       || '';

  renderExpertiseChips();
  hideSuggestions();

  overlay.classList.remove('hidden');
  nameInput.focus();
}

function closeForm() {
  overlay.classList.add('hidden');
  form.reset();
  _editNode = null;
  _selectedExpertises = new Set();
  hideSuggestions();
}

function renderExpertiseChips() {
  expertisesEl.innerHTML = _allCategories.map(cat => {
    const active = _selectedExpertises.has(cat);
    const color = getExpertiseColor(cat);
    return `<button type="button" class="expertise-chip ${active ? 'active' : ''}"
      data-cat="${cat}"
      style="${active ? `--chip-color:${color}` : ''}">
      ${sanitize(cat)}
    </button>`;
  }).join('');

  expertisesEl.querySelectorAll('.expertise-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      if (_selectedExpertises.has(cat)) {
        _selectedExpertises.delete(cat);
        btn.classList.remove('active');
        btn.style.removeProperty('--chip-color');
      } else {
        _selectedExpertises.add(cat);
        btn.classList.add('active');
        btn.style.setProperty('--chip-color', getExpertiseColor(cat));
      }
    });
  });
}

function handleNameInput() {
  const query = nameInput.value.trim();
  if (!query || query.length < 2) {
    hideSuggestions();
    return;
  }

  const results = _fuse.search(query).slice(0, 5);

  if (results.length === 0) {
    hideSuggestions();
    return;
  }

  // Exact match check
  const exactMatch = results.find(r => r.item.name.toLowerCase() === query.toLowerCase());
  if (exactMatch) {
    nameSuggestions.classList.add('hidden');
    similarWarning.innerHTML = `
      <strong>${sanitize(exactMatch.item.name)}</strong> existe déjà.
      <button type="button" class="link-btn" id="switch-to-edit">Modifier ce terme →</button>
    `;
    similarWarning.classList.remove('hidden');
    document.getElementById('switch-to-edit')?.addEventListener('click', () => {
      openForm(exactMatch.item);
    });
    return;
  }

  similarWarning.classList.add('hidden');
  nameSuggestions.innerHTML = results.map(r => `
    <div class="suggestion-item" data-id="${r.item.id}">
      <span class="suggestion-label">Terme similaire :</span>
      <strong>${sanitize(r.item.name)}</strong>
      <button type="button" class="link-btn">Modifier →</button>
    </div>
  `).join('');
  nameSuggestions.classList.remove('hidden');

  nameSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const node = _nodeMap.get(item.dataset.id);
      if (node) openForm(node);
    });
  });
}

function handleLinkedInput() {
  const parts  = linkedInput.value.split(',');
  const lastPart = parts[parts.length - 1].trim();

  if (!lastPart || lastPart.length < 2) {
    linkedSuggestions.classList.add('hidden');
    return;
  }

  const fuse = new Fuse(_allData.nodes.filter(n => !n.isGhost), {
    keys: ['name'],
    threshold: 0.3,
  });
  const results = fuse.search(lastPart).slice(0, 5);

  if (results.length === 0) {
    linkedSuggestions.classList.add('hidden');
    return;
  }

  linkedSuggestions.innerHTML = results.map(r => `
    <div class="suggestion-item" data-name="${r.item.name}">${sanitize(r.item.name)}</div>
  `).join('');
  linkedSuggestions.classList.remove('hidden');

  linkedSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      parts[parts.length - 1] = item.dataset.name;
      linkedInput.value = parts.join(', ') + ', ';
      linkedSuggestions.classList.add('hidden');
      linkedInput.focus();
    });
  });
}

function hideSuggestions() {
  nameSuggestions.classList.add('hidden');
  similarWarning.classList.add('hidden');
  linkedSuggestions.classList.add('hidden');
}

async function handleSubmit(e) {
  e.preventDefault();

  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    nameInput.classList.add('form-input--error');
    return;
  }
  nameInput.classList.remove('form-input--error');

  const payload = {
    action: _editNode ? 'update' : 'create',
    originalName: _editNode?.name || null,
    data: {
      Terme:       name,
      Définition:  definitionInput.value.trim(),
      Expertise:   Array.from(_selectedExpertises).join(', '),
      Equivalent:  equivalentsInput.value.trim(),
      'Mots Liés': linkedInput.value.split(',').map(s => s.trim()).filter(Boolean).join(', '),
      Taille:      sizeInput.value.trim(),
    },
  };

  await submitToSheet(payload);
}

async function handleDelete() {
  if (!_editNode) return;
  if (!confirm(`Supprimer le terme « ${_editNode.name} » ?`)) return;

  await submitToSheet({ action: 'delete', originalName: _editNode.name, data: {} });
}

async function submitToSheet(payload) {
  if (!SHEET_WRITE_URL) {
    alert('⚠️ URL de mise à jour non configurée (SHEET_WRITE_URL dans config.js).\nContactez l\'administrateur.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enregistrement…';

  try {
    const apiKey = import.meta.env.VITE_API_KEY || '';
    const res = await fetch(SHEET_WRITE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    closeForm();
    await _onRefresh?.();
  } catch (err) {
    alert(`Erreur lors de l'enregistrement : ${err.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enregistrer';
  }
}
