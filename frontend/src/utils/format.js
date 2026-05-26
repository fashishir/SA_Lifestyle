export function formatBDT(amount) {
  return '৳ ' + Number(amount).toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
