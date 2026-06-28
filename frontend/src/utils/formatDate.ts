export const formatDate = (date: string | Date, format: 'short' | 'long' | 'datetime' = 'short'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (format === 'datetime') return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  if (format === 'long') return d.toLocaleDateString('en-US', { dateStyle: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
