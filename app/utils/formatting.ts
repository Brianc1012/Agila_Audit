export const formatDisplayText = (text: unknown): string => {
  if (typeof text !== 'string') {
    if (text === null || text === undefined) return '';
    return String(text).replace(/_/g, ' ');
  }
  return text.replace(/_/g, ' ');
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
