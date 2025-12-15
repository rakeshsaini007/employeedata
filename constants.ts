// Replace this URL with your actual Google Apps Script Web App URL
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZc0-LVEPZF2GMGhMXn4maj8QHskne6BWKrKNGVlFN9RyueBmGC9SFhG1uAsOCxjfw4w/exec';

export const REGEX = {
  // 12 Digits
  ADHAR: /^\d{12}$/,
  // Alphanumeric + / + \
  EPIC: /^[a-zA-Z0-9/\\\\]+$/,
  // 5 Uppercase letters, 4 Digits, 1 Uppercase letter
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  // Standard Indian mobile validation (Starts with 6-9, followed by 9 digits)
  MOBILE: /^[6-9]\d{9}$/,
  // Ends with @gmail.com
  GMAIL: /^[a-zA-Z0-9._%+-]+@gmail\.com$/
};
