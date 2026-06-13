// Helper function
export function buildDateLabel(started_at: any, ended_at: any, duration_seconds: number): string {
  const startDate = started_at;
  const endDate = ended_at;
  const durationSeconds = duration_seconds;

  if (!startDate) return '';

  const start = new Date(startDate);
  const now = new Date();

  // Format date part — "Today", "Tomorrow", or "Oct 24"
  const isToday =
    start.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    start.toDateString() === tomorrow.toDateString();

  let datePart = '';
  if (isToday) {
    datePart = 'Today';
  } else if (isTomorrow) {
    datePart = 'Tomorrow';
  } else {
    datePart = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }); // "Oct 24"
  }

  // Format time part — "3:00 PM"
  const timePart = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }); // "3:00 PM"

  // Format duration part
  let durationPart = '';
  if (durationSeconds) {
    const mins = Math.round(durationSeconds / 60);
    durationPart = ` · ${mins} min`;
  } else if (startDate && endDate) {
    const mins = Math.round(
      (new Date(endDate).getTime() - start.getTime()) / 60000
    );
    if (mins > 0) durationPart = ` · ${mins} min`;
  }

  return `${datePart} ${timePart}${durationPart}`;
  // → "Today 3:00 PM · 42 min"
  // → "Tomorrow 10:00 AM · 30 min"
  // → "Oct 24 · 55 min"
}

export const formatDuration = (seconds?: number) => {
  if (!seconds) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
};

export const formatDate = (started_at?: string | Date) => {
  if (!started_at) return '';

  const start = new Date(started_at);
  const today = new Date();

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (start.toDateString() === today.toDateString()) {
    return 'Today';
  }

  if (start.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  return start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year:
      start.getFullYear() !== today.getFullYear()
        ? 'numeric'
        : undefined,
  });
};