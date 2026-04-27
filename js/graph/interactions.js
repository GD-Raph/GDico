export function bindGraphEvents(chart, nodeMap, onNodeClick) {
  chart.on('click', 'series', (params) => {
    if (params.dataType !== 'node') return;
    const node = nodeMap.get(params.data.id);
    if (!node || node.isGhost) return;
    onNodeClick(node);
  });

  chart.on('dblclick', () => {
    chart.dispatchAction({ type: 'unfocusNodeAdjacency', seriesIndex: 0 });
  });
}

export function focusNode(chart, nodeName) {
  chart.dispatchAction({
    type: 'focusNodeAdjacency',
    seriesIndex: 0,
    dataType: 'node',
    name: nodeName,
  });
}

export function unfocusAll(chart) {
  chart.dispatchAction({ type: 'unfocusNodeAdjacency', seriesIndex: 0 });
}
