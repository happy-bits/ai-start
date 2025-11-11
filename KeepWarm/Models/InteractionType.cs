using System.ComponentModel.DataAnnotations;

namespace KeepWarm.Models
{
    public enum InteractionType
    {
        [Display(Name = "Samtal")]
        Call,
        
        [Display(Name = "Möte")]
        Meeting,
        
        [Display(Name = "E-post")]
        Email
    }
}

