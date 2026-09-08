import {describe, expect, it, vi} from 'vitest';
import {createPiAwareClient} from './piawareClient.js';
describe('receiver discovery', () => {
  it('discovers readsb and reuses its data path for metadata and later polls', async () => {
    const mock = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes('/skyaware/')) return new Response('not found', {status:404});
      return new Response(JSON.stringify(String(url).includes('receiver.json') ? {lat:51,lon:-114} : {now:10,aircraft:[{hex:'A'}]}));
    });
    const client = createPiAwareClient({baseUrl:'http://receiver',fetchImpl:mock});
    expect((await client.getAircraftSnapshot()).sourceTimestampMs).toBe(10000);
    expect(await client.getReceiver()).toEqual({lat:51,lon:-114});
    await client.getAircraftSnapshot();
    expect(mock.mock.calls.map(c => c[0]).filter(url => !String(url).includes('/db/'))).toEqual(['http://receiver/skyaware/data/aircraft.json','http://receiver/data/aircraft.json','http://receiver/data/receiver.json','http://receiver/data/aircraft.json']);
  });
  it('handles web-server HTML fallbacks and absent receiver metadata', async () => {
    const client = createPiAwareClient({baseUrl:'http://receiver',fetchImpl:async url => String(url).includes('/data/aircraft') && !String(url).includes('skyaware') ? new Response('{"aircraft":[]}') : String(url).includes('receiver.json') ? new Response('',{status:404}) : new Response('<html>Fallback</html>')});
    expect((await client.getAircraftSnapshot()).aircraft).toEqual([]); expect(await client.getReceiver()).toBeUndefined();
  });
  it('surfaces connection errors instead of reporting an empty sky', async () => {
    const client = createPiAwareClient({baseUrl:'http://receiver',fetchImpl:async () => new Response('',{status:503})});
    await expect(client.getAircraftSnapshot()).rejects.toThrow('503');
  });
});
