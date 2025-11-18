/**
 * Format bytes as human-readable text.
 * 
 * @param bytes - Number of bytes.
 * @param si - True to use metric (SI) units (powers of 1000). False to use binary (IEC), (powers of 1024).
 * @param dp - Number of decimal places to display.
 * @returns Formatted string.
 */
export function formatBytes(bytes: number, si = true, dp = 1): string {
  if (bytes === 0) return '0 B';

  const thresh = si ? 1000 : 1024;
  const units = si 
    ? ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  
  const absBytes = Math.abs(bytes);
  
  if (absBytes < thresh) {
    return bytes.toFixed(dp) + ' B';
  }
  
  let u = 0;
  let b = bytes;

  while (Math.abs(b) >= thresh && u < units.length - 1) {
    b /= thresh;
    u++;
  }

  return b.toFixed(dp) + ' ' + units[u];
}

/**
 * Format date to a readable string
 * @param dateString - ISO date string or timestamp
 * @param format - Format string (supports: YYYY, YY, MMMM, MMM, MM, DD, hh, mm, A, a)
 * @returns Formatted date string
 */
export function formatDate(dateString: string | number, format = 'MM/DD/YYYY hh:mm A'): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const twelveHour = hours % 12 || 12;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthShortNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Replace in order from longest to shortest to avoid conflicts
  return format
    .replace(/YYYY/g, String(year))
    .replace(/MMMM/g, monthNames[month])
    .replace(/MMM/g, monthShortNames[month])
    .replace(/MM/g, String(month + 1).padStart(2, '0'))
    .replace(/YY/g, String(year).slice(-2))
    .replace(/DD/g, String(day).padStart(2, '0'))
    .replace(/hh/g, String(twelveHour).padStart(2, '0'))
    .replace(/mm/g, String(minutes).padStart(2, '0'))
    .replace(/A/g, ampm)
    .replace(/a/g, ampm.toLowerCase());
}
