import {
  addContainer,
  emptyFlexibleConfiguration,
  flexibleId,
  reconcileFrames,
  removeContainer,
  removeFrame,
  resizePair,
  setOrientation,
  FlexibleLayoutConfiguration,
} from './flexible-model';

function config(frameKeys: string[][]): FlexibleLayoutConfiguration {
  return {
    rowsLayout: true,
    containers: frameKeys.map((keys) => ({
      id: flexibleId(),
      size: 100 / frameKeys.length,
      frames: keys.map((keyString) => ({ id: `f-${keyString}`, keyString, size: 100 / keys.length })),
    })),
  };
}

describe('OMCT-C09-L2-02.02 Pane editing', () => {
  it('adds a container and rebalances container sizes', () => {
    const next = addContainer(config([['a']]));

    expect(next.containers).toHaveLength(2);
    const total = next.containers.reduce((sum, container) => sum + container.size, 0);
    expect(total).toBeCloseTo(100, 0);
  });

  it('removes a container but never the last one', () => {
    const two = config([['a'], ['b']]);

    const one = removeContainer(two, two.containers[0].id);
    expect(one.containers).toHaveLength(1);
    expect(removeContainer(one, one.containers[0].id).containers).toHaveLength(1);
  });

  it('removes a frame and rebalances its container', () => {
    const layout = config([['a', 'b']]);

    const next = removeFrame(layout, 'f-a');

    expect(next.containers[0].frames.map((frame) => frame.keyString)).toEqual(['b']);
    expect(next.containers[0].frames[0].size).toBeCloseTo(100, 0);
  });

  it('sets the container orientation', () => {
    expect(setOrientation(config([['a']]), false).rowsLayout).toBe(false);
  });

  it('resizes an adjacent pair within clamps', () => {
    expect(resizePair([50, 50], 0, 10)).toEqual([60, 40]);
    expect(resizePair([50, 50], 0, 60)).toEqual([50, 50]);
    expect(resizePair([50, 50], 1, 10)).toEqual([50, 50]);
  });
});

describe('OMCT-C09-L2-02.01 Flexible-layout rendering — frame synchronization', () => {
  it('appends frames for new composed children to the last container', () => {
    const { config: next, changed } = reconcileFrames(config([['a'], []]), ['a', 'b']);

    expect(changed).toBe(true);
    expect(next.containers[1].frames.map((frame) => frame.keyString)).toEqual(['b']);
  });

  it('drops frames whose children left composition', () => {
    const { config: next, changed } = reconcileFrames(config([['a', 'b']]), ['b']);

    expect(changed).toBe(true);
    expect(next.containers[0].frames.map((frame) => frame.keyString)).toEqual(['b']);
  });

  it('reports no change when frames and composition agree', () => {
    const layout = config([['a']]);

    expect(reconcileFrames(layout, ['a']).changed).toBe(false);
  });

  it('starts with one full-size container', () => {
    const empty = emptyFlexibleConfiguration();

    expect(empty.containers).toHaveLength(1);
    expect(empty.containers[0].size).toBe(100);
  });
});
