# Inloggningsflöde: maria@sellmore.se

## Sekvensdiagram

```mermaid
sequenceDiagram
    participant User as 👤 Användare
    participant Login as Login.tsx
    participant Hook as useLogin()
    participant Client as apiClient
    participant Backend as Backend /auth/login
    participant DB as SQLite Database
    participant Auth as AuthContext
    participant Storage as localStorage

    User->>Login: Fyller i email & lösenord
    User->>Login: Klickar "Sign in"
    
    Login->>Hook: loginMutation.mutateAsync({ email, password })
    Hook->>Client: apiClient.post('/auth/login', credentials)
    Client->>Backend: POST /auth/login<br/>{ email, password }
    
    Note over Backend: zValidator validerar input
    
    Backend->>DB: SELECT * FROM users<br/>WHERE email = ?
    DB-->>Backend: user (med passwordHash)
    
    Note over Backend: verify(passwordHash, password)
    
    Backend->>DB: INSERT INTO sessions<br/>(token, userId, expiresAt)
    DB-->>Backend: OK
    
    Backend-->>Client: 200 OK<br/>{ token, user }
    Client->>Storage: localStorage.setItem('auth_token', token)
    Client-->>Hook: response
    
    Hook->>Hook: queryClient.setQueryData(['currentUser'], user)
    Hook-->>Login: response
    
    Login->>Auth: login(token, user)
    Auth->>Auth: queryClient.clear()
    Auth->>Client: apiClient.setToken(token)
    Auth->>Auth: setUser(user)
    
    Login->>Login: navigate('/')
    
    Note over User,Storage: ✅ Användaren är inloggad!
```

## Sammanfattning

1. **Användarinteraktion** → formuläret i `Login.tsx`
2. **Frontend-lagret** → `useLogin()` hook → `apiClient` 
3. **Nätverksanrop** → POST till backend
4. **Backend-logik** → validering, databassökning, lösenordsverifiering, sessionskapande
5. **Response-hantering** → token sparas i localStorage och React state uppdateras
6. **Omdirigering** → användaren skickas till startsidan
