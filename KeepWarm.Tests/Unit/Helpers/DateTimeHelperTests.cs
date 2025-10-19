using KeepWarm.Helpers;
using Shouldly;

namespace KeepWarm.Tests.Unit.Helpers;

/// <summary>
/// Enhetstester för DateTimeHelper
/// Testar datumformatering utan externa beroenden
/// </summary>
public class DateTimeHelperTests
{
    [Fact]
    public void FormatToMinutePrecision_MedSekunderOchMillisekunder_TarBortSekunderOchMillisekunder()
    {
        // Given - Ett datum med sekunder och millisekunder
        var dateTime = new DateTime(2025, 10, 4, 14, 30, 45, 123);

        // When - Formaterar till minutprecision
        var result = DateTimeHelper.FormatToMinutePrecision(dateTime);

        // Then - Sekunder och millisekunder ska vara noll
        result.Year.ShouldBe(2025);
        result.Month.ShouldBe(10);
        result.Day.ShouldBe(4);
        result.Hour.ShouldBe(14);
        result.Minute.ShouldBe(30);
        result.Second.ShouldBe(0);
        result.Millisecond.ShouldBe(0);
    }

    [Fact]
    public void FormatToMinutePrecision_MedRedanKorrektPrecision_BeharallerVardet()
    {
        // Given - Ett datum som redan har minutprecision
        var dateTime = new DateTime(2025, 10, 4, 14, 30, 0, 0);

        // When - Formaterar till minutprecision
        var result = DateTimeHelper.FormatToMinutePrecision(dateTime);

        // Then - Värdet ska vara oförändrat
        result.ShouldBe(dateTime);
    }

    [Fact]
    public void FormatToMinutePrecision_MedMidnatt_HanterarKorrekt()
    {
        // Given - Ett datum vid midnatt med sekunder
        var dateTime = new DateTime(2025, 10, 4, 0, 0, 59, 999);

        // When - Formaterar till minutprecision
        var result = DateTimeHelper.FormatToMinutePrecision(dateTime);

        // Then - Ska bli midnatt exakt
        result.ShouldBe(new DateTime(2025, 10, 4, 0, 0, 0, 0));
    }

    [Fact]
    public void FormatForDisplay_MedDatum_ReturnearKorrektFormat()
    {
        // Given - Ett specifikt datum
        var dateTime = new DateTime(2025, 10, 4, 14, 30, 45, 123);

        // When - Formaterar för visning
        var result = DateTimeHelper.FormatForDisplay(dateTime);

        // Then - Ska returnera format yyyy-MM-dd HH:mm
        result.ShouldBe("2025-10-04 14:30");
    }

    [Fact]
    public void FormatForDisplay_MedEnSiffrigMånadOchDag_LäggerTillLedingnoll()
    {
        // Given - Ett datum med ensiffriga värden
        var dateTime = new DateTime(2025, 1, 5, 9, 8, 0, 0);

        // When - Formaterar för visning
        var result = DateTimeHelper.FormatForDisplay(dateTime);

        // Then - Ska ha ledingnollor
        result.ShouldBe("2025-01-05 09:08");
    }

    [Fact]
    public void FormatForDateTimeLocalInput_MedDatum_ReturnearKorrektFormat()
    {
        // Given - Ett specifikt datum
        var dateTime = new DateTime(2025, 10, 4, 14, 30, 45, 123);

        // When - Formaterar för datetime-local input
        var result = DateTimeHelper.FormatForDateTimeLocalInput(dateTime);

        // Then - Ska returnera format yyyy-MM-ddTHH:mm (ISO 8601 för HTML5 input)
        result.ShouldBe("2025-10-04T14:30");
    }

    [Fact]
    public void FormatForDateTimeLocalInput_MedÅretsSista_HanterarKorrekt()
    {
        // Given - Årets sista dag och tid
        var dateTime = new DateTime(2025, 12, 31, 23, 59, 59, 999);

        // When - Formaterar för datetime-local input
        var result = DateTimeHelper.FormatForDateTimeLocalInput(dateTime);

        // Then - Ska hantera gränsvärden korrekt
        result.ShouldBe("2025-12-31T23:59");
    }

    [Theory]
    [InlineData(2025, 1, 1, 0, 0, 0, "2025-01-01 00:00")]
    [InlineData(2025, 6, 15, 12, 30, 45, "2025-06-15 12:30")]
    [InlineData(2025, 12, 31, 23, 59, 59, "2025-12-31 23:59")]
    public void FormatForDisplay_MedOlikaIndata_ReturnearKorrektFormat(
        int year, int month, int day, int hour, int minute, int second, string expected)
    {
        // Given - Olika datumkombinationer
        var dateTime = new DateTime(year, month, day, hour, minute, second);

        // When - Formaterar för visning
        var result = DateTimeHelper.FormatForDisplay(dateTime);

        // Then - Ska matcha förväntat format
        result.ShouldBe(expected);
    }

    [Theory]
    [InlineData(2025, 1, 1, 0, 0, 0, "2025-01-01T00:00")]
    [InlineData(2025, 6, 15, 12, 30, 45, "2025-06-15T12:30")]
    [InlineData(2025, 12, 31, 23, 59, 59, "2025-12-31T23:59")]
    public void FormatForDateTimeLocalInput_MedOlikaIndata_ReturnearKorrektFormat(
        int year, int month, int day, int hour, int minute, int second, string expected)
    {
        // Given - Olika datumkombinationer
        var dateTime = new DateTime(year, month, day, hour, minute, second);

        // When - Formaterar för datetime-local input
        var result = DateTimeHelper.FormatForDateTimeLocalInput(dateTime);

        // Then - Ska matcha förväntat format
        result.ShouldBe(expected);
    }
}

