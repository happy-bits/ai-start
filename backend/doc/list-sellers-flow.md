# Dataflöde: Lista alla säljare (Admin)

## Sekvensdiagram

```mermaid
sequenceDiagram
    participant Admin as 👤 Admin
    participant List as SellerList.tsx
    participant Hook as useSellers()
    participant Client as apiClient
    participant Backend as Backend /api/sellers
    participant Auth as authMiddleware
    participant DB as SQLite Database

    Admin->>List: Navigerar till /sellers
    
    List->>Hook: useSellers()
    Hook->>Client: getSellers()
    Client->>Backend: GET /api/sellers<br/>Authorization: Bearer <token>
    
    Backend->>Auth: authMiddleware()
    Auth->>DB: SELECT * FROM sessions<br/>JOIN users WHERE token = ?
    DB-->>Auth: session + user data
    
    Note over Auth: Verifierar admin-roll
    
    Auth->>Backend: next()
    
    Backend->>DB: SELECT id, email, name, role<br/>FROM users WHERE role = 'seller'
    DB-->>Backend: sellers[]
    
    Backend-->>Client: 200 OK<br/>{ sellers: [...] }
    Client-->>Hook: sellers[]
    
    Note over Hook: React Query cachar data
    
    Hook-->>List: { data: sellers[] }
    List->>List: Renderar säljarlista
    
    Note over Admin,DB: ✅ Säljarlistan visas
```

## Involverade filer

| Lager | Fil | Funktion |
|-------|-----|----------|
| Frontend | `pages/sellers/SellerList.tsx` | Komponent som renderar listan |
| Frontend | `api/sellers.ts` | `useSellers()` hook och `getSellers()` |
| Frontend | `api/client.ts` | HTTP-klient med auth header |
| Backend | `app.ts` | Routar `/api/*` till protected routes |
| Backend | `middleware/auth.ts` | `authMiddleware()` validerar token |
| Backend | `middleware/auth.ts` | `adminOnly()` kräver admin-roll |
| Backend | `routes/sellers.ts` | `GET /sellers` endpoint |

## Sammanfattning

1. **Komponent renderas** → `SellerList.tsx` anropar `useSellers()`
2. **React Query** → Kontrollerar cache, gör fetch om data saknas/är stale
3. **API-klient** → Lägger till `Authorization: Bearer <token>` header
4. **authMiddleware** → Validerar token mot sessions-tabellen
5. **adminOnly** → Kontrollerar att användaren har `role: 'admin'`
6. **Databasquery** → Hämtar alla användare med `role: 'seller'`
7. **Response** → Returnerar `{ sellers: [...] }` (utan passwordHash!)
8. **Caching** → React Query cachar med key `['sellers']`
9. **Rendering** → Listan visas med filtrering på klientsidan

