using KeepWarm.Helpers;

namespace KeepWarm.Tests.Helpers
{
    public class DateTimeHelperTests
    {
        [Fact]
        public void FormatToMinutePrecision_ShouldRemoveSecondsAndMilliseconds()
        {
            // Arrange
            var originalDateTime = new DateTime(2025, 9, 16, 14, 30, 45, 123);

            // Act
            var result = DateTimeHelper.FormatToMinutePrecision(originalDateTime);

            // Assert
            Assert.Equal(2025, result.Year);
            Assert.Equal(9, result.Month);
            Assert.Equal(16, result.Day);
            Assert.Equal(14, result.Hour);
            Assert.Equal(30, result.Minute);
            Assert.Equal(0, result.Second);
            Assert.Equal(0, result.Millisecond);
        }

        [Fact]
        public void FormatToMinutePrecision_ShouldPreserveDateAndTimeToMinute()
        {
            // Arrange
            var originalDateTime = new DateTime(2024, 12, 25, 9, 15, 30, 500);

            // Act
            var result = DateTimeHelper.FormatToMinutePrecision(originalDateTime);

            // Assert
            Assert.Equal(new DateTime(2024, 12, 25, 9, 15, 0, 0), result);
        }

        [Fact]
        public void FormatForDisplay_ShouldReturnCorrectFormat()
        {
            // Arrange
            var dateTime = new DateTime(2025, 9, 16, 14, 30, 0, 0);

            // Act
            var result = DateTimeHelper.FormatForDisplay(dateTime);

            // Assert
            Assert.Equal("2025-09-16 14:30", result);
        }

        [Fact]
        public void FormatForDisplay_ShouldHandleSingleDigitValues()
        {
            // Arrange
            var dateTime = new DateTime(2025, 1, 5, 9, 5, 0, 0);

            // Act
            var result = DateTimeHelper.FormatForDisplay(dateTime);

            // Assert
            Assert.Equal("2025-01-05 09:05", result);
        }

        [Fact]
        public void FormatForDateTimeLocalInput_ShouldReturnCorrectFormat()
        {
            // Arrange
            var dateTime = new DateTime(2025, 9, 16, 14, 30, 0, 0);

            // Act
            var result = DateTimeHelper.FormatForDateTimeLocalInput(dateTime);

            // Assert
            Assert.Equal("2025-09-16T14:30", result);
        }

        [Fact]
        public void FormatForDateTimeLocalInput_ShouldHandleSingleDigitValues()
        {
            // Arrange
            var dateTime = new DateTime(2025, 1, 5, 9, 5, 0, 0);

            // Act
            var result = DateTimeHelper.FormatForDateTimeLocalInput(dateTime);

            // Assert
            Assert.Equal("2025-01-05T09:05", result);
        }
    }
}
