import AppTabs from '@/components/app-tabs';
import { PESTANAS_CLIENTE } from '@/constants/pestanas';

export default function ClienteLayout() {
  return <AppTabs pestanas={PESTANAS_CLIENTE} />;
}
