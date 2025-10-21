// utility\dateFormatter.ts
// Format date as "January 1, 2025"
export const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

// Format time as "12:30:59 PM"
export const formatTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

// Format datetime as "January 1, 2025 (12:30:59 PM)"
export const formatDateTime = (dateString: string | Date): string => {
  return `${formatDate(dateString)} (${formatTime(dateString)})`;
};

// For input type="date" fields, we need ISO format
export const toISODateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};