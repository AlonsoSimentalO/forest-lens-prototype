export const metrics = [
  { key: 'biodiversity', label: 'Biodiversity', icon: 'leaf' },
  { key: 'carbon', label: 'Carbon storage', icon: 'cloud' },
  { key: 'economic', label: 'Economic return', icon: 'coins' },
  { key: 'recreation', label: 'Recreation', icon: 'walk' },
];

export const zones = [
  {
    id: 'spruce', name: 'Korpilahti', subtitle: 'Sample zone 01', type: 'Managed spruce forest',
    priority: 'Timber production', lat: 62.015, lon: 25.56, radiusKm: 5,
    profile: ['Medium', 'Medium', 'High', 'Medium'],
    intro: 'This spruce forest is managed mainly for timber. Explore how a different priority could change its future.',
  },
  {
    id: 'mixed', name: 'Lake trail', subtitle: 'Sample zone 02', type: 'Mixed lakeside forest',
    priority: 'Recreation', lat: 62.24, lon: 25.74, radiusKm: 3,
    profile: ['High', 'Medium', 'Low', 'High'],
    intro: 'This mixed forest is managed mainly for recreation. Its trails welcome visitors, and its varied trees provide habitat.',
  },
  {
    id: 'pine', name: 'Pine ridge', subtitle: 'Sample zone 03', type: 'Managed pine forest',
    priority: 'Timber production', lat: 61.5, lon: 23.8, radiusKm: 4,
    profile: ['Low', 'Medium', 'High', 'Low'],
    intro: 'This pine forest is managed mainly for timber. Its sample profile has limited habitat variety and few recreational facilities.',
  },
];

export const scenarios = [
  { id: 'commercial', label: 'Commercial', icon: 'timber', description: 'Prioritise timber production' },
  { id: 'conservation', label: 'Conservation', icon: 'leaf', description: 'Prioritise habitats and species' },
  { id: 'recreation', label: 'Recreation', icon: 'walk', description: 'Prioritise the visitor experience' },
  { id: 'carbon', label: 'Carbon', icon: 'cloud', description: 'Prioritise carbon stored in the forest' },
];

const timberScenarios = {
  commercial: {
    actions: ['Continue planned timber harvesting', 'Replant after harvesting', 'Maintain forestry access routes'],
    outcomes: [0, 0, 0, 0],
    stakeholders: [['Forest owner', 'Similar timber revenue', 0], ['Local visitors', 'Similar recreation', 0], ['Forestry operators', 'Similar activity', 0]],
    guide: 'Timber production is already the priority here. Continuing it keeps the sample outcomes broadly unchanged for the owner, visitors, and forestry operators.',
  },
  conservation: {
    actions: ['Reduce harvesting intensity', 'Retain more habitat trees', 'Leave more deadwood for wildlife'],
    outcomes: [1, 1, -1, 0],
    stakeholders: [['Forest owner', 'Less timber revenue', -1], ['Local visitors', 'Similar recreation', 0], ['Forestry operators', 'Less harvesting activity', -1]],
    guide: 'Keeping more habitat trees could support biodiversity and retain carbon. Less harvesting means less timber revenue for the owner and less work for forestry operators.',
  },
  recreation: {
    actions: ['Improve walking trails', 'Retain trees beside popular paths', 'Schedule harvesting around visitors'],
    outcomes: [0, 0, -1, 1],
    stakeholders: [['Forest owner', 'More trail maintenance costs', -1], ['Local visitors', 'Better recreation', 1], ['Forestry operators', 'More scheduling constraints', -1]],
    guide: 'Better trails could make the forest easier to enjoy. Visitors benefit, while the owner takes on maintenance costs and operators work around trail use.',
  },
  carbon: {
    actions: ['Extend the time between harvests', 'Retain more living trees', 'Limit disturbance to forest soils'],
    outcomes: [1, 1, -1, 0],
    stakeholders: [['Forest owner', 'Delayed timber revenue', -1], ['Local visitors', 'Similar recreation', 0], ['Forestry operators', 'Less near-term harvesting', -1]],
    guide: 'Longer intervals between harvests could retain more carbon and habitat. The owner receives timber income later, and forestry operators have less near-term harvesting work.',
  },
};

const recreationScenarios = {
  commercial: {
    actions: ['Increase timber harvesting', 'Prioritise productive tree species', 'Use some trails for forestry access'],
    outcomes: [-1, -1, 1, -1],
    stakeholders: [['Forest owner', 'More timber revenue', 1], ['Local visitors', 'More trail disruption', -1], ['Forestry operators', 'More harvesting activity', 1]],
    guide: 'More harvesting could increase timber income and forestry work. In this sample, it reduces habitat and stored carbon and causes more disruption for visitors.',
  },
  conservation: {
    actions: ['Protect lakeside habitat areas', 'Retain old trees and deadwood', 'Reroute trails away from sensitive areas'],
    outcomes: [1, 1, -1, -1],
    stakeholders: [['Forest owner', 'Less timber revenue', -1], ['Local visitors', 'Fewer accessible routes', -1], ['Forestry operators', 'Less harvesting activity', -1]],
    guide: 'Protecting lakeside habitats could support biodiversity and retain carbon. The owner forgoes some timber income, while visitors have fewer routes near sensitive areas.',
  },
  recreation: {
    actions: ['Continue maintaining walking trails', 'Keep visitor facilities in use', 'Continue managing trees beside paths'],
    outcomes: [0, 0, 0, 0],
    stakeholders: [['Forest owner', 'Similar maintenance costs', 0], ['Local visitors', 'Similar recreation', 0], ['Forestry operators', 'Similar activity', 0]],
    guide: 'Recreation is already the priority here. Continuing the current approach maintains the visitor experience and keeps the sample outcomes broadly unchanged.',
  },
  carbon: {
    actions: ['Postpone planned timber harvests', 'Retain more mature trees', 'Keep existing walking trails open'],
    outcomes: [1, 1, -1, 0],
    stakeholders: [['Forest owner', 'Delayed timber revenue', -1], ['Local visitors', 'Similar recreation', 0], ['Forestry operators', 'Less near-term harvesting', -1]],
    guide: 'Retaining mature trees could increase stored carbon and habitat over time. Timber revenue is delayed, while existing trails keep recreation broadly unchanged.',
  },
};

export function getScenario(zoneId, scenarioId) {
  if (!zones.some(zone => zone.id === zoneId)) throw new Error('Unknown forest zone');
  const result = (zoneId === 'mixed' ? recreationScenarios : timberScenarios)[scenarioId];
  if (!result) throw new Error('Unknown management scenario');
  return result;
}

export function distanceKm(lat1, lon1, lat2, lon2) {
  const rad = value => value * Math.PI / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

export function findZone(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return zones.map(zone => ({ zone, distance: distanceKm(latitude, longitude, zone.lat, zone.lon) }))
    .filter(({ zone, distance }) => distance <= zone.radiusKm)
    .sort((a, b) => a.distance - b.distance)[0]?.zone ?? null;
}
