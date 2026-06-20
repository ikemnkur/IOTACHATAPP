export type DebateRealtimeEvent =
  | {
      type: 'chat:message';
      roomId: string;
      payload: {
        id: string;
        userId: string;
        user: string;
        team: string;
        text: string;
        likes: number;
        dislikes: number;
        createdAt: number;
      };
    }
  | {
      type: 'chat:reaction';
      roomId: string;
      payload: {
        messageId: string;
        key: 'likes' | 'dislikes';
      };
    }
  | {
      type: 'room:updated';
      roomId: string;
      payload: {
        timestamp: number;
      };
    };

const STORAGE_EVENT_KEY = 'iota_debate_realtime_event';
const CHANNEL_NAME = 'iota-debate-realtime';

let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  channel = new BroadcastChannel(CHANNEL_NAME);
}

export function publishDebateEvent(event: DebateRealtimeEvent): void {
  if (channel) {
    channel.postMessage(event);
  }

  try {
    localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify({ ...event, nonce: Date.now() + Math.random() }));
  } catch {
    // Ignore storage failures.
  }
}

export function subscribeDebateEvents(handler: (event: DebateRealtimeEvent) => void): () => void {
  const onChannelMessage = (ev: MessageEvent) => {
    handler(ev.data as DebateRealtimeEvent);
  };

  const onStorage = (ev: StorageEvent) => {
    if (ev.key !== STORAGE_EVENT_KEY || !ev.newValue) return;
    try {
      const parsed = JSON.parse(ev.newValue);
      handler(parsed as DebateRealtimeEvent);
    } catch {
      // Ignore malformed storage event payloads.
    }
  };

  if (channel) {
    channel.addEventListener('message', onChannelMessage);
  }
  window.addEventListener('storage', onStorage);

  return () => {
    if (channel) {
      channel.removeEventListener('message', onChannelMessage);
    }
    window.removeEventListener('storage', onStorage);
  };
}
