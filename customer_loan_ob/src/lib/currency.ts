export function getCurrencyDigits(value?: string | number | null) {
  return String(value ?? "").replace(/\D/g, "");
}

export function formatCurrencyInput(value?: string | number | null) {
  const digitsOnly = getCurrencyDigits(value);

  if (!digitsOnly) return "";

  const normalizedValue = digitsOnly.replace(/^0+(?=\d)/, "");

  return normalizedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseCurrencyToNumber(value?: string | number | null) {
  const digitsOnly = getCurrencyDigits(value);

  if (!digitsOnly) return 0;

  return Number(digitsOnly);
}

export function formatCurrencyVnd(value?: number | string | null) {
  const numericValue =
    typeof value === "number" ? value : parseCurrencyToNumber(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

  return `${Math.max(Math.round(safeValue), 0).toLocaleString("vi-VN")} đ`;
}
