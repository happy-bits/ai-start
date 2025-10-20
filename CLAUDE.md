# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KeepWarm is a CRM (Customer Relationship Management) application built with ASP.NET Core 9.0 MVC. The application manages customers and users with role-based access control (Admin/User roles). Regular users can only manage their own customers, while admins have full access to all customers and users.

## Technology Stack

- **Framework**: ASP.NET Core 9.0 (MVC)
- **Database**: SQLite with Entity Framework Core 9.0.9
- **Authentication**: ASP.NET Core Identity
- **Language**: C# with nullable reference types enabled

## Development Commands

### Build and Run
```bash
# Restore dependencies and build
dotnet restore KeepWarm/KeepWarm.csproj
dotnet build KeepWarm/KeepWarm.csproj

# Run the application
dotnet run --project KeepWarm/KeepWarm.csproj

# Run with watch (auto-reload on changes)
dotnet watch --project KeepWarm/KeepWarm.csproj
```

### Database Management
```bash
# Add a new migration
dotnet ef migrations add MigrationName --project KeepWarm

# Apply migrations to database
dotnet ef database update --project KeepWarm

# Remove last migration (if not applied)
dotnet ef migrations remove --project KeepWarm

# Drop database
dotnet ef database drop --project KeepWarm
```

### Testing
```bash
# Run all tests (when tests are added)
dotnet test
```

## Architecture

### Core Domain Models

**Customer** (`Models/Customer.cs`):
- Main business entity representing a customer
- Contains contact information (name, email, phone, address)
- Belongs to a specific user (`UserId` foreign key)
- Soft-linked to users (cascading deletes set UserId to null)
- Includes audit fields (`CreatedAt`, `UpdatedAt`)

**ApplicationUser** (`Models/ApplicationUser.cs`):
- Extends ASP.NET Core Identity's `IdentityUser`
- Includes additional fields like `FirstName`, `LastName`, `CreatedAt`, `UpdatedAt`

### Service Layer Pattern

The application uses a service layer to separate business logic from controllers:

**ICustomerService/CustomerService** (`Services/CustomerService.cs`):
- Handles all customer-related business logic
- Implements role-based data access (user-specific vs admin access)
- Methods come in pairs: `GetCustomerByIdAsync` (user-scoped) and `GetCustomerByIdForAdminAsync` (admin-scoped)
- Key responsibility: Ensure users can only access their own customers unless they are admins

**IIdentityService/IdentityService** (`Services/IdentityService.cs`):
- Wraps ASP.NET Core Identity's UserManager and RoleManager
- Handles user creation, role assignment, and authentication
- Initializes default roles (Admin, User) on application startup

**IDatabaseSeedService/DatabaseSeedService** (`Services/DatabaseSeedService.cs`):
- Seeds initial data for development/testing
- Creates default admin user and sample customers

### Controller Responsibilities

**CustomerController** (`Controllers/CustomerController.cs`):
- Manages customer CRUD operations
- Enforces authorization (users can only manage their own customers)
- Uses `[Authorize]` attribute for authentication
- Delegates business logic to `ICustomerService`

**AccountController** (`Controllers/AccountController.cs`):
- Handles user authentication (login/logout)
- Manages user administration (admin only)
- User creation, editing, deletion, role assignment

**DeveloperToolsController** (`Controllers/DeveloperToolsController.cs`):
- Provides development utilities (database seeding, reset)
- Can be enabled/disabled via `appsettings.json` (`DeveloperTools:Enabled`)

### Data Access

**ApplicationDbContext** (`Data/ApplicationDbContext.cs`):
- Entity Framework DbContext
- Extends `IdentityDbContext<ApplicationUser>` for Identity integration
- Configures entity relationships and constraints
- Key relationship: Customer → ApplicationUser (many-to-one with SetNull on delete)

### Configuration

**Connection String**:
- Defined in `appsettings.json`
- Points to SQLite database file: `customers.db`

**Identity Configuration** (`Program.cs:17-31`):
- Password requirements: 6+ characters, requires digit, lowercase, uppercase
- Unique email required for users

**Service Registration** (`Program.cs:34-36`):
- All services registered with Scoped lifetime
- Dependency injection configured in `Program.cs`

## Key Design Patterns

**Repository Pattern via Services**:
- Services act as repositories, abstracting data access from controllers
- Each service interface defines the contract for business operations

**Role-Based Authorization**:
- Two roles: "Admin" and "User"
- Admin: Full access to all customers and users
- User: Access only to their own customers
- Implemented via service methods and controller authorization

**Data Isolation**:
- User-scoped queries filter by `UserId`
- Admin queries bypass user filtering
- Customer deletion sets `UserId` to null instead of cascading delete

## Language and Communication

**All responses should be in Swedish** (as per `.cursor/rules/basics.mdc:9`)

## Code Quality Principles

**DRY (Don't Repeat Yourself)**:
- Avoid code duplication
- Create reusable components

**YAGNI (You Ain't Gonna Need It)**:
- Only develop what is needed
- Avoid over-complexity

**Reusability**:
- Check existing functionality before developing new features
- Extend existing components when possible

**UI Guidelines**:
- Do not use modals on the website (per `.cursor/rules/basics.mdc:11`)

**Testing**:
- Avoid removing tests (per `.cursor/rules/basics.mdc:13`)
- Program class is made partial and public for integration testing support

## User Stories

The application implements user stories defined in `Docs/userstories.md`:

**User Management** (Admin):
- Create, edit, view, delete users
- Manage user access and roles

**Customer Management**:
- Users: List, create, view, edit, delete their own customers
- Admins: View and manage all customers in the system
- Customers sorted by return date for follow-up tracking
