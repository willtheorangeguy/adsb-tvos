import {describe, expect, it} from 'vitest';
import {mergeTrackingState} from './tracker.js';
import {nearbyAlerts, proximity, sightingText} from './spotting.js';
const receiver = {lat: 0, lon: 0};
const plane = mergeTrackingState(undefined, {sourceTimestampMs: 1000, aircraft: [{hex: 'abc123', r: 'N172SP', t: 'C172', category: 'A1', lat: 0.1, lon: 0, gs: 120, track: 180}]}, {}, receiver).aircraft[0]!;
describe('local spotting', () => {
  it('uses readsb registration/type without confusing ADS-B category', () => {
    expect(plane.registration).toBe('N172SP'); expect(plane.aircraftType).toBe('C172'); expect(plane.category).toBe('A1'); expect(plane.origin).toBeUndefined();
  });
  it('finds a northbound sight line and a three-minute inbound approach', () => {
    const result = proximity(plane, receiver)!;
    expect(result.direction).toBe('N'); expect(result.minutes).toBeCloseTo(3); expect(result.closestNm).toBeCloseTo(0);
    expect(proximity({...plane, trackDeg: 0}, receiver)?.minutes).toBeUndefined();
  });
  it('does not invent approach or location without telemetry', () => {
    expect(proximity(plane)).toBeUndefined(); expect(proximity({...plane, groundSpeedKt: undefined}, receiver)?.minutes).toBeUndefined();
  });
  it('alerts for registrations, types and categories, excluding stale or distant aircraft', () => {
    for (const rule of [{id: '1', kind: 'aircraft' as const, value: 'n172sp', label: ''}, {id:'2',kind:'type' as const,value:'C172',label:''}, {id:'3',kind:'category' as const,value:'LIGHT',label:''}]) {
      expect(nearbyAlerts([plane], [rule], 10)).toHaveLength(1);
      expect(nearbyAlerts([{...plane, stale:true}], [rule], 10)).toHaveLength(0);
      expect(nearbyAlerts([plane], [rule], 5)).toHaveLength(0);
    }
  });
  it('labels synthetic shares and rejects invalid coordinates and old positions', () => {
    expect(sightingText({id:'1', savedAt:1000, demo:true, aircraft:plane})).toContain('[DEMO]');
    const state = mergeTrackingState(undefined, {sourceTimestampMs: 1000, aircraft: [{hex:'A',lat:NaN,lon:0},{hex:'B',lat:0,lon:0,seen:0,seen_pos:30}]});
    expect(state.aircraft[0]?.position).toBeUndefined(); expect(state.aircraft[1]?.stale).toBe(true);
  });
});
