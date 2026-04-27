import { GRAPH_CONFIG } from '../config.js';

export const forceLayout = {
  type: 'force',
  repulsion:       GRAPH_CONFIG.repulsion,
  gravity:         GRAPH_CONFIG.gravity,
  edgeLength:      GRAPH_CONFIG.edgeLength,
  friction:        GRAPH_CONFIG.friction,
  layoutAnimation: true,
};
