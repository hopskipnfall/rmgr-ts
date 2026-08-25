import type { FramePortData, PortIndex, Replay } from "./types.js";

/**
 * Looks up a single frame by number. O(n) in `replay.frames.length` — fine
 * for typical match lengths (single-digit-minutes matches are low
 * thousands of frames), but avoid calling this in a tight per-frame loop
 * over the whole replay; iterate `replay.frames` directly instead.
 */
export function getFrame(replay: Replay, frameNumber: number): Replay["frames"][number] | undefined {
  return replay.frames.find((f) => f.frame === frameNumber);
}

/** One port's data for a single frame, plus the frame number it belongs to. */
export interface PortFrame extends FramePortData {
  readonly frame: number;
}

/**
 * The chronological sequence of frames in which `port` was seated and
 * live, skipping any frame where it wasn't (e.g. that port hadn't spawned
 * in yet). Returned frames are already in ascending frame-number order,
 * since `replay.frames` is.
 */
export function getPortTimeline(replay: Replay, port: PortIndex): readonly PortFrame[] {
  const timeline: PortFrame[] = [];
  for (const frame of replay.frames) {
    const data = frame.ports[port];
    if (data) {
      timeline.push({ frame: frame.frame, ...data });
    }
  }
  return timeline;
}

/** The set of ports that have at least one recorded frame in this replay. */
export function getSeatedPorts(replay: Replay): readonly PortIndex[] {
  const seated = new Set<PortIndex>();
  for (const frame of replay.frames) {
    for (const key of Object.keys(frame.ports)) {
      seated.add(Number(key) as PortIndex);
    }
  }
  return [...seated].sort((a, b) => a - b);
}
