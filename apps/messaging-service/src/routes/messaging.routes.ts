import { Router } from 'express';
import { requireAuth, validateBody } from '@unified/shared';
import { MessagingController } from '../controllers/messaging.controller';
import {
  createDirectConversationSchema,
  createGroupConversationSchema,
  createMessageSchema,
  markReadSchema,
  memberStateSchema,
  participantActionSchema,
  reactionSchema,
  typingSchema,
  updateConversationSchema,
  updateMessageSchema,
} from '../validators/messaging.validators';

export const messagingRouter = Router();

messagingRouter.use(requireAuth);
messagingRouter.get('/stream', MessagingController.stream);

messagingRouter.get('/conversations', MessagingController.listConversations);
messagingRouter.get('/conversations/:id', MessagingController.getConversation);
messagingRouter.post('/conversations/direct', validateBody(createDirectConversationSchema), MessagingController.createDirectConversation);
messagingRouter.post('/conversations/group', validateBody(createGroupConversationSchema), MessagingController.createGroupConversation);
messagingRouter.patch('/conversations/:id', validateBody(updateConversationSchema), MessagingController.updateConversation);
messagingRouter.delete('/conversations/:id', MessagingController.deleteConversation);
messagingRouter.post('/conversations/:id/participants/add', validateBody(participantActionSchema), MessagingController.addParticipant);
messagingRouter.post('/conversations/:id/participants/remove', validateBody(participantActionSchema), MessagingController.removeParticipant);
messagingRouter.post('/conversations/:id/participants/make-admin', validateBody(participantActionSchema), MessagingController.makeAdmin);
messagingRouter.post('/conversations/:id/mute', validateBody(memberStateSchema), MessagingController.setMuted);
messagingRouter.post('/conversations/:id/pin', validateBody(memberStateSchema), MessagingController.setPinned);
messagingRouter.post('/conversations/:id/archive', validateBody(memberStateSchema), MessagingController.setArchived);
messagingRouter.post('/conversations/:id/typing', validateBody(typingSchema), MessagingController.setTyping);
messagingRouter.post('/conversations/:id/read', validateBody(markReadSchema), MessagingController.markRead);

messagingRouter.get('/conversations/:id/messages', MessagingController.listMessages);
messagingRouter.post('/conversations/:id/messages', validateBody(createMessageSchema), MessagingController.createMessage);
messagingRouter.patch('/messages/:id', validateBody(updateMessageSchema), MessagingController.updateMessage);
messagingRouter.delete('/messages/:id', MessagingController.deleteMessage);
messagingRouter.post('/messages/:id/reactions', validateBody(reactionSchema), MessagingController.addReaction);
messagingRouter.delete('/messages/:id/reactions/:emoji', MessagingController.removeReaction);
