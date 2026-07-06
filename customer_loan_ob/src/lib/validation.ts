import { parseMoneyInput } from "@/lib/currency";

const vietnameseNameRegex = /^[A-Za-zÀ-ỹ]+(?:[\s'-][A-Za-zÀ-ỹ]+)+$/;
const repeatedCharRegex = /(.)\1{4,}/i;
const vnPhoneRegex = /^(0)(3|5|7|8|9)[0-9]{8}$/;
const licensePlateRegex = /^[0-9]{2}[A-Z]{1,2}[0-9A-Z]?[-.]?[0-9]{4,5}$/;
const alphaNumericRegex = /^[A-Z0-9]+$/;
const noisyTextRegex = /^[^A-Za-zÀ-ỹ0-9]+$/;

export function normalizeText(value?: string) {
  return (value || "").trim().replace(/\s+/g, " ");
}

export function isValidVietnameseFullName(value?: string) {
  const normalizedValue = normalizeText(value);

  if (!vietnameseNameRegex.test(normalizedValue)) return false;
  if (repeatedCharRegex.test(normalizedValue)) return false;
  if (/\d/.test(normalizedValue)) return false;

  const words = normalizedValue.split(" ");

  return (
    words.length >= 2 &&
    normalizedValue.length >= 5 &&
    words.some((word) => word.length >= 2)
  );
}

export function isValidCccd(value?: string) {
  return /^\d{12}$/.test(normalizeText(value));
}

export function isValidVnPhone(value?: string) {
  return vnPhoneRegex.test(normalizeText(value));
}

export function isValidPositiveMoney(value?: string) {
  const parsedValue = parseMoneyInput(value);

  return parsedValue !== null && parsedValue > 0;
}

export function isValidPastDate(value?: string) {
  const normalizedValue = normalizeText(value);
  const dateValue = /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(normalizedValue)
    ? normalizedValue.replace(/\//g, "-").split("-").reverse().join("-")
    : normalizedValue;
  const parsedDate = new Date(dateValue);

  return !Number.isNaN(parsedDate.getTime()) && parsedDate <= new Date();
}

export function isValidAdultBirthDate(value?: string) {
  if (!isValidPastDate(value)) return false;

  const normalizedValue = normalizeText(value);
  const dateValue = /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(normalizedValue)
    ? normalizedValue.replace(/\//g, "-").split("-").reverse().join("-")
    : normalizedValue;
  const birthDate = new Date(dateValue);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 18 && age <= 75;
}

export function isValidLicensePlate(value?: string) {
  return licensePlateRegex.test(normalizeText(value).toUpperCase());
}

export function isValidVehicleIdentifier(value?: string, minLength = 5, maxLength = 30) {
  const normalizedValue = normalizeText(value).toUpperCase();

  return (
    normalizedValue.length >= minLength &&
    normalizedValue.length <= maxLength &&
    alphaNumericRegex.test(normalizedValue)
  );
}

export function isValidVehicleOptionText(value?: string, maxLength = 80) {
  const normalizedValue = normalizeText(value);

  return (
    normalizedValue.length > 0 &&
    normalizedValue.length <= maxLength &&
    !noisyTextRegex.test(normalizedValue) &&
    !repeatedCharRegex.test(normalizedValue)
  );
}

export function isValidManufactureYear(value?: string) {
  const year = Number(value);
  const currentYear = new Date().getFullYear();

  return Number.isInteger(year) && year >= 1990 && year <= currentYear;
}

export function isValidRegistrationDisplayDate(value?: string) {
  const normalizedValue = normalizeText(value);

  return (
    normalizedValue === "" ||
    (/^\d{2}\/\d{2}\/\d{4}$/.test(normalizedValue) && isValidPastDate(normalizedValue))
  );
}
