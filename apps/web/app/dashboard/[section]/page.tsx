import { WorkspaceDashboard } from '@/components/workspace/workspace-dashboard';

type DashboardSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function DashboardSectionPage({ params }: DashboardSectionPageProps) {
  const { section } = await params;
  return <WorkspaceDashboard section={section} />;
}
