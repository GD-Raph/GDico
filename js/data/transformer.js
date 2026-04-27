import { getExpertiseColor, NODE_SIZE } from '../config.js';
import { slugify } from '../utils/helpers.js';

export function transformData(rawData) {
  const nodes = [];
  const links = [];
  const categoriesSet = new Set();
  const definedTerms = new Set();

  // 1. First pass: Identify all defined terms
  rawData.forEach(row => {
    const name = (row['Terme'] || '').trim();
    if (name) definedTerms.add(name);
  });

  const potentialGhosts = new Set();

  // 2. Second pass: Create nodes and gather potential ghosts
  rawData.forEach(row => {
    const name = (row['Terme'] || '').trim();
    if (!name) return;

    const expertiseStr = row['Expertise'] || '';
    const expertises = expertiseStr.split(',').map(e => e.trim()).filter(e => e);
    const primaryExpertise = expertises[0] || 'Marketing général';
    
    expertises.forEach(e => categoriesSet.add(e));
    if (primaryExpertise) categoriesSet.add(primaryExpertise);

    // Node size from 'Taille' column, fallback to config
    let size = parseFloat(row['Taille']);
    if (isNaN(size) || size <= 0) {
      size = NODE_SIZE.default;
    }

    nodes.push({
      id: name,
      name: name,
      symbolSize: size,
      value: size,
      category: primaryExpertise,
      primaryExpertise: primaryExpertise,
      expertises: expertises,
      definition: row['Définition'] || '',
      isGhost: false,
      itemStyle: {
        color: getExpertiseColor(primaryExpertise),
        borderColor: expertises.length > 1 ? '#000' : 'transparent',
        borderWidth: expertises.length > 1 ? 1 : 0,
      }
    });

    const relatedStr = row['Mots Liés'] || '';
    const related = relatedStr.split(',').map(r => r.trim()).filter(r => r);
    
    related.forEach(target => {
      links.push({ source: name, target: target });
      if (!definedTerms.has(target)) {
        potentialGhosts.add(target);
      }
    });
  });

  // 3. Create ghost nodes
  potentialGhosts.forEach(name => {
    nodes.push({
      id: name,
      name: name,
      symbolSize: NODE_SIZE.ghost,
      value: NODE_SIZE.ghost,
      category: 'Fantôme',
      isGhost: true,
      definition: '',
      itemStyle: {
        color: '#CBD5E1',
        borderColor: '#94A3B8',
        borderWidth: 1,
        borderType: 'dashed'
      },
      label: { color: '#64748B' }
    });
  });

  const categories = Array.from(categoriesSet).map(name => ({ name }));
  
  return { nodes, links, categories };
}
