import { fetchGlossaryData } from './data/fetcher.js';
import { transformData } from './data/transformer.js';
import { initChart, renderGraph, filterByExpertises, focusNode, unfocusAll, initFocusPersistence } from './graph/chart.js';
import { initSearch } from './ui/search.js';
import { initFilters } from './ui/filters.js';
import { initPanel, showTerm, showPlaceholder } from './ui/panel.js';
import { initListView, setListFilter } from './ui/list-view.js';
import { initViewToggle } from './ui/view-toggle.js';
import { showLoader, hideLoader, showError } from './ui/loader.js';
import { initTermForm } from './ui/term-form.js';

let _allData = null;
let _nodeMap = new Map();

async function init() {
  showLoader();

  try {
    const rawData = await fetchGlossaryData();
    _allData = transformData(rawData);

    _allData.nodes.forEach(n => _nodeMap.set(n.id, n));

    _allData.links.forEach(l => {
      const sourceNode = _nodeMap.get(l.source);
      if (sourceNode) {
        if (!sourceNode.links) sourceNode.links = [];
        sourceNode.links.push(l);
      }
    });

    const chart = initChart(document.getElementById('echarts-container'));
    renderGraph(chart, _allData);
    initFocusPersistence(chart);

    const onDismiss = () => {
      unfocusAll(chart);
      showPlaceholder();
    };

    const onNodeSelect = (node, echartsIdx = null) => {
      if (node.isGhost) return;
      const idx = echartsIdx ?? getEchartsIdx(chart, node.id);
      focusNode(chart, idx);
      showTerm(node, onDismiss);
    };

    // Click on graph background → dismiss
    chart.getZr().on('click', (e) => {
      if (!e.target) onDismiss();
    });

    initSearch(_allData.nodes, onNodeSelect);

    initFilters(_allData.categories, (activeExpertises) => {
      filterByExpertises(chart, activeExpertises, _allData.nodes, _allData.links);
      setListFilter(activeExpertises);
    });

    initPanel(
      (targetId) => {
        const targetNode = _nodeMap.get(targetId);
        if (targetNode) onNodeSelect(targetNode);
      },
      (node) => initTermForm(_allData, _nodeMap, node, onRefresh)
    );

    initListView(_allData.nodes, _nodeMap, onNodeSelect);
    initViewToggle();

    chart.on('click', (params) => {
      if (params.dataType === 'node') {
        onNodeSelect(params.data, params.dataIndex);
      }
    });

    initTermForm(_allData, _nodeMap, null, onRefresh);

    hideLoader();
  } catch (error) {
    showError("Impossible de charger les données du glossaire. Veuillez vérifier votre connexion ou l'URL du Google Sheet.");
    console.error(error);
  }
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

async function onRefresh() {
  sessionStorage.removeItem('gdico_data');
  sessionStorage.removeItem('gdico_timestamp');
  await init();
}

document.addEventListener('DOMContentLoaded', init);
