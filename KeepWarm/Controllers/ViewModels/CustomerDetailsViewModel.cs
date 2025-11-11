using KeepWarm.Models;

namespace KeepWarm.Controllers.ViewModels
{
    public class CustomerDetailsViewModel
    {
        public Customer Customer { get; set; } = null!;
        public IEnumerable<Interaction> Interactions { get; set; } = Enumerable.Empty<Interaction>();
        public InteractionCreateViewModel CreateInteractionModel { get; set; } = new InteractionCreateViewModel();
    }
}

