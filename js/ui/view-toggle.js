const graphContainer = document.getElementById('graph-container');
const listContainer  = document.getElementById('list-container');
const btnGraph       = document.getElementById('btn-graph');
const btnList        = document.getElementById('btn-list');
const filtersBar     = document.getElementById('filters-bar');

let _chart = null;

export function initViewToggle(chart) {
  _chart = chart;
  btnGraph.addEventListener('click', switchToGraph);
  btnList.addEventListener('click',  switchToList);
}

export function switchToGraph() {
  graphContainer.classList.remove('hidden');
  listContainer.classList.add('hidden');
  filtersBar.classList.remove('hidden');
  btnGraph.classList.add('active');
  btnList.classList.remove('active');
  // Give ECharts a tick to remeasure after container becomes visible
  requestAnimationFrame(() => _chart?.resize());
}

export function switchToList() {
  listContainer.classList.remove('hidden');
  graphContainer.classList.add('hidden');
  filtersBar.classList.add('hidden');
  btnList.classList.add('active');
  btnGraph.classList.remove('active');
}
