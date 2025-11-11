using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace KeepWarm.Helpers
{
    public class LinkedInUrlAttribute : ValidationAttribute
    {
        private static readonly Regex LinkedInUrlPattern = new(
            @"^https?://(www\.)?linkedin\.com/.*",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        public LinkedInUrlAttribute()
        {
            ErrorMessage = "LinkedIn-adressen måste vara en giltig LinkedIn-URL (t.ex. https://linkedin.com/in/profilnamn eller https://www.linkedin.com/in/profilnamn)";
        }

        public override bool IsValid(object? value)
        {
            // Null or empty values are valid (field is optional)
            if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
            {
                return true;
            }

            var url = value.ToString()!;
            return LinkedInUrlPattern.IsMatch(url);
        }
    }
}

