using System.ComponentModel.DataAnnotations;

namespace KeepWarm.Controllers.ViewModels
{
    public class LoginViewModel
    {
        [Required(ErrorMessage = "E-post är obligatoriskt")]
        [EmailAddress(ErrorMessage = "Ogiltig e-postadress")]
        [Display(Name = "E-post")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Lösenord är obligatoriskt")]
        [DataType(DataType.Password)]
        [Display(Name = "Lösenord")]
        public string Password { get; set; } = string.Empty;

        [Display(Name = "Kom ihåg mig")]
        public bool RememberMe { get; set; }
    }
}
