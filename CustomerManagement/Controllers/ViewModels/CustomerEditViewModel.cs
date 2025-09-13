using System.ComponentModel.DataAnnotations;

namespace CustomerManagement.Controllers.ViewModels
{
    public class CustomerEditViewModel
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Förnamn är obligatoriskt")]
        [StringLength(100, ErrorMessage = "Förnamn får inte vara längre än 100 tecken")]
        [Display(Name = "Förnamn")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Efternamn är obligatoriskt")]
        [StringLength(100, ErrorMessage = "Efternamn får inte vara längre än 100 tecken")]
        [Display(Name = "Efternamn")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "E-post är obligatoriskt")]
        [EmailAddress(ErrorMessage = "Ogiltig e-postadress")]
        [StringLength(255, ErrorMessage = "E-post får inte vara längre än 255 tecken")]
        [Display(Name = "E-post")]
        public string Email { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Ogiltigt telefonnummer")]
        [StringLength(20, ErrorMessage = "Telefonnummer får inte vara längre än 20 tecken")]
        [Display(Name = "Telefon")]
        public string? Phone { get; set; }

        [StringLength(500, ErrorMessage = "Adress får inte vara längre än 500 tecken")]
        [Display(Name = "Adress")]
        public string? Address { get; set; }

        [StringLength(100, ErrorMessage = "Stad får inte vara längre än 100 tecken")]
        [Display(Name = "Stad")]
        public string? City { get; set; }

        [StringLength(10, ErrorMessage = "Postnummer får inte vara längre än 10 tecken")]
        [Display(Name = "Postnummer")]
        public string? PostalCode { get; set; }

        [StringLength(100, ErrorMessage = "Land får inte vara längre än 100 tecken")]
        [Display(Name = "Land")]
        public string? Country { get; set; }
    }
}
