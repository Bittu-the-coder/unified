import {
  Bell,
  Bot,
  Cloud,
  LayoutDashboard,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
} from 'lucide-react';

export const highlightMetrics = [
  { label: 'Unified Modules', value: '8+' },
  { label: 'Core Services', value: '6' },
  { label: 'Free Storage', value: '250MB' },
  { label: 'Theme Modes', value: '2' },
];

export const coreFeatures = [
  {
    title: 'Secure Identity',
    description: 'JWT sessions, account controls, profile management, and social graph in one place.',
    icon: ShieldCheck,
  },
  {
    title: 'Realtime Collaboration',
    description: 'Messaging workspace with conversation context, reactions, edits, and delivery status.',
    icon: MessageCircleMore,
  },
  {
    title: 'Focus & Productivity',
    description: 'Tasks, notes, calendars, pomodoro sessions, goals, and progress tracking.',
    icon: Target,
  },
  {
    title: 'Cloud Workspace',
    description: 'Nested folders, direct uploads, quota management, and provider-backed storage.',
    icon: Cloud,
  },
];

export const serviceTiles = [
  { title: 'Dashboard', icon: LayoutDashboard, accent: 'from-[#FF6500] to-[#1E3E62]' },
  { title: 'Auth + User', icon: Users, accent: 'from-[#255F38] to-[#1F7D53]' },
  { title: 'Messaging', icon: MessageCircleMore, accent: 'from-[#1E3E62] to-[#0B192C]' },
  { title: 'Productivity', icon: Workflow, accent: 'from-[#27391C] to-[#255F38]' },
  { title: 'File Cloud', icon: Cloud, accent: 'from-[#FF6500] to-[#27391C]' },
  { title: 'Notifications', icon: Bell, accent: 'from-[#0B192C] to-[#1E3E62]' },
  { title: 'AI Assistant', icon: Bot, accent: 'from-[#27391C] to-[#1F7D53]' },
  { title: 'Extensible Platform', icon: Sparkles, accent: 'from-[#1E3E62] to-[#255F38]' },
];
