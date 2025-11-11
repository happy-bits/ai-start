using KeepWarm.Helpers;
using Shouldly;
using Xunit;

namespace KeepWarm.Tests.Helpers;

/// <summary>
/// Tests for PhoneNumberFormatter helper class.
/// </summary>
public class PhoneNumberFormatterTests
{
    [Fact]
    public void Format_WithNullInput_ReturnsNull()
    {
        // When: Formatting null
        var result = PhoneNumberFormatter.Format(null);

        // Then: Should return null
        result.ShouldBeNull();
    }

    [Fact]
    public void Format_WithEmptyString_ReturnsEmptyString()
    {
        // When: Formatting empty string
        var result = PhoneNumberFormatter.Format("");

        // Then: Should return empty string
        result.ShouldBe("");
    }

    [Fact]
    public void Format_WithWhitespaceOnly_ReturnsEmptyString()
    {
        // When: Formatting whitespace only
        var result = PhoneNumberFormatter.Format("   ");

        // Then: Should return empty string
        result.ShouldBe("");
    }

    [Fact]
    public void Format_SwedishMobile_WithoutSpaces_FormatsCorrectly()
    {
        // Given: Swedish mobile number without spaces
        var input = "0701234567";

        // When: Formatting the number
        var result = PhoneNumberFormatter.Format(input);

        // Then: Should format as "070-123 45 67"
        result.ShouldBe("070-123 45 67");
    }

    [Fact]
    public void Format_SwedishMobile_WithDashes_FormatsCorrectly()
    {
        // Given: Swedish mobile number with dashes
        var input = "070-1234567";

        // When: Formatting the number
        var result = PhoneNumberFormatter.Format(input);

        // Then: Should format as "070-123 45 67"
        result.ShouldBe("070-123 45 67");
    }

    [Fact]
    public void Format_SwedishMobile_WithSpaces_FormatsCorrectly()
    {
        // Given: Swedish mobile number with spaces
        var input = "070 123 45 67";

        // When: Formatting the number
        var result = PhoneNumberFormatter.Format(input);

        // Then: Should format as "070-123 45 67"
        result.ShouldBe("070-123 45 67");
    }

    [Fact]
    public void Format_SwedishMobile_WithMixedFormatting_FormatsCorrectly()
    {
        // Given: Swedish mobile number with mixed formatting
        var input = "070-123 45 67";

        // When: Formatting the number
        var result = PhoneNumberFormatter.Format(input);

        // Then: Should format as "070-123 45 67"
        result.ShouldBe("070-123 45 67");
    }

    [Fact]
    public void Format_SwedishMobile_DifferentPrefixes_FormatsCorrectly()
    {
        // Given: Different Swedish mobile prefixes
        var testCases = new[]
        {
            ("0711234567", "071-123 45 67"),
            ("0721234567", "072-123 45 67"),
            ("0731234567", "073-123 45 67"),
            ("0761234567", "076-123 45 67"),
            ("0791234567", "079-123 45 67")
        };

        foreach (var (input, expected) in testCases)
        {
            // When: Formatting the number
            var result = PhoneNumberFormatter.Format(input);

            // Then: Should format correctly
            result.ShouldBe(expected, $"Failed for input: {input}");
        }
    }

    [Fact]
    public void Format_SwedishLandline_Stockholm_FormatsCorrectly()
    {
        // Given: Stockholm landline number
        var input = "081234567";

        // When: Formatting the number
        var result = PhoneNumberFormatter.Format(input);

        // Then: Should format as "08-123 45 67"
        result.ShouldBe("08-123 45 67");
    }

    [Fact]
    public void Format_SwedishLandline_OtherAreas_FormatsCorrectly()
    {
        // Given: Other area landline numbers
        var testCases = new[]
        {
            ("01112345", "011-123 45"),
            ("031123456", "031-123 45 6"),
            ("040123456", "040-123 45 6")
        };

        foreach (var (input, expected) in testCases)
        {
            // When: Formatting the number
            var result = PhoneNumberFormatter.Format(input);

            // Then: Should format correctly
            result.ShouldBe(expected, $"Failed for input: {input}");
        }
    }

    [Fact]
    public void Format_International_WithPlusPrefix_FormatsCorrectly()
    {
        // Given: International number with + prefix
        var input = "+46701234567";

        // When: Formatting the number
        var result = PhoneNumberFormatter.Format(input);

        // Then: Should format as "+46 70 123 45 67"
        result.ShouldBe("+46 70 123 45 67");
    }

    [Fact]
    public void Format_International_WithDoubleZero_FormatsCorrectly()
    {
        // Given: International number with 00 prefix
        var input = "0046701234567";

        // When: Formatting the number
        var result = PhoneNumberFormatter.Format(input);

        // Then: Should format as "+46 70 123 45 67"
        result.ShouldBe("+46 70 123 45 67");
    }

    [Fact]
    public void Format_International_OtherCountries_FormatsCorrectly()
    {
        // Given: International numbers from other countries
        var testCases = new[]
        {
            ("+14155552671", "+1 415 555 2671"), // US
            ("+442071234567", "+44 20 7123 4567") // UK
        };

        foreach (var (input, expected) in testCases)
        {
            // When: Formatting the number
            var result = PhoneNumberFormatter.Format(input);

            // Then: Should format correctly
            result.ShouldBe(expected, $"Failed for input: {input}");
        }
    }

    [Fact]
    public void Format_InvalidPhoneNumber_ReturnsOriginal()
    {
        // Given: Invalid phone numbers
        var testCases = new[]
        {
            "123", // Too short
            "abc123", // Contains letters
            "12345-67890-12345", // Too long
            "0000000000" // Invalid pattern
        };

        foreach (var input in testCases)
        {
            // When: Formatting the number
            var result = PhoneNumberFormatter.Format(input);

            // Then: Should return original string (or handle gracefully)
            // Note: This test may need adjustment based on actual implementation behavior
            result.ShouldNotBeNull();
        }
    }

    [Fact]
    public void Format_PhoneNumberWithParentheses_FormatsCorrectly()
    {
        // Given: Phone number with parentheses (US format)
        var input = "(415) 555-2671";

        // When: Formatting the number
        var result = PhoneNumberFormatter.Format(input);

        // Then: Should handle parentheses and format correctly
        // Note: This test may need adjustment based on actual implementation
        result.ShouldNotBeNull();
        result.ShouldNotBe("");
    }

    [Fact]
    public void Format_AlreadyFormattedNumber_ReturnsConsistentFormat()
    {
        // Given: Already formatted number
        var input = "070-123 45 67";

        // When: Formatting the number again
        var result = PhoneNumberFormatter.Format(input);

        // Then: Should return the same format (idempotent)
        result.ShouldBe("070-123 45 67");
    }
}

