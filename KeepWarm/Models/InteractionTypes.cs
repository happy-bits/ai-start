namespace KeepWarm.Models
{
    /// <summary>
    /// Tillgängliga interaktionstyper i systemet
    /// </summary>
    public static class InteractionTypes
    {
        public static readonly List<string> All = new()
        {
            "Telefonsamtal",
            "Fysiskt möte",
            "Videomöte",
            "LinkedIn",
            "SMS",
            "Mail"
        };
    }
}

