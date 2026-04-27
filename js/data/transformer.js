import { getExpertiseColor, GHOST_COLOR, NODE_SIZE } from '../config.js';
import { normalizeId } from '../utils/helpers.js';

const MIN_SIZE = 20;
const MAX_SIZE = 48;

export function transform(rows) {
  const nodeMap   = new Map();
  const nameIndex = new Map(); // lowercase name → normalizedId
  const categorySet = new Set();

  // First pass — real nodes
  for (const row of rows) {
    const term = (row['Terme'] || row['terme'] || '').trim();
    if (!term) continue;

    const definition = (
      row['Définition'] || row['Definition'] || row['définition'] || row['definition'] || ''
    ).trim();

    // Expertise column: values separated by " / "
    const expertiseRaw = (
      row['Expertise'] || row['Expertises'] || row['expertise'] || row['expertises'] || ''
    ).trim();

    // Mots Liés: comma-separated
    const linkedRaw = (
      row['Mots Liés'] || row['Mots liés'] || row['mots liés'] || row['Mots_Liés'] || row['mots_lies'] || ''
    ).trim();

    // Optional explicit size hint from sheet
    const sizeHint = parseInt(row['Taille'] || row['taille'] || '', 10);

    const expertises = expertiseRaw
      ? expertiseRaw.split('/').map(e => e.trim()).filter(Boolean)
      : ['Marketing général'];

    const primaryExpertise = expertises[0];
    const linkedTerms = linkedRaw
      ? linkedRaw.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    expertises.forEach(e => categorySet.add(e));

    const id = normalizeId(term);

    // Node size: use sheet hint if valid, else scale by link count (resolved later)
    const baseSize = (!isNaN(sizeHint) && sizeHint > 0)
      ? Math.max(MIN_SIZE, Math.min(MAX_SIZE, sizeHint * 0.6))
      : NODE_SIZE.normal + Math.min(linkedTerms.length * 2, 14);

    const node = {
      id,
      name: term,
      definition,
      expertises,
      primaryExpertise,
      linkedTerms,
      isGhost: false,
      symbolSize: baseSize,
      category: primaryExpertise,
      label: { show: true },
      itemStyle: {
        color: getExpertiseColor(primaryExpertise),
        borderWidth: expertises.length > 1 ? 3 : 0,
        borderColor: 'rgba(255,255,255,0.55)',
        shadowBlur: 6,
        shadowColor: 'rgba(0,0,0,0.12)',
      },
    };

    nodeMap.set(id, node);
    nameIndex.set(term.toLowerCase(), id);
  }

  // Second pass — ghost nodes + deduplicated links
  const linkKeys = new Set();

  for (const [, node] of nodeMap) {
    for (const linked of node.linkedTerms) {
      const linkedLow = linked.toLowerCase();
      let linkedId = nameIndex.get(linkedLow);

      if (!linkedId) {
        linkedId = normalizeId(linked);
        if (!nodeMap.has(linkedId)) {
          nodeMap.set(linkedId, {
            id: linkedId,
            name: linked,
            definition: '',
            expertises: [],
            primaryExpertise: null,
            linkedTerms: [],
            isGhost: true,
            symbolSize: NODE_SIZE.ghost,
            category: null,
            label: { show: true, fontSize: 10, color: '#94A3B8' },
            itemStyle: {
              color: GHOST_COLOR,
              borderWidth: 2,
              borderColor: '#94A3B8',
              borderType: 'dashed',
            },
          });
        }
        nameIndex.set(linkedLow, linkedId);
      }

      const key = [node.name, linked].sort().join('\x00');
      linkKeys.add(key);
    }
  }

  const nodes = [...nodeMap.values()];
  const links = [...linkKeys].map(key => {
    const [source, target] = key.split('\x00');
    return { source, target, lineStyle: { opacity: 0.45, curveness: 0.08 } };
  });

  const categories = [...categorySet].map(name => ({
    name,
    itemStyle: { color: getExpertiseColor(name) },
  }));

  return { nodes, links, categories, nodeMap };
}
