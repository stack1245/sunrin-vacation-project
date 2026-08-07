import type {
  StageOneEventListener,
  StageOneGameEvents,
} from "../contracts/events";

export class StageOneEventBus<EventMap extends object>
  implements StageOneGameEvents<EventMap>
{
  private readonly listeners = new Map<
    keyof EventMap,
    Set<(payload: EventMap[keyof EventMap]) => void>
  >();

  on<EventName extends keyof EventMap>(
    eventName: EventName,
    listener: StageOneEventListener<EventMap, EventName>,
  ): () => void {
    const listeners =
      this.listeners.get(eventName) ??
      new Set<(payload: EventMap[keyof EventMap]) => void>();
    const compatibleListener = listener as (
      payload: EventMap[keyof EventMap],
    ) => void;

    listeners.add(compatibleListener);
    this.listeners.set(eventName, listeners);

    return () => {
      listeners.delete(compatibleListener);

      if (listeners.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  emit<EventName extends keyof EventMap>(
    eventName: EventName,
    payload: EventMap[EventName],
  ): void {
    const listeners = this.listeners.get(eventName);

    if (!listeners) {
      return;
    }

    for (const listener of [...listeners]) {
      listener(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
