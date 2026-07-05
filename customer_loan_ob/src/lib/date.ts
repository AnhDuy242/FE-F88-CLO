import { format, isValid, parse } from "date-fns";

const DISPLAY_DATE_FORMAT = "dd/MM/yyyy";
const API_DATE_FORMAT = "yyyy-MM-dd";
const ACCEPTED_DATE_FORMATS = [
  DISPLAY_DATE_FORMAT,
  "dd-MM-yyyy",
  API_DATE_FORMAT,
];

export function parseDateValue(value?: string | null) {
  const normalizedValue = (value || "").trim();

  if (!normalizedValue) return undefined;

  for (const dateFormat of ACCEPTED_DATE_FORMATS) {
    const parsedDate = parse(normalizedValue, dateFormat, new Date());

    if (
      isValid(parsedDate) &&
      format(parsedDate, dateFormat) === normalizedValue
    ) {
      return parsedDate;
    }
  }

  return undefined;
}

export function formatDateToDisplay(value?: string | Date | null) {
  const parsedDate =
    value instanceof Date ? value : parseDateValue(String(value || ""));

  return parsedDate && isValid(parsedDate)
    ? format(parsedDate, DISPLAY_DATE_FORMAT)
    : "";
}

export function normalizeDateForDisplay(value?: string | null) {
  return formatDateToDisplay(value);
}

export function parseDisplayDateToApi(value?: string | null) {
  const parsedDate = parseDateValue(value);

  return parsedDate && isValid(parsedDate) ? format(parsedDate, API_DATE_FORMAT) : "";
}
