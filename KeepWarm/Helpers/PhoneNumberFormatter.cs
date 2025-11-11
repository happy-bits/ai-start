namespace KeepWarm.Helpers;

/// <summary>
/// Helper class for formatting phone numbers consistently for display.
/// </summary>
public static class PhoneNumberFormatter
{
    /// <summary>
    /// Formats a phone number string to a consistent display format.
    /// Supports Swedish phone numbers (mobile, landline) and international formats.
    /// </summary>
    /// <param name="phoneNumber">The phone number to format. Can be null or empty.</param>
    /// <returns>
    /// Formatted phone number string (e.g., "070-123 45 67" or "+46 70 123 45 67").
    /// Returns the original string if formatting fails or if input is null/empty.
    /// </returns>
    public static string? Format(string? phoneNumber)
    {
        // Handle null input
        if (phoneNumber == null)
            return null;

        // Handle empty or whitespace-only input
        var trimmed = phoneNumber.Trim();
        if (string.IsNullOrEmpty(trimmed))
            return "";

        // Normalize the phone number
        var (digits, hasPlusPrefix) = Normalize(trimmed);

        // If normalization resulted in empty or invalid, return original
        if (string.IsNullOrEmpty(digits) || digits.Length < 7)
            return phoneNumber;

        // Route to appropriate formatter
        if (IsSwedishMobile(digits))
        {
            return FormatSwedishMobile(digits);
        }
        else if (IsSwedishLandline(digits))
        {
            return FormatSwedishLandline(digits);
        }
        else if (IsInternational(digits))
        {
            return FormatInternational(digits, hasPlusPrefix);
        }

        // If we can't determine the format, return original
        return phoneNumber;
    }

    /// <summary>
    /// Formats a Swedish mobile phone number (07X) to the format "070-123 45 67".
    /// </summary>
    /// <param name="digits">The phone number digits (should be 10 digits starting with 07).</param>
    /// <returns>Formatted phone number string.</returns>
    private static string FormatSwedishMobile(string digits)
    {
        // Swedish mobile: 0701234567 -> 070-123 45 67
        // Format: XXX-XXX XX XX
        if (digits.Length == 10)
        {
            return $"{digits.Substring(0, 3)}-{digits.Substring(3, 3)} {digits.Substring(6, 2)} {digits.Substring(8, 2)}";
        }

        return digits;
    }

    /// <summary>
    /// Formats a Swedish landline number to the format "08-123 45 67" or "011-123 45".
    /// </summary>
    /// <param name="digits">The phone number digits.</param>
    /// <returns>Formatted phone number string.</returns>
    private static string FormatSwedishLandline(string digits)
    {
        // Swedish landline formats vary by area code length
        // 2-digit area code (08): 081234567 -> 08-123 45 67
        // 3-digit area code (011): 01112345 -> 011-123 45

        if (digits.Length >= 7 && digits.Length <= 9)
        {
            // Try 2-digit area code first (most common: Stockholm 08)
            if (digits.Length == 9 && digits.StartsWith("08"))
            {
                return $"{digits.Substring(0, 2)}-{digits.Substring(2, 3)} {digits.Substring(5, 2)} {digits.Substring(7, 2)}";
            }
            // 3-digit area code
            else if (digits.Length == 8 && digits.StartsWith("011"))
            {
                return $"{digits.Substring(0, 3)}-{digits.Substring(3, 3)} {digits.Substring(6, 2)}";
            }
            // Other 3-digit area codes
            else if (digits.Length == 9 && (digits.StartsWith("031") || digits.StartsWith("040")))
            {
                return $"{digits.Substring(0, 3)}-{digits.Substring(3, 3)} {digits.Substring(6, 2)} {digits.Substring(8, 1)}";
            }
            // Generic fallback for other lengths
            else if (digits.Length == 8)
            {
                // Try 2-digit area code
                return $"{digits.Substring(0, 2)}-{digits.Substring(2, 3)} {digits.Substring(5, 3)}";
            }
            else if (digits.Length == 7)
            {
                // Try 2-digit area code
                return $"{digits.Substring(0, 2)}-{digits.Substring(2, 2)} {digits.Substring(4, 3)}";
            }
        }

        return digits;
    }

    /// <summary>
    /// Formats an international phone number to the format "+46 70 123 45 67".
    /// </summary>
    /// <param name="digits">The phone number digits including country code.</param>
    /// <param name="hasPlusPrefix">Whether the original number had a '+' prefix.</param>
    /// <returns>Formatted phone number string.</returns>
    private static string FormatInternational(string digits, bool hasPlusPrefix)
    {
        // Handle Swedish international format: 46701234567 -> +46 70 123 45 67
        if (digits.StartsWith("46") && digits.Length == 11)
        {
            var swedishNumber = digits.Substring(2); // Remove country code (9 digits, leading 0 removed)
            // Swedish international format: country code + mobile prefix (without leading 0) + 7 digits
            // Format as: +46 70 123 45 67
            return $"+46 {swedishNumber.Substring(0, 2)} {swedishNumber.Substring(2, 3)} {swedishNumber.Substring(5, 2)} {swedishNumber.Substring(7, 2)}";
        }

        // Handle US format: 14155552671 -> +1 415 555 2671
        if (digits.StartsWith("1") && digits.Length == 11)
        {
            return $"+1 {digits.Substring(1, 3)} {digits.Substring(4, 3)} {digits.Substring(7, 4)}";
        }

        // Handle UK format: 442071234567 -> +44 20 7123 4567
        if (digits.StartsWith("44") && digits.Length >= 10)
        {
            var ukNumber = digits.Substring(2);
            if (ukNumber.Length >= 8)
            {
                // London area code (20) is 2 digits
                if (ukNumber.StartsWith("20") && ukNumber.Length == 10)
                {
                    return $"+44 {ukNumber.Substring(0, 2)} {ukNumber.Substring(2, 4)} {ukNumber.Substring(6, 4)}";
                }
            }
        }

        // Generic international format: add + prefix and space every 2-3 digits
        var prefix = hasPlusPrefix ? "+" : "";
        if (digits.Length <= 12)
        {
            // Simple formatting for shorter numbers
            var formatted = prefix;
            for (int i = 0; i < digits.Length; i++)
            {
                if (i > 0 && i % 3 == 0)
                    formatted += " ";
                formatted += digits[i];
            }
            return formatted;
        }

        return prefix + digits;
    }

    /// <summary>
    /// Normalizes a phone number by removing all non-digit characters except '+'.
    /// </summary>
    /// <param name="phoneNumber">The phone number to normalize.</param>
    /// <returns>A tuple containing the normalized digits and whether the original had a '+' prefix.</returns>
    private static (string digits, bool hasPlusPrefix) Normalize(string phoneNumber)
    {
        bool hasPlusPrefix = phoneNumber.StartsWith("+");
        
        // Remove all non-digit characters
        var digits = new string(phoneNumber.Where(char.IsDigit).ToArray());

        // Handle 00 prefix (international format without +)
        if (digits.StartsWith("00"))
        {
            digits = digits.Substring(2);
            hasPlusPrefix = true; // Treat as international
        }

        return (digits, hasPlusPrefix);
    }

    /// <summary>
    /// Determines if a phone number is a Swedish mobile number (starts with 07X).
    /// </summary>
    /// <param name="digits">The normalized phone number digits.</param>
    /// <returns>True if it's a Swedish mobile number.</returns>
    private static bool IsSwedishMobile(string digits)
    {
        // Swedish mobile numbers: 10 digits starting with 07 (070, 071, 072, 073, 076, 079)
        return digits.Length == 10 && 
               digits.StartsWith("07") && 
               (digits[2] == '0' || digits[2] == '1' || digits[2] == '2' || digits[2] == '3' || digits[2] == '6' || digits[2] == '9');
    }

    /// <summary>
    /// Determines if a phone number is a Swedish landline number.
    /// </summary>
    /// <param name="digits">The normalized phone number digits.</param>
    /// <returns>True if it's a Swedish landline number.</returns>
    private static bool IsSwedishLandline(string digits)
    {
        // Swedish landline: starts with 0, not 07X, length 7-9 digits
        return digits.Length >= 7 && 
               digits.Length <= 9 && 
               digits.StartsWith("0") && 
               !IsSwedishMobile(digits);
    }

    /// <summary>
    /// Determines if a phone number is an international format (starts with country code).
    /// </summary>
    /// <param name="digits">The normalized phone number digits.</param>
    /// <returns>True if it's an international format.</returns>
    private static bool IsInternational(string digits)
    {
        // International formats: starts with country code (1, 44, 46, etc.) and is longer than Swedish numbers
        // Swedish numbers are max 10 digits, so international should be 11+ digits
        if (digits.Length >= 11)
            return true;

        // Also check for known country codes at the start
        if (digits.StartsWith("1") && digits.Length == 11) // US/Canada
            return true;
        if (digits.StartsWith("44") && digits.Length >= 10) // UK
            return true;
        if (digits.StartsWith("46") && digits.Length == 11) // Sweden international
            return true;

        return false;
    }
}

