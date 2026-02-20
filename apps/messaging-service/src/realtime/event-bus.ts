import { EventEmitter } from 'events';

export type MessagingEventType =
  | 'conversation.updated'
  | 'conversation.deleted'
  | 'message.created'
  | 'message.updated'
  | 'message.deleted'
  | 'presence.updated';

export type MessagingEvent = {
  type: MessagingEventType;
  conversationId: string;
  participantIds: string[];
  messageId?: string;
  at: string;
};

const bus = new EventEmitter();

export const emitMessagingEvent = (event: MessagingEvent) => {
  bus.emit('event', event);
};

export const subscribeMessagingEvents = (handler: (event: MessagingEvent) => void) => {
  bus.on('event', handler);
  return () => {
    bus.off('event', handler);
  };
};

