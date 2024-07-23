import { EventEmitter } from "events";

declare global {
  var sseEmitter: EventEmitter | undefined;
}

function getEventEmitter(): EventEmitter {
  if (global.sseEmitter === undefined) {
    global.sseEmitter = new EventEmitter();
  }
  return global.sseEmitter;
}

type Callback = (e: Event) => void;
type UnsubscribeFn = () => void;

export function subscribe(
  eventType: string,
  callback: Callback,
): UnsubscribeFn {
  const emitter = getEventEmitter();
  emitter.addListener(eventType, callback);
  console.log(`Listener subscribed to ${eventType}`);
  return () => {
    emitter.removeListener(eventType, callback);
    console.log(`Listener unsubscribed from ${eventType}`);
  };
}

export function emit(eventType: string, data: any) {
  const emitter = getEventEmitter();
  emitter.emit(eventType, data);
}
