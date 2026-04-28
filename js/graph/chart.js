import * as echarts from 'echarts';
import { forceLayout } from './layout.js';

let _chart = null;
let _focusedIndex = -1;
let _isHovering = false;
let _resizeHandler = null;

export function initChart(container) {
  // Dispose existing instance to avoid the "already initialized" error on refresh
  const existing = echarts.getInstanceByDom(container);
  if (existing) existing.dispose();

  _focusedIndex = -1;
  _isHovering = false;

  _chart = echarts.init(container, null, { renderer: 'canvas' });

  if (_resizeHandler) window.removeEventListener('resize', _resizeHandler);
  _resizeHandler = () => _chart.resize();
  window.addEventListener('resize', _resizeHandler);

  return _chart;
}

export function initFocusPersistence(chart) {
  let _hoverTimer = null;

  chart.on('mouseover', (params) => {
    if (params.dataType !== 'node') return;
    _isHovering = true;
    clearTimeout(_hoverTimer);
  });

  chart.on('mouseout', (params) => {
    if (params.dataType !== 'node') return;
    _isHovering = false;
    if (_focusedIndex < 0) return;

    clearTimeout(_hoverTimer);
    _hoverTimer = setTimeout(() => {
      if (!_isHovering && _focusedIndex >= 0) {
        chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: _focusedIndex });
      }
    }, 150);
  });
}

export function renderGraph(chart, { nodes, links, categories }) {
  chart.setOption({
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 1500,
    animationEasingUpdate: 'quinticInOut',
    tooltip: {
      show: true,
      enterable: false,
      formatter(params) {
        if (params.dataType !== 'node') return null; // no tooltip on edges
        const d = params.data;
        if (d.isGhost) return `<b>${d.name}</b><br><span style="color:#94A3B8;font-style:italic">Terme non encore défini</span>`;
        const exp = d.expertises?.join(' · ') || '';
        return `<b>${d.name}</b><br><span style="color:#6B7294;font-size:12px">${exp}</span>`;
      },
      borderColor: '#E2E5F1',
      borderRadius: 8,
      backgroundColor: '#fff',
      textStyle: { color: '#1A1D2E', fontFamily: 'Inter, sans-serif', fontSize: 13 },
      padding: [8, 14],
      extraCssText: 'box-shadow:0 4px 20px rgba(0,0,0,0.10);',
    },
    legend: { show: false },
    series: [{
      type: 'graph',
      layout: 'force',
      force: forceLayout,
      data: nodes,
      links,
      categories,
      roam: true,
      draggable: true,
      scaleLimit: { min: 0.2, max: 4 },
      label: {
        show: true,
        position: 'right',
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
        color: '#374151',
        formatter: '{b}',
        distance: 4,
      },
      labelLayout: {
        hideOverlap: true,
      },
      lineStyle: {
        // color handled per-link in _cleanLinks (see app.js _buildNodeMap)
        width: 1,
        curveness: 0.2,
      },
      autoCurveness: true,
      emphasis: {
        scale: true,
        focus: 'adjacency',
        label: { fontWeight: '600', fontSize: 12 },
        lineStyle: { opacity: 0.9, width: 3 },
      },
      blur: {
        itemStyle: { opacity: 0.12 },
        label: { opacity: 0.15 },
        lineStyle: { opacity: 0.06 },
      },
    }],
  });
}

export function focusNode(chart, echartsDataIndex) {
  if (_focusedIndex >= 0) {
    chart.dispatchAction({ type: 'downplay', seriesIndex: 0, dataIndex: _focusedIndex });
  }

  _focusedIndex = echartsDataIndex;
  chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: echartsDataIndex });
  _centerOnNode(chart, echartsDataIndex);
}

export function unfocusAll(chart) {
  if (_focusedIndex >= 0) {
    chart.dispatchAction({ type: 'downplay', seriesIndex: 0, dataIndex: _focusedIndex });
    _focusedIndex = -1;
  }
}

function _centerOnNode(_chart, _dataIndex) {
  // graphRoam is not a documented ECharts action for graph series — no-op for now
}

export function updateGraphData(chart, { nodes, links }) {
  // Disable layout animation for the update so existing nodes stay in place
  // and new nodes appear at their computed positions without scattering.
  chart.setOption({ series: [{ data: nodes, links, force: { ...forceLayout, layoutAnimation: false } }] });
  // Re-enable layout animation for future user interactions
  setTimeout(() => chart.setOption({ series: [{ force: forceLayout }] }), 100);
}

export function filterByExpertises(chart, activeExpertises, allNodes, allLinks) {
  _focusedIndex = -1;

  if (activeExpertises.size === 0) {
    chart.setOption({ series: [{ data: allNodes, links: allLinks }] });
    return;
  }

  const isRealVisible = (n) =>
    !n.isGhost && (
      activeExpertises.has(n.primaryExpertise) ||
      (n.expertises?.some(e => activeExpertises.has(e)))
    );

  const visibleRealNames = new Set(allNodes.filter(isRealVisible).map(n => n.name));

  // Ghost visible only if linked to at least one visible real node
  const isGhostVisible = (ghost) =>
    allLinks.some(l =>
      (l.source === ghost.name && visibleRealNames.has(l.target)) ||
      (l.target === ghost.name && visibleRealNames.has(l.source))
    );

  const filtered = allNodes.filter(n => isRealVisible(n) || (n.isGhost && isGhostVisible(n)));
  const visibleNames = new Set(filtered.map(n => n.name));
  const filteredLinks = allLinks.filter(l => visibleNames.has(l.source) && visibleNames.has(l.target));

  chart.setOption({ series: [{ data: filtered, links: filteredLinks }] });
}

export function getChartInstance() {
  return _chart;
}
