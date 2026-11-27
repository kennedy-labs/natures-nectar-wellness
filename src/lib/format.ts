export function formatKes(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const isNegative = safe < 0;
  const abs = Math.abs(safe);
  const rounded = Math.round(abs * 100) / 100;
  const fixed = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/\.?0+$/, "");
  const [intPart, decPart] = fixed.split(".");
  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted = decPart ? `${groupedInt}.${decPart}` : groupedInt;
  return `${isNegative ? "-" : ""}Ksh ${formatted}`;
}
