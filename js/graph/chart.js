import * as echarts from 'echarts';
import { forceLayout } from './layout.js';

let _chart = null;

export function initChart(container) {
  _chart = echarts.init(container, null, { renderer: 'canvas' });
  window.addEventListener('resize', () => _chart.resize());
  return _chart;
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
        width: 1.5,
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

export function filterByExpertises(chart, activeExpertises, allNodes, allLinks) {
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
