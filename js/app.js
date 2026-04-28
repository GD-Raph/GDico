import { fetchGlossaryData } from './data/fetcher.js';
import { transformData } from './data/transformer.js';
import { initChart, renderGraph, filterByExpertises, focusNode, unfocusAll, initFocusPersistence } from './graph/chart.js';
import { initSearch, updateSearch } from './ui/search.js';
import { initFilters, updateFilterChips } from './ui/filters.js';
import { initPanel, showTerm, showPlaceholder } from './ui/panel.js';
import { initListView, updateListView, setListFilter } from './ui/list-view.js';
import { initViewToggle } from './ui/view-toggle.js';
import { showLoader, hideLoader, showError } from './ui/loader.js';
import { initTermForm, updateTermFormData } from './ui/term-form.js';
import { getExpertiseColor } from './config.js';

let _allData    = null;
let _nodeMap    = new Map();
let _cleanLinks = [];   // snapshot with string names + per-link colors, before ECharts mutates
let _chart      = null;

async function init() {
  showLoader();

  try {
    const rawData = await fetchGlossaryData();
    _allData = transformData(rawData);
    _buildNodeMap();

    _chart = initChart(document.getElementById('echarts-container'));
    renderGraph(_chart, { nodes: _allData.nodes, links: _cleanLinks, categories: _allData.categories });
    initFocusPersistence(_chart);

    const onDismiss = () => { unfocusAll(_chart); showPlaceholder(); };

    const onNodeSelect = (node, echartsIdx = null) => {
      if (node.isGhost) return;
      const idx = echartsIdx ?? getEchartsIdx(_chart, node.id);
      focusNode(_chart, idx);
      showTerm(node, onDismiss);
    };

    _chart.getZr().on('click', (e) => { if (!e.target) onDismiss(); });
    _chart.on('click', (params) => {
      if (params.dataType === 'node') onNodeSelect(params.data, params.dataIndex);
    });

    initSearch(_allData.nodes, onNodeSelect);

    initFilters(_allData.categories, (activeExpertises) => {
      filterByExpertises(_chart, activeExpertises, _allData.nodes, _cleanLinks);
      setListFilter(activeExpertises);
    });

    initPanel(
      (targetId) => { const n = _nodeMap.get(targetId); if (n) onNodeSelect(n); },
      (node)     => initTermForm(_allData, _nodeMap, node, refreshData)
    );

    initListView(_allData.nodes, _nodeMap, onNodeSelect);
    initViewToggle();
    initTermForm(_allData, _nodeMap, null, refreshData);

    hideLoader();
  } catch (error) {
    showError("Impossible de charger les données du glossaire. Veuillez vérifier votre connexion ou l'URL du Google Sheet.");
    console.error(error);
  }
}

async function refreshData() {
  sessionStorage.removeItem('gdico_data');
  sessionStorage.removeItem('gdico_timestamp');
  showLoader();

  try {
    const rawData = await fetchGlossaryData();
    _allData = transformData(rawData);
    _buildNodeMap();

    renderGraph(_chart, { nodes: _allData.nodes, links: _cleanLinks, categories: _allData.categories });
    updateSearch(_allData.nodes);
    updateFilterChips(_allData.categories);
    updateListView(_allData.nodes, _nodeMap);
    updateTermFormData(_allData, _nodeMap);
    showPlaceholder();
    unfocusAll(_chart);

    hideLoader();
  } catch (error) {
    showError("Impossible de rafraîchir les données.");
    console.error(error);
  }
}

function _buildNodeMap() {
  _nodeMap = new Map();
  _allData.nodes.forEach(n => _nodeMap.set(n.id, n));

  // Snapshot clean string links + compute per-link color BEFORE ECharts can mutate them
  _cleanLinks = _allData.links.map(l => {
    const srcNode = _nodeMap.get(l.source);
    const tgtNode = _nodeMap.get(l.target);
    const srcColor = getExpertiseColor(srcNode?.primaryExpertise);
    const tgtColor = getExpertiseColor(tgtNode?.primaryExpertise);
    return {
      source: l.source,
      target: l.target,
      // Disable hover on edges — only nodes trigger emphasis
      emphasis: { disabled: true },
      lineStyle: {
        color:   srcColor === tgtColor ? srcColor : '#94A3B8',
        opacity: 0.5,
      },
    };
  });

  // Attach link refs to source nodes for the panel "Mots liés" display
  _allData.links.forEach(l => {
    const src = _nodeMap.get(l.source);
    if (src) {
      if (!src.links) src.links = [];
      src.links.push(l);
    }
  });
}

function getEchartsIdx(chart, nodeId) {
  try {
    const data = chart.getModel().getSeriesByIndex(0).getData();
    for (let i = 0; i < data.count(); i++) {
      if (data.getRawDataItem(i)?.id === nodeId) return i;
    }
  } catch (_) {}
  return -1;
}

document.addEventListener('DOMContentLoaded', init);
