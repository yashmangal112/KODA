import { useLocalSearchParams } from 'expo-router';

import { ScreenPlaceholder } from '@/components/layout/ScreenPlaceholder';

export default function MeetingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenPlaceholder
      title="Meeting Detail"
      subtitle={`Meeting ID: ${id ?? 'unknown'} — UI next`}
    />
  );
}
