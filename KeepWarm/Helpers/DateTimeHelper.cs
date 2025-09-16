using System;

namespace KeepWarm.Helpers
{
    public static class DateTimeHelper
    {
        /// <summary>
        /// Formaterar DateTime till formatet yyyy-MM-dd HH:mm (utan sekunder och millisekunder)
        /// </summary>
        /// <param name="dateTime">DateTime att formatera</param>
        /// <returns>Formaterad DateTime utan sekunder och millisekunder</returns>
        public static DateTime FormatToMinutePrecision(DateTime dateTime)
        {
            return new DateTime(
                dateTime.Year,
                dateTime.Month,
                dateTime.Day,
                dateTime.Hour,
                dateTime.Minute,
                0, // sekunder = 0
                0  // millisekunder = 0
            );
        }

        /// <summary>
        /// Formaterar DateTime till formatet yyyy-MM-dd HH:mm för visning
        /// </summary>
        /// <param name="dateTime">DateTime att formatera</param>
        /// <returns>Formaterad sträng i formatet yyyy-MM-dd HH:mm</returns>
        public static string FormatForDisplay(DateTime dateTime)
        {
            return FormatToMinutePrecision(dateTime).ToString("yyyy-MM-dd HH:mm");
        }

        /// <summary>
        /// Formaterar DateTime till formatet som krävs för datetime-local input
        /// </summary>
        /// <param name="dateTime">DateTime att formatera</param>
        /// <returns>Formaterad sträng för datetime-local input</returns>
        public static string FormatForDateTimeLocalInput(DateTime dateTime)
        {
            return FormatToMinutePrecision(dateTime).ToString("yyyy-MM-ddTHH:mm");
        }
    }
}
