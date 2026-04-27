import { fetchData }       from './data/fetcher.js';
import { transform }       from './data/transformer.js';
import { initChart, renderGraph } from './graph/chart.js';
import { bindGraphEvents, focusNode, unfocusAll } from './graph/interactions.js';
import { initSearch }      from './ui/search.js';
import { initFilters }     from './ui/filters.js';
import { initListView }    from './ui/list-view.js';
import { initViewToggle, switchToGraph } from './ui/view-toggle.js';
import { openPanel, closePanel } from './ui/panel.js';
import { hideLoader }      from './ui/loader.js';

async function boot() {
  const graphEl = document.getElementById('graph-container');
  const chart   = initChart(graphEl);
  initViewToggle(chart);

  let rows;
  try {
    rows = await fetchData();
  } catch (err) {
    document.getElementById('loader').innerHTML =
      `<div class="loader-error">
        <p>⚠️ ${err.message}</p>
        <button onclick="location.reload()">Réessayer</button>
      </div>`;
    return;
  }

  const { nodes, links, categories, nodeMap } = transform(rows);

  renderGraph(chart, { nodes, links, categories });

  function handleNodeSelect(node) {
    openPanel(node, nodeMap, (target) => {
      focusNode(chart, target.name);
    });
    focusNode(chart, node.name);
  }

  bindGraphEvents(chart, nodeMap, handleNodeSelect);

  initSearch(nodes, nodeMap, (node) => {
    switchToGraph();
    handleNodeSelect(node);
  });

  initFilters(categories, nodes, links, chart);

  initListView(nodes, nodeMap, (node) => {
    switchToGraph();
    setTimeout(() => handleNodeSelect(node), 300);
  });

  hideLoader();
}

boot();
