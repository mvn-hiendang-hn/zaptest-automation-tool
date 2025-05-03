
/**
 * Format a date string or timestamp to a human-readable format
 */
export const formatDate = (date: string | number) => {
  const d = new Date(date);
  return d.toLocaleString();
};

/**
 * Format a duration in milliseconds to a readable format
 */
export const formatDuration = (ms: number) => {
  if (!ms || isNaN(ms)) {
    return '0ms';
  }
  
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * Format a file size in bytes to a readable format
 */
export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(2)} KB`;
  }
  const megabytes = kilobytes / 1024;
  return `${megabytes.toFixed(2)} MB`;
};
