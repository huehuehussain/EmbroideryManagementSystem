export function formatNumber(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return (0).toFixed(decimals);
  return n.toFixed(decimals);
}

export default formatNumber;
