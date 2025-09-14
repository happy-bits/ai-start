# Testbeskrivning för KeepWarm

Denna fil beskriver alla tester i projektet med naturligt språk, en mening per test.

## Controllers

### AccountControllerTests
- **Register_Get_ShouldReturnView**: Registreringssidan ska visa en vy när den begärs.
- **Register_Post_ShouldCreateUser_WhenModelIsValid**: En ny användare ska skapas när giltiga registreringsdata skickas in.
- **Register_Post_ShouldReturnView_WhenModelIsInvalid**: Registreringssidan ska visas igen när ogiltiga data skickas in.
- **Register_Post_ShouldReturnView_WhenUserCreationFails**: Registreringssidan ska visas med felmeddelanden när användarskapandet misslyckas.
- **Login_Get_ShouldReturnView**: Inloggningssidan ska visa en vy när den begärs.
- **Login_Get_ShouldReturnViewWithReturnUrl**: Inloggningssidan ska visa en vy med återgångs-URL när sådan anges.
- **Login_Post_ShouldRedirectToHome_WhenCredentialsAreValid**: Användaren ska omdirigeras till startsidan när korrekta inloggningsuppgifter anges.
- **Login_Post_ShouldRedirectToReturnUrl_WhenCredentialsAreValid**: Användaren ska omdirigeras till den angivna återgångs-URL:en när korrekta inloggningsuppgifter anges.
- **Login_Post_ShouldReturnView_WhenCredentialsAreInvalid**: Inloggningssidan ska visas igen med felmeddelande när felaktiga inloggningsuppgifter anges.
- **Logout_ShouldRedirectToHome**: Användaren ska omdirigeras till startsidan efter utloggning.
- **ManageUsers_ShouldReturnViewWithUsers_WhenUserIsAdmin**: Administratörer ska kunna se en lista över alla användare.
- **CreateUser_Get_ShouldReturnView_WhenUserIsAdmin**: Administratörer ska kunna komma åt sidan för att skapa nya användare.
- **CreateUser_Post_ShouldCreateUser_WhenModelIsValid**: Administratörer ska kunna skapa nya användare när giltiga data anges.
- **CreateUser_Post_ShouldReturnView_WhenModelIsInvalid**: Sidan för att skapa användare ska visas igen när ogiltiga data anges.
- **CreateUser_Post_ShouldReturnView_WhenUserCreationFails**: Sidan för att skapa användare ska visas med felmeddelanden när användarskapandet misslyckas.
- **EditUser_Get_ShouldReturnView_WhenUserIsAdmin**: Administratörer ska kunna komma åt sidan för att redigera användare.
- **EditUser_Get_ShouldReturnNotFound_WhenUserNotFound**: En "inte hittad"-sida ska visas när en icke-existerande användare försöks redigeras.
- **EditUser_Post_ShouldUpdateUser_WhenModelIsValid**: Användare ska uppdateras när giltiga redigeringsdata skickas in.
- **EditUser_Post_ShouldReturnView_WhenModelIsInvalid**: Redigeringssidan ska visas igen när ogiltiga data anges.
- **EditUser_Post_ShouldReturnNotFound_WhenUserNotFound**: En "inte hittad"-sida ska visas när en icke-existerande användare försöks uppdateras.
- **EditUser_Post_ShouldReturnView_WhenUpdateFails**: Redigeringssidan ska visas med felmeddelanden när uppdateringen misslyckas.
- **EditUser_Get_ShouldReturnForbidden_WhenTryingToEditAnotherAdmin**: Administratörer ska inte kunna redigera andra administratörer.
- **EditUser_Get_ShouldReturnView_WhenTryingToEditSelf**: Administratörer ska kunna redigera sin egen profil.
- **EditUser_Post_ShouldReturnForbidden_WhenTryingToEditAnotherAdmin**: Administratörer ska inte kunna uppdatera andra administratörer.
- **EditUser_Post_ShouldUpdateUser_WhenTryingToEditSelf**: Administratörer ska kunna uppdatera sin egen profil.
- **DeleteUser_ShouldDeleteUser_WhenUserIsNotAdmin**: Administratörer ska kunna ta bort vanliga användare.
- **DeleteUser_ShouldReturnNotFound_WhenUserNotFound**: En "inte hittad"-sida ska visas när en icke-existerande användare försöks tas bort.
- **DeleteUser_ShouldReturnForbidden_WhenTryingToDeleteAnotherAdmin**: Administratörer ska inte kunna ta bort andra administratörer.
- **DeleteUser_ShouldReturnForbidden_WhenTryingToDeleteSelf**: Administratörer ska inte kunna ta bort sig själva.
- **DeleteUser_ShouldSetCustomerUserIdToNull_WhenUserHasCustomers**: Kundernas användar-ID ska sättas till null när deras ägare tas bort.
- **DeleteUser_ShouldNotCallIdentityService_WhenUserHasNoCustomers**: Kunduppdateringslogik ska inte anropas när användaren inte har några kunder.

### CustomerControllerTests
- **Index_ShouldReturnViewWithCustomers_WhenUserIsAuthenticated**: Autentiserade användare ska se sina egna kunder på startsidan.
- **Index_ShouldReturnAllCustomers_WhenUserIsAdmin**: Administratörer ska se alla kunder i systemet.
- **Index_ShouldReturnCustomersWithUserData_WhenUserIsAdmin**: Administratörer ska se kunddata tillsammans med ägarinformation.
- **Index_ShouldReturnUnauthorized_WhenUserIsNotAuthenticated**: Icke-autentiserade användare ska inte kunna komma åt kundlistan.
- **Details_ShouldReturnViewWithCustomer_WhenCustomerExistsAndBelongsToUser**: Användare ska kunna se detaljer för sina egna kunder.
- **Details_ShouldReturnNotFound_WhenCustomerDoesNotExist**: En "inte hittad"-sida ska visas för icke-existerande kunder.
- **Details_ShouldReturnCustomer_WhenUserIsAdmin**: Administratörer ska kunna se detaljer för alla kunder.
- **Details_ShouldReturnCustomerWithUserData_WhenUserIsAdmin**: Administratörer ska se kunddetaljer tillsammans med ägarinformation.
- **Create_Get_ShouldReturnView**: Sidan för att skapa kunder ska visa en vy när den begärs.
- **Create_Post_ShouldCreateCustomer_WhenModelIsValid**: Nya kunder ska skapas när giltiga data anges.
- **Create_Post_ShouldReturnView_WhenModelIsInvalid**: Sidan för att skapa kunder ska visas igen när ogiltiga data anges.
- **Edit_Get_ShouldReturnViewWithCustomer_WhenCustomerExists**: Användare ska kunna komma åt redigeringssidan för sina egna kunder.
- **Edit_Get_ShouldReturnNotFound_WhenCustomerDoesNotExist**: En "inte hittad"-sida ska visas när en icke-existerande kund försöks redigeras.
- **Edit_Post_ShouldUpdateCustomer_WhenModelIsValid**: Kunder ska uppdateras när giltiga redigeringsdata skickas in.
- **Edit_Post_ShouldReturnNotFound_WhenCustomerDoesNotExist**: En "inte hittad"-sida ska visas när en icke-existerande kund försöks uppdateras.
- **Delete_Get_ShouldReturnViewWithCustomer_WhenCustomerExists**: Användare ska kunna komma åt bekräftelsesidan för borttagning av sina egna kunder.
- **DeleteConfirmed_ShouldDeleteCustomer_WhenCustomerExists**: Kunder ska tas bort när borttagningen bekräftas.
- **DeleteConfirmed_ShouldReturnNotFound_WhenCustomerDoesNotExist**: En "inte hittad"-sida ska visas när en icke-existerande kund försöks tas bort.
- **Admin_ShouldBeAbleToEditAnyCustomer**: Administratörer ska kunna redigera alla kunder i systemet.

### DeveloperToolsControllerTests
- **RecreateDatabase_ShouldReturnSuccess_WhenBothOperationsSucceed**: Databasåterskapning ska returnera framgång när både databasåterskapning och testdata-tillägg lyckas.
- **RecreateDatabase_ShouldReturnError_WhenRecreateFails**: Databasåterskapning ska returnera fel när databasåterskapningen misslyckas.
- **RecreateDatabase_ShouldReturnError_WhenSeedFails**: Databasåterskapning ska returnera fel när testdata-tillägget misslyckas.
- **RecreateDatabase_ShouldReturnError_WhenExceptionThrown**: Databasåterskapning ska returnera fel och logga undantag när oväntade fel uppstår.
- **LoginAs_ShouldReturnSuccess_WhenUserExists**: Utvecklarinloggning ska lyckas när användaren finns i systemet.
- **LoginAs_ShouldReturnError_WhenUserNotFound**: Utvecklarinloggning ska returnera fel när användaren inte hittas.
- **LoginAs_ShouldReturnError_WhenExceptionThrown**: Utvecklarinloggning ska returnera fel och logga undantag när oväntade fel uppstår.
- **LoginAs_ShouldAcceptValidEmailFormats**: Utvecklarinloggning ska acceptera olika giltiga e-postformat.
- **LoginAs_ShouldHaveHttpPostAttribute**: LoginAs-metoden ska ha HTTP POST-attribut för säkerhet.
- **RecreateDatabase_ShouldHaveHttpPostAttribute**: RecreateDatabase-metoden ska ha HTTP POST-attribut för säkerhet.
- **LoginAs_ShouldSignInWithCorrectParameters**: Utvecklarinloggning ska använda korrekta parametrar för inloggningsprocessen.

### HomeControllerTests
- **Index_ShouldReturnView**: Startsidan ska visa en vy när den begärs.
- **Index_ShouldShowDeveloperTools_WhenEnabled**: Startsidan ska visa utvecklarverktyg när de är aktiverade i konfigurationen.
- **Index_ShouldNotShowDeveloperTools_WhenDisabled**: Startsidan ska inte visa utvecklarverktyg när de är inaktiverade i konfigurationen.
- **Privacy_ShouldReturnView**: Integritetssidan ska visa en vy när den begärs.
- **Error_ShouldReturnViewWithErrorViewModel**: Felsidan ska visa en vy med felmodell som innehåller spårnings-ID.
- **Error_ShouldUseActivityCurrentId_WhenAvailable**: Felsidan ska använda aktivitets-ID som spårnings-ID när det är tillgängligt.
- **Error_ShouldHaveCorrectCacheSettings**: Felmetoden ska ha korrekta cache-inställningar för att förhindra caching.
- **Error_ShouldReturnErrorViewModel_WithShowRequestIdTrue**: Felsidan ska visa spårnings-ID när det finns ett giltigt ID.
- **Error_ShouldReturnErrorViewModel_WithShowRequestIdFalse_WhenRequestIdIsEmpty**: Felsidan ska inte visa spårnings-ID när ID:t är tomt.

## Integration

### AuthenticationIntegrationTests
- **RegisterLoginWorkflow_ShouldWorkEndToEnd**: Hela arbetsflödet från registrering till inloggning ska fungera korrekt.
- **AdminUserManagementWorkflow_ShouldWorkEndToEnd**: Administratörers arbetsflöde för att skapa och redigera användare ska fungera korrekt.
- **KeepWarmWorkflow_ShouldWorkEndToEnd**: Hela arbetsflödet för kundhantering från skapande till borttagning ska fungera korrekt.
- **AdminRoleValidation_ShouldWorkCorrectly**: Rollvalidering för administratörer ska fungera korrekt och ge åtkomst till admin-funktioner.
- **UserRoleValidation_ShouldPreventAccessToAdminFunctions**: Rollvalidering ska förhindra vanliga användare från att komma åt admin-funktioner.
- **WeakPassword_ShouldBeRejected**: Svaga lösenord ska avvisas vid registrering.
- **StrongPassword_ShouldBeAccepted**: Starka lösenord ska accepteras vid registrering.
- **LoginValidation_ShouldWorkCorrectly**: Inloggningsvalidering ska fungera korrekt för både giltiga och ogiltiga uppgifter.
- **CustomerAccessControl_ShouldWorkCorrectly**: Åtkomstkontroll för kunder ska fungera korrekt för både vanliga användare och administratörer.
- **UserDeletion_ShouldHandleCustomersCorrectly**: Borttagning av användare ska hantera associerade kunder korrekt genom att sätta deras användar-ID till null.

## Models

### ApplicationUserTests
- **ApplicationUser_ShouldInheritFromIdentityUser**: ApplicationUser ska ärva från IdentityUser för att få grundläggande användarfunktionalitet.
- **ApplicationUser_ShouldHaveAdditionalProperties**: ApplicationUser ska ha ytterligare egenskaper som förnamn och efternamn.
- **ApplicationUser_ShouldSetTimestampsOnCreation**: ApplicationUser ska automatiskt sätta tidsstämplar när den skapas.
- **ApplicationUser_ShouldHaveNullableStringProperties**: ApplicationUser ska ha nullable strängegenskaper för förnamn och efternamn.
- **ApplicationUser_ShouldAllowSettingOptionalProperties**: ApplicationUser ska tillåta att valfria egenskaper sätts.
- **ApplicationUser_ShouldInheritIdentityUserProperties**: ApplicationUser ska ärva alla standardegenskaper från IdentityUser.
- **ApplicationUser_ShouldHaveCorrectDefaultValues**: ApplicationUser ska ha korrekta standardvärden för tidsstämplar.
- **ApplicationUser_ShouldAcceptValidNames**: ApplicationUser ska acceptera giltiga för- och efternamn.
- **ApplicationUser_ShouldAllowEmptyOptionalProperties**: ApplicationUser ska tillåta tomma valfria egenskaper.

### CustomerTests
- **Customer_ShouldHaveRequiredProperties**: Customer ska ha alla nödvändiga egenskaper definierade.
- **Customer_ShouldSetPropertiesCorrectly**: Customer ska tillåta att alla egenskaper sätts korrekt.
- **Customer_ShouldHaveCorrectDataAnnotations**: Customer ska ha korrekta datavaliderings-attribut för alla fält.
- **Customer_ShouldSetTimestampsOnCreation**: Customer ska automatiskt sätta tidsstämplar när den skapas.
- **Customer_ShouldRequireEssentialFields**: Customer ska kräva att väsentliga fält som förnamn, efternamn och e-post fylls i.
- **Customer_ShouldAcceptValidData**: Customer ska acceptera all giltig kunddata.
- **Customer_ShouldValidateEmailFormat**: Customer ska validera att e-postadresser har korrekt format.

## Security

### RoleBasedAccessTests
- **Admin_ShouldAccessManageUsers**: Administratörer ska kunna komma åt användarhanteringsfunktioner.
- **Admin_ShouldAccessCreateUser**: Administratörer ska kunna komma åt funktionen för att skapa nya användare.
- **Admin_ShouldCreateNewUser**: Administratörer ska kunna skapa nya användare i systemet.
- **Admin_ShouldEditRegularUser**: Administratörer ska kunna redigera vanliga användare.
- **Admin_ShouldNotEditAnotherAdmin**: Administratörer ska inte kunna redigera andra administratörer.
- **Admin_ShouldEditTheirOwnProfile**: Administratörer ska kunna redigera sin egen profil.
- **Admin_ShouldDeleteRegularUser**: Administratörer ska kunna ta bort vanliga användare.
- **Admin_ShouldNotDeleteAnotherAdmin**: Administratörer ska inte kunna ta bort andra administratörer.
- **Admin_ShouldNotDeleteThemselves**: Administratörer ska inte kunna ta bort sig själva.
- **RegularUser_ShouldOnlySeeOwnCustomers**: Vanliga användare ska endast kunna se sina egna kunder.
- **RegularUser_ShouldNotAccessOtherUsersCustomer**: Vanliga användare ska inte kunna komma åt andra användares kunder.
- **RegularUser_ShouldNotEditOtherUsersCustomer**: Vanliga användare ska inte kunna redigera andra användares kunder.
- **RegularUser_ShouldNotDeleteOtherUsersCustomer**: Vanliga användare ska inte kunna ta bort andra användares kunder.
- **Admin_ShouldAccessAllCustomers**: Administratörer ska kunna komma åt alla kunder i systemet.
- **Admin_ShouldAccessAnyCustomer**: Administratörer ska kunna komma åt vilken kund som helst.
- **UnauthenticatedUser_ShouldNotAccessCustomerPages**: Icke-autentiserade användare ska inte kunna komma åt kundsidor.
- **CustomerOwnership_ShouldBeValidatedCorrectly**: Kundägarskap ska valideras korrekt för åtkomstkontroll.
- **AdminSelfEdit_ShouldBeAllowed**: Administratörer ska tillåtas redigera sin egen profil.
- **AdminSelfDeletion_ShouldBePrevented**: Administratörer ska förhindras från att ta bort sig själva.
- **CrossAdminEdit_ShouldBePrevented**: Redigering mellan olika administratörer ska förhindras.
- **CrossAdminDeletion_ShouldBePrevented**: Borttagning mellan olika administratörer ska förhindras.
- **CustomerDataIsolation_ShouldBeEnforced**: Dataisolering för kunder ska upprätthållas mellan olika användare.
- **AdminCustomerAccess_ShouldSeeAllCustomers**: Administratörer ska kunna se alla kunder inklusive de utan ägare.
- **UserDeletionWithCustomers_ShouldSetCustomerUserIdToNull**: Borttagning av användare med kunder ska sätta kundernas användar-ID till null.

## Services

### CustomerServiceTests
- **GetAllCustomersAsync_ShouldReturnCustomersForSpecificUser**: Hämtning av alla kunder ska returnera endast kunder för den angivna användaren.
- **GetAllCustomersAsync_ShouldReturnEmptyList_WhenUserHasNoCustomers**: Hämtning av alla kunder ska returnera tom lista när användaren inte har några kunder.
- **GetAllCustomersForAdminAsync_ShouldReturnAllCustomers**: Hämtning av alla kunder för admin ska returnera alla kunder i systemet.
- **GetCustomerByIdAsync_ShouldReturnCustomer_WhenCustomerBelongsToUser**: Hämtning av kund via ID ska returnera kunden när den tillhör användaren.
- **GetCustomerByIdAsync_ShouldReturnNull_WhenCustomerDoesNotBelongToUser**: Hämtning av kund via ID ska returnera null när kunden inte tillhör användaren.
- **CreateCustomerAsync_ShouldCreateCustomerWithCorrectData**: Skapande av kund ska skapa kund med korrekt data och tidsstämplar.
- **UpdateCustomerAsync_ShouldUpdateCustomer_WhenCustomerBelongsToUser**: Uppdatering av kund ska lyckas när kunden tillhör användaren.
- **UpdateCustomerAsync_ShouldReturnNull_WhenCustomerDoesNotBelongToUser**: Uppdatering av kund ska returnera null när kunden inte tillhör användaren.
- **DeleteCustomerAsync_ShouldDeleteCustomer_WhenCustomerBelongsToUser**: Borttagning av kund ska lyckas när kunden tillhör användaren.
- **DeleteCustomerAsync_ShouldReturnFalse_WhenCustomerDoesNotBelongToUser**: Borttagning av kund ska returnera false när kunden inte tillhör användaren.
- **DeleteCustomerForAdminAsync_ShouldDeleteCustomer**: Borttagning av kund för admin ska alltid lyckas oavsett ägare.
- **CustomerExistsAsync_ShouldReturnTrue_WhenCustomerExists**: Kontroll av kundexistens ska returnera true när kunden finns.
- **CustomerExistsAsync_ShouldReturnFalse_WhenCustomerDoesNotExist**: Kontroll av kundexistens ska returnera false när kunden inte finns.
- **CustomerBelongsToUserAsync_ShouldReturnTrue_WhenCustomerBelongsToUser**: Kontroll av kundägarskap ska returnera true när kunden tillhör användaren.
- **CustomerBelongsToUserAsync_ShouldReturnFalse_WhenCustomerDoesNotBelongToUser**: Kontroll av kundägarskap ska returnera false när kunden inte tillhör användaren.
- **GetAllCustomersAsync_ShouldReturnCustomersWithNullUserId**: Hämtning av kunder ska inte inkludera kunder utan ägare för vanliga användare.
- **GetAllCustomersForAdminAsync_ShouldReturnCustomersWithNullUserId**: Hämtning av kunder för admin ska inkludera kunder utan ägare.
- **GetCustomerByIdForAdminAsync_ShouldReturnCustomerWithNullUserId**: Hämtning av kund för admin ska fungera även för kunder utan ägare.
- **UpdateCustomerForAdminAsync_ShouldUpdateCustomerWithNullUserId**: Uppdatering av kund för admin ska fungera även för kunder utan ägare.
- **DeleteCustomerForAdminAsync_ShouldDeleteCustomerWithNullUserId**: Borttagning av kund för admin ska fungera även för kunder utan ägare.
- **SetCustomersUserIdToNullAsync_ShouldSetUserIdToNull_ForAllCustomersOfUser**: Nollställning av användar-ID ska sätta användar-ID till null för alla kunder som tillhör användaren.
- **SetCustomersUserIdToNullAsync_ShouldUpdateTimestamp_WhenSettingUserIdToNull**: Nollställning av användar-ID ska uppdatera tidsstämpeln för berörda kunder.
- **SetCustomersUserIdToNullAsync_ShouldDoNothing_WhenUserHasNoCustomers**: Nollställning av användar-ID ska inte påverka något när användaren inte har några kunder.
- **SetCustomersUserIdToNullAsync_ShouldHandleEmptyUserId**: Nollställning av användar-ID ska hantera tomma användar-ID:n korrekt.
- **SetCustomersUserIdToNullAsync_ShouldHandleNullUserId**: Nollställning av användar-ID ska hantera null användar-ID:n korrekt.

### DatabaseSeedServiceTests
- **RecreateDatabaseAsync_ShouldDeleteAndRecreateDatabase**: Databasåterskapning ska ta bort befintlig data och skapa nya roller.
- **SeedTestDataAsync_ShouldCreateAdminUsers**: Testdata-skapning ska skapa administratörsanvändare med korrekta roller.
- **SeedTestDataAsync_ShouldCreateRegularUsers**: Testdata-skapning ska skapa vanliga användare med korrekta roller.
- **SeedTestDataAsync_ShouldCreateTestCustomers**: Testdata-skapning ska skapa testkunder kopplade till användarna.
- **RecreateDatabaseAsync_ShouldReturnTrue_WhenSuccessful**: Databasåterskapning ska returnera true när den lyckas.
- **SeedTestDataAsync_ShouldNotCreateDuplicateUsers**: Testdata-skapning ska inte skapa duplicerade användare vid upprepade körningar.
- **SeedTestDataAsync_ShouldNotCreateDuplicateCustomers**: Testdata-skapning ska inte skapa duplicerade kunder vid upprepade körningar.

### IdentityServiceTests
- **UserManager_ShouldCreateUserSuccessfully**: Användarhanteraren ska kunna skapa användare framgångsrikt.
- **UserManager_ShouldValidatePasswordRequirements**: Användarhanteraren ska validera lösenordskrav korrekt.
- **UserManager_ShouldRequireUniqueEmail**: Användarhanteraren ska kräva unika e-postadresser.
- **RoleManager_ShouldCreateRolesSuccessfully**: Rollhanteraren ska kunna skapa roller framgångsrikt.
- **UserManager_ShouldAssignRolesToUsers**: Användarhanteraren ska kunna tilldela roller till användare.
- **UserManager_ShouldAuthenticateUserWithCorrectPassword**: Användarhanteraren ska autentisera användare med korrekta lösenord.
- **UserManager_ShouldRejectUserWithIncorrectPassword**: Användarhanteraren ska avvisa användare med felaktiga lösenord.
- **UserManager_ShouldFindUserByEmail**: Användarhanteraren ska kunna hitta användare via e-postadress.
- **UserManager_ShouldUpdateUserInformation**: Användarhanteraren ska kunna uppdatera användarinformation.
- **RoleManager_ShouldPreventDuplicateRoles**: Rollhanteraren ska förhindra skapande av duplicerade roller.
- **AdminCreateUserAndLogin_EndToEndTest**: Hela arbetsflödet från admin skapar användare till användaren loggar in ska fungera.
- **IdentityService_CreateUserAsync_ShouldReturnTrue_WhenUserIsCreatedSuccessfully**: IdentityService ska returnera true när användare skapas framgångsrikt.
- **IdentityService_CreateUserAsync_ShouldReturnFalse_WhenUserCreationFails**: IdentityService ska returnera false när användarskapande misslyckas.
- **IdentityService_CreateRoleAsync_ShouldReturnTrue_WhenRoleIsCreatedSuccessfully**: IdentityService ska returnera true när roll skapas framgångsrikt.
- **IdentityService_AssignRoleToUserAsync_ShouldReturnTrue_WhenRoleIsAssignedSuccessfully**: IdentityService ska returnera true när roll tilldelas framgångsrikt.
- **IdentityService_AssignRoleToUserAsync_ShouldReturnFalse_WhenUserDoesNotExist**: IdentityService ska returnera false när roll försöks tilldelas icke-existerande användare.
- **IdentityService_RemoveRoleFromUserAsync_ShouldReturnTrue_WhenRoleIsRemovedSuccessfully**: IdentityService ska returnera true när roll tas bort framgångsrikt.
- **IdentityService_GetUserRolesAsync_ShouldReturnEmptyList_WhenUserDoesNotExist**: IdentityService ska returnera tom lista när roller begärs för icke-existerande användare.
- **IdentityService_IsUserInRoleAsync_ShouldReturnTrue_WhenUserHasRole**: IdentityService ska returnera true när användare har angiven roll.
- **IdentityService_IsUserInRoleAsync_ShouldReturnFalse_WhenUserDoesNotHaveRole**: IdentityService ska returnera false när användare inte har angiven roll.
- **IdentityService_FindUserByEmailAsync_ShouldReturnNull_WhenUserDoesNotExist**: IdentityService ska returnera null när användare inte hittas via e-post.
- **IdentityService_FindUserByIdAsync_ShouldReturnNull_WhenUserDoesNotExist**: IdentityService ska returnera null när användare inte hittas via ID.
- **IdentityService_ValidatePasswordAsync_ShouldReturnTrue_WhenPasswordIsCorrect**: IdentityService ska returnera true när lösenord är korrekt.
- **IdentityService_ValidatePasswordAsync_ShouldReturnFalse_WhenPasswordIsIncorrect**: IdentityService ska returnera false när lösenord är felaktigt.
- **IdentityService_UpdateUserAsync_ShouldReturnTrue_WhenUserIsUpdatedSuccessfully**: IdentityService ska returnera true när användare uppdateras framgångsrikt.
- **IdentityService_DeleteUserAsync_ShouldReturnTrue_WhenUserIsDeletedSuccessfully**: IdentityService ska returnera true när användare tas bort framgångsrikt.
- **IdentityService_DeleteUserAsync_ShouldReturnFalse_WhenUserDoesNotExist**: IdentityService ska returnera false när icke-existerande användare försöks tas bort.
- **IdentityService_GetAllUsersAsync_ShouldReturnAllUsers**: IdentityService ska returnera alla användare i systemet.
- **IdentityService_InitializeRolesAsync_ShouldCreateAdminAndUserRoles**: IdentityService ska skapa Admin- och User-roller vid initialisering.
- **IdentityService_GetAllCustomersAsync_ShouldReturnCustomersForUser**: IdentityService ska returnera kunder för en specifik användare.
- **IdentityService_SetCustomersUserIdToNullAsync_ShouldSetUserIdToNull**: IdentityService ska sätta kundernas användar-ID till null när användare tas bort.

## Sammanfattning

Totalt innehåller testerna **126 individuella tester** som täcker:

- **Säkerhet och rollbaserad åtkomst** - 25 tester
- **Användarhantering och autentisering** - 35 tester  
- **Kundhantering och dataisolering** - 28 tester
- **Databasoperationer och tjänster** - 32 tester
- **Webbkontroller och användarinteraktion** - 6 tester

Alla tester säkerställer att systemet fungerar korrekt med avseende på säkerhet, dataintegritet, användarupplevelse och affärslogik.
