import {
  Bell,
  Bot,
  Cloud,
  MessageSquare,
  Phone,
  ShoppingCart,
  SquareCheckBig,
  Tv,
  UserRound,
  Users,
} from 'lucide-react';

export type ServiceKey =
  | 'overview'
  | 'auth-user'
  | 'messages'
  | 'calls'
  | 'files'
  | 'productivity'
  | 'feed'
  | 'shopping'
  | 'ai'
  | 'notifications';

export const serviceMenu: Array<{ key: ServiceKey; title: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'overview', title: 'Overview', icon: SquareCheckBig },
  { key: 'auth-user', title: 'Auth & User', icon: UserRound },
  { key: 'messages', title: 'Messaging', icon: MessageSquare },
  { key: 'calls', title: 'Calls', icon: Phone },
  { key: 'files', title: 'File Cloud', icon: Cloud },
  { key: 'productivity', title: 'Productivity', icon: Users },
  { key: 'feed', title: 'Media Feed', icon: Tv },
  { key: 'shopping', title: 'Shopping', icon: ShoppingCart },
  { key: 'ai', title: 'AI Assistant', icon: Bot },
  { key: 'notifications', title: 'Notifications', icon: Bell },
];

export const comingSoonCopy: Record<Exclude<ServiceKey, 'overview' | 'auth-user' | 'productivity'>, string[]> = {
  messages: ['1:1 and group chats', 'Reactions and read receipts', 'Typing and attachment streams'],
  calls: ['Voice/video calls', 'Screen share rooms', 'Call history and recordings'],
  files: ['Folders and file sharing', 'Smart search and tags', 'Media previews and stars'],
  feed: ['Posts and stories', 'Hashtags and follows', 'Video and social timeline'],
  shopping: ['Product watchlists', 'Price history tracking', 'Drop alerts and deals'],
  ai: ['Conversation memory', 'Smart assistant actions', 'Cross-app automation'],
  notifications: ['In-app alerts', 'Email/push routing', 'Quiet hours and preferences'],
};
