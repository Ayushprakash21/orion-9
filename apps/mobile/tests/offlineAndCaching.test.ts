import { storage } from '../src/storage';

describe('Orion-9 Offline Storage & Cache Layer', () => {
  beforeEach(async () => {
    await storage.clear();
  });

  it('stores and retrieves string key-value pairs', async () => {
    await storage.setItem('test_key', 'test_value');
    const val = await storage.getItem('test_key');
    expect(val).toBe('test_value');
  });

  it('stores and retrieves serialized JSON operational data', async () => {
    const complexTelemetry = {
      healthIndex: 87,
      subsystems: ['Logistics', 'Inventory', 'EDI'],
      timestamp: '2026-10-28T19:00:00Z',
    };

    await storage.setJson('telemetry_cache', complexTelemetry);
    const cached = await storage.getJson<typeof complexTelemetry>('telemetry_cache');

    expect(cached).toBeDefined();
    expect(cached?.healthIndex).toBe(87);
    expect(cached?.subsystems).toContain('Logistics');
  });

  it('removes cached keys on demand', async () => {
    await storage.setItem('temp_key', '12345');
    expect(await storage.getItem('temp_key')).toBe('12345');

    await storage.removeItem('temp_key');
    expect(await storage.getItem('temp_key')).toBeNull();
  });

  it('returns null gracefully for non-existent cache keys', async () => {
    const res = await storage.getJson('non_existent_key');
    expect(res).toBeNull();
  });
});
