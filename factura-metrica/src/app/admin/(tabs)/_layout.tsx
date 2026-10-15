import AppTabs from '@/components/app-tabs';
import { PESTANAS_ADMIN } from '@/constants/pestanas';

export default function AdminTabsLayout() {
  return <AppTabs pestanas={PESTANAS_ADMIN} />;
}
