import { StatusService } from './status.service';

describe('OMCT-C14-L2-02.01 Status lifecycle', () => {
  it('updates retrieval results and notifies the observer when status is set', () => {
    const service = new StatusService();
    const observed: Array<string | null> = [];
    service.observeStatus('mission:probe').subscribe((status) => observed.push(status));

    service.setStatus('mission:probe', 'in-review');

    expect(service.getStatus('mission:probe')).toBe('in-review');
    expect(observed).toEqual(['in-review']);
  });

  it('clears retrieval results and notifies the observer when status is deleted', () => {
    const service = new StatusService();
    service.setStatus('mission:probe', 'in-review');
    const observed: Array<string | null> = [];
    service.observeStatus('mission:probe').subscribe((status) => observed.push(status));

    service.deleteStatus('mission:probe');

    expect(service.getStatus('mission:probe')).toBeNull();
    expect(observed).toEqual([null]);
  });

  it('keeps statuses independent per identifier', () => {
    const service = new StatusService();

    service.setStatus('a:1', 'go');
    service.setStatus('b:2', 'no-go');

    expect(service.getStatus('a:1')).toBe('go');
    expect(service.getStatus('b:2')).toBe('no-go');
  });
});
