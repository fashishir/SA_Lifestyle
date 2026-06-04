export function formatBDT(amount) {
  return '৳ ' + Number(amount).toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatNumber(amount) {
  return Number(amount || 0).toLocaleString('en-US');
}

export function formatCompact(amount) {
  const n = Number(amount || 0);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

export function formatPercent(value) {
  const n = Number(value || 0);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

export function formatDelta(current, previous) {
  const c = Number(current || 0);
  const p = Number(previous || 0);
  if (p === 0) {
    return { value: c === 0 ? 0 : 100, direction: c === 0 ? 'flat' : 'up' };
  }
  const diff = ((c - p) / p) * 100;
  return {
    value: diff,
    direction: diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'flat',
  };
}

export function timeAgo(date) {
  if (!date) return '—';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
