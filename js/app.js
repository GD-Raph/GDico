import { fetchGlossaryData } from './data/fetcher.js';
import { transformData } from './data/transformer.js';
import { initChart, renderGraph, filterByExpertises, getChartInstance } from './graph/chart.js';
import { initSearch } from './ui/search.js';
import { initFilters } from './ui/filters.js';
import { initPanel, showTerm, hidePanel } from './ui/panel.js';
import { initListView } from './ui/list-view.js';
import { initViewToggle, setView } from './ui/view-toggle.js';
import { showLoader, hideLoader, showError } from './ui/loader.js';

let _allData = null;
let _nodeMap = new Map();

async function init() {
  showLoader();
  
  try {
    const rawData = await fetchGlossaryData();
    _allData = transformData(rawData);
    
    // Create node map for fast lookup
    _allData.nodes.forEach(n => _nodeMap.set(n.id, n));
    
    // Map link strings to node objects for ECharts
    _allData.links.forEach(l => {
      const sourceNode = _nodeMap.get(l.source);
      if (sourceNode) {
        if (!sourceNode.links) sourceNode.links = [];
        sourceNode.links.push(l);
      }
    });

    const chart = initChart(document.getElementById('echarts-container'));
    renderGraph(chart, _allData);

    const onNodeSelect = (node) => {
      if (node.isGhost) return;
      
      // Navigate to node in graph if we're in list mode
      setView('graph');
      
      // Center and highlight
      chart.dispatchAction({
        type: 'focusNodeAdjacency',
        seriesIndex: 0,
        dataIndex: _allData.nodes.indexOf(node)
      });

      // Show panel
      showTerm(node);
    };

    initSearch(_allData.nodes, onNodeSelect);
    initFilters(_allData.categories, (activeExpertises) => {
      filterByExpertises(chart, activeExpertises, _allData.nodes, _allData.links);
    });
    initPanel((targetId) => {
      const targetNode = _nodeMap.get(targetId);
      if (targetNode) onNodeSelect(targetNode);
    });
    initListView(_allData.nodes, _nodeMap, onNodeSelect);
    initViewToggle();

    chart.on('click', (params) => {
      if (params.dataType === 'node') {
        onNodeSelect(params.data);
      }
    });

    hideLoader();
  } catch (error) {
    showError("Impossible de charger les données du glossaire. Veuillez vérifier votre connexion ou l'URL du Google Sheet.");
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', init);
