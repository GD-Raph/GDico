export const SHEET_ID = '1n1Ab8X5-JY33Q2zJUO5HRIHHQ759p7RU3l16EVHN_vs';
export const SHEET_GID = '0';
export const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
export const CACHE_TTL = 5 * 60 * 1000;

export const EXPERTISE_COLORS = {
  'Devs':                '#3B82F6',
  'Data Scientists':     '#8B5CF6',
  'SEA':                 '#F97316',
  'SEO':                 '#10B981',
  'Automation':          '#06B6D4',
  'Webdesign':           '#EC4899',
  'Audiovisuel':         '#EF4444',
  'Chef de projet / PO': '#F59E0B',
  'Innovation':          '#6366F1',
  'Marketing général':   '#64748B',
};

export const GHOST_COLOR = '#CBD5E1';

export function getExpertiseColor(name) {
  if (!name) return '#94A3B8';
  if (EXPERTISE_COLORS[name]) return EXPERTISE_COLORS[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
}

export const GRAPH_CONFIG = {
  repulsion: 280,
  gravity: 0.12,
  edgeLength: [60, 140],
  friction: 0.65,
};

export const NODE_SIZE = {
  normal: 30,
  ghost:  16,
};
