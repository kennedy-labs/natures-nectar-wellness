export function formatKes(amount: number) {
  const formatted = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `KSh ${formatted}`;
}
