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
  { title: 'Dashboard', icon: LayoutDashboard, accent: 'bg-accent' },
  { title: 'Auth + User', icon: Users, accent: 'bg-secondary' },
  { title: 'Messaging', icon: MessageCircleMore, accent: 'bg-primary' },
  { title: 'Productivity', icon: Workflow, accent: 'bg-secondary' },
  { title: 'File Cloud', icon: Cloud, accent: 'bg-accent' },
  { title: 'Notifications', icon: Bell, accent: 'bg-primary' },
  { title: 'AI Assistant', icon: Bot, accent: 'bg-secondary' },
  { title: 'Extensible Platform', icon: Sparkles, accent: 'bg-primary' },
];
