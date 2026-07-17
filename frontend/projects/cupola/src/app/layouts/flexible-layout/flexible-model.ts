import { StyleProperties } from '@cupola/core';

export interface FlexibleFrame {
  id: string;
  keyString: string;
  /** Percentage share of the container's main axis. */
  size: number;
  noFrame?: boolean;
  styles?: StyleProperties;
}

export interface FlexibleContainer {
  id: string;
  /** Percentage share of the layout's cross axis. */
  size: number;
  frames: FlexibleFrame[];
}

/**
 * Flexible-layout configuration persisted at `configuration.flexible`
 * (OMCT-C09-L2-02.01–02.03). `rowsLayout` lays containers out as rows (frames
 * flow horizontally inside each container); otherwise containers are columns.
 */
export interface FlexibleLayoutConfiguration {
  rowsLayout: boolean;
  containers: FlexibleContainer[];
}

export function flexibleId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `flex-${Math.floor(Math.random() * 1e9).toString(16)}`;
}

export function emptyFlexibleConfiguration(): FlexibleLayoutConfiguration {
  return { rowsLayout: true, containers: [{ id: flexibleId(), size: 100, frames: [] }] };
}

function normalize(sizes: number[]): number[] {
  const total = sizes.reduce((sum, size) => sum + size, 0);
  if (total === 0) {
    return sizes.map(() => 100 / Math.max(1, sizes.length));
  }
  return sizes.map((size) => Math.round((size / total) * 1000) / 10);
}

function renormalizeContainers(containers: FlexibleContainer[]): FlexibleContainer[] {
  const sizes = normalize(containers.map((container) => container.size));
  return containers.map((container, index) => ({ ...container, size: sizes[index] }));
}

function renormalizeFrames(frames: FlexibleFrame[]): FlexibleFrame[] {
  const sizes = normalize(frames.map((frame) => frame.size));
  return frames.map((frame, index) => ({ ...frame, size: sizes[index] }));
}

/** Adds an empty container, rebalancing container sizes (02.02). */
export function addContainer(config: FlexibleLayoutConfiguration): FlexibleLayoutConfiguration {
  return {
    ...config,
    containers: renormalizeContainers([
      ...config.containers,
      { id: flexibleId(), size: 100 / (config.containers.length + 1), frames: [] },
    ]),
  };
}

/** Removes a container; the last container never removes (02.02). */
export function removeContainer(
  config: FlexibleLayoutConfiguration,
  containerId: string,
): FlexibleLayoutConfiguration {
  if (config.containers.length <= 1) {
    return config;
  }
  return {
    ...config,
    containers: renormalizeContainers(
      config.containers.filter((container) => container.id !== containerId),
    ),
  };
}

/** Removes a frame, rebalancing its container (02.02). */
export function removeFrame(
  config: FlexibleLayoutConfiguration,
  frameId: string,
): FlexibleLayoutConfiguration {
  return {
    ...config,
    containers: config.containers.map((container) =>
      container.frames.some((frame) => frame.id === frameId)
        ? {
            ...container,
            frames: renormalizeFrames(container.frames.filter((frame) => frame.id !== frameId)),
          }
        : container,
    ),
  };
}

/** Sets the container orientation (02.02). */
export function setOrientation(
  config: FlexibleLayoutConfiguration,
  rowsLayout: boolean,
): FlexibleLayoutConfiguration {
  return { ...config, rowsLayout };
}

/** Transfers `delta` percent between two adjacent sizes, clamped to [5, 95]. */
export function resizePair(sizes: number[], index: number, delta: number): number[] {
  if (index < 0 || index + 1 >= sizes.length) {
    return sizes;
  }
  const first = sizes[index] + delta;
  const second = sizes[index + 1] - delta;
  if (first < 5 || second < 5) {
    return sizes;
  }
  const next = [...sizes];
  next[index] = Math.round(first * 10) / 10;
  next[index + 1] = Math.round(second * 10) / 10;
  return next;
}

/**
 * Synchronizes frames with composition: composed children without a frame are
 * appended to the last container; frames whose children left composition drop.
 */
export function reconcileFrames(
  config: FlexibleLayoutConfiguration,
  composition: string[],
): { config: FlexibleLayoutConfiguration; changed: boolean } {
  const composed = new Set(composition);
  const referenced = new Set(
    config.containers.flatMap((container) => container.frames.map((frame) => frame.keyString)),
  );
  const missing = composition.filter((keyString) => !referenced.has(keyString));
  const hasOrphans = [...referenced].some((keyString) => !composed.has(keyString));
  if (missing.length === 0 && !hasOrphans) {
    return { config, changed: false };
  }

  const containers = config.containers.map((container) => ({
    ...container,
    frames: renormalizeFrames(container.frames.filter((frame) => composed.has(frame.keyString))),
  }));
  const last = containers[containers.length - 1];
  containers[containers.length - 1] = {
    ...last,
    frames: renormalizeFrames([
      ...last.frames,
      ...missing.map((keyString) => ({ id: flexibleId(), keyString, size: 100 })),
    ]),
  };
  return { config: { ...config, containers }, changed: true };
}
