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
        if (params.dataType !== 'node') return '';
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
        color: 'source',
        width: 1,
        curveness: 0.2,
        opacity: 0.7,
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

function _centerOnNode(chart, dataIndex) {
  try {
    const series = chart.getModel().getSeriesByIndex(0);
    const data = series.getData();
    const layout = data.getItemLayout(dataIndex);
    if (!layout) return;

    const pixel = chart.convertToPixel({ seriesIndex: 0 }, [layout.x, layout.y]);
    const dom = chart.getDom();
    const cx = dom.offsetWidth / 2;
    const cy = dom.offsetHeight / 2;

    chart.dispatchAction({
      type: 'graphRoam',
      dx: cx - pixel[0],
      dy: cy - pixel[1],
    });
  } catch (_) {
    // Layout not yet available (force still running) — silently skip
  }
}

export function filterByExpertises(chart, activeExpertises, allNodes, allLinks) {
  // Reset focus state when filtering
  _focusedIndex = -1;

  const filtered = activeExpertises.size === 0
    ? allNodes
    : allNodes.filter(n =>
      n.isGhost ||
      activeExpertises.has(n.primaryExpertise) ||
      (n.expertises && n.expertises.some(e => activeExpertises.has(e)))
    );

  const activeNames = new Set(filtered.map(n => n.name));
  const filteredLinks = allLinks.filter(l =>
    activeNames.has(l.source) && activeNames.has(l.target)
  );

  chart.setOption({ series: [{ data: filtered, links: filteredLinks }] });
}

export function getChartInstance() {
  return _chart;
}
