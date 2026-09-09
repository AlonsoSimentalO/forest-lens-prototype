import test from 'node:test';
import assert from 'node:assert/strict';
import { zones, scenarios, metrics, getScenario, findZone, distanceKm } from '../data.js';

test('every forest and scenario has complete actions, outcomes, stakeholders and guide copy', () => {
  for (const zone of zones) {
    assert.equal(zone.profile.length, metrics.length);
    for (const scenario of scenarios) {
      const result = getScenario(zone.id, scenario.id);
      assert.equal(result.actions.length, 3);
      assert.equal(result.outcomes.length, metrics.length);
      assert.ok(result.outcomes.every(value => [-1, 0, 1].includes(value)));
      assert.equal(result.stakeholders.length, 3);
      assert.ok(result.guide.length > 30);
    }
  }
});
test('continuing each zone’s existing priority has unchanged comparative outcomes', () => {
  for (const zone of zones) {
    const scenario = zone.priority === 'Recreation' ? 'recreation' : 'commercial';
    assert.deepEqual(getScenario(zone.id, scenario).outcomes, [0, 0, 0, 0]);
  }
});
test('GPS matches each sample centre but never substitutes a distant zone', () => {
  for (const zone of zones) assert.equal(findZone(zone.lat, zone.lon)?.id, zone.id);
  assert.equal(findZone(47.3769, 8.5417), null);
  assert.equal(findZone(0, 0), null);
  assert.equal(findZone(NaN, 20), null);
  assert.equal(findZone(91, 20), null);
  assert.equal(findZone(20, 181), null);
});
test('geofence accepts a nearby location and excludes points beyond its radius', () => {
  const zone = zones[0];
  assert.equal(findZone(zone.lat + .01, zone.lon)?.id, zone.id);
  assert.equal(findZone(zone.lat + .1, zone.lon), null);
  assert.equal(distanceKm(zone.lat, zone.lon, zone.lat, zone.lon), 0);
  assert.ok(Math.abs(distanceKm(0, 0, 1, 0) - 111.195) < .01);
});
test('unknown data references fail explicitly', () => {
  assert.throws(() => getScenario('unknown', 'carbon'), /Unknown forest zone/);
  assert.throws(() => getScenario('spruce', 'unknown'), /Unknown management scenario/);
});
