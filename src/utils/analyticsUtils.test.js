jest.mock('uuid', () => ({
  v4: jest.fn(() => '00000000-0000-4000-8000-000000000001'),
}));

import { v4 as uuidv4 } from 'uuid';
import { getOrCreateSessionId, sendAnalyticsData } from './analyticsUtils';

describe('analytics client/server clock boundary', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/vehicles?utm_source=test');
    jest.spyOn(Date, 'now').mockReturnValue(1_721_188_800_000);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: jest.fn(() => false),
    });
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
    uuidv4.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  it('keeps an active legacy session id unchanged', () => {
    localStorage.setItem('wgl_session_id', 'legacy-device_1721188700000');
    localStorage.setItem('wgl_last_activity', String(Date.now() - 1_000));

    expect(getOrCreateSessionId('device-id')).toBe('legacy-device_1721188700000');
    expect(uuidv4).not.toHaveBeenCalled();
  });

  it('uses a UUID suffix for a new session instead of a wall-clock suffix', () => {
    expect(getOrCreateSessionId('device-id')).toBe(
      'device-id_00000000-0000-4000-8000-000000000001',
    );
    expect(uuidv4).toHaveBeenCalledTimes(1);
  });

  it('keeps a UUID-based session id within the backend 64-character limit', () => {
    const sessionId = getOrCreateSessionId('11111111-2222-4333-8444-555555555555');

    expect(sessionId).toHaveLength(64);
    expect(sessionId.endsWith('_00000000-0000-4000-8000-000000000001')).toBe(true);
  });

  it('never sends client timestamp or duration fields', () => {
    sendAnalyticsData('page_leave', {
      timestamp: '2099-01-01T00:00:00.000Z',
      duration: 999999,
      maxScrollDepth: 42,
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(global.fetch.mock.calls[0][1].body);

    expect(payload).not.toHaveProperty('timestamp');
    expect(payload).not.toHaveProperty('duration');
    expect(payload).toMatchObject({
      eventType: 'page_leave',
      maxScrollDepth: 42,
    });
  });
});
