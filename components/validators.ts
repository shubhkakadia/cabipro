import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

export const formatPhoneToNational = (phone: string) => {
  if (!phone || typeof phone !== "string" || phone.trim() === "") return phone; // Return as-is if empty
  try {
    const phoneNumber = parsePhoneNumber(phone.trim(), "AU");
    if (phoneNumber && phoneNumber.isValid()) {
      // Return in national format (e.g., "0400 123 456")
      return phoneNumber.formatNational();
    }
    // If parsing fails, return original value
    return phone.trim();
  } catch (error) {
    console.error("Error formatting phone number:", error);
    // If parsing fails, return original value
    return phone.trim();
  }
};

export const validatePhone = (phone: string) => {
  if (!phone || typeof phone !== "string" || phone.trim() === "") return true; // Allow empty values
  try {
    // Try to parse as Australian number
    return isValidPhoneNumber(phone.trim(), "AU");
  } catch (error) {
    console.error("Error validating phone number:", error);
    return false;
  }
};
