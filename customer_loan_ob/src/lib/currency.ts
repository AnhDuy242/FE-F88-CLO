export function onlyDigits(value?: string | number | null) {
  return String(value ?? "").replace(/\D/g, "");
}

export function formatMoneyInput(value?: string | number | null) {
  const digitsOnly = onlyDigits(value);

  if (!digitsOnly) return "";

  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseMoneyInput(value?: string | number | null) {
  const digitsOnly = onlyDigits(value);

  if (!digitsOnly) return null;

  return Number(digitsOnly);
}

export function getCurrencyDigits(value?: string | number | null) {
  return onlyDigits(value);
}

export function formatCurrencyInput(value?: string | number | null) {
  return formatMoneyInput(value);
}

export function parseCurrencyToNumber(value?: string | number | null) {
  return parseMoneyInput(value) ?? 0;
}

export function formatCurrencyVnd(value?: number | string | null) {
  const numericValue =
    typeof value === "number" ? value : parseMoneyInput(value);
  const safeValue =
    typeof numericValue === "number" && Number.isFinite(numericValue)
      ? numericValue
      : 0;

  return `${Math.max(Math.round(safeValue), 0).toLocaleString("vi-VN")} đ`;
}
