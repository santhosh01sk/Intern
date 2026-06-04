# Project Flow Diagram

Below is a system-level flow diagram (Mermaid) describing the React frontend and Spring Boot backend interactions.

```mermaid
flowchart LR
  subgraph Frontend [React app — activity/src]
    U[User] --> Login[Login.jsx]
    U --> Home[Home.jsx]
    U --> Signup[Signup.jsx]
    Login -->|POST /auth/login (creds)| AuthAPI[Auth API]
    Signup -->|POST /auth/signup| AuthAPI
    AuthAPI -->|200 + JWT| Login
    Login -->|store JWT| Browser[localStorage / cookie]
    Navbar[Navbar.jsx] -->|attach JWT| APIRequests[Protected API requests]
    Home --> APIRequests
    Counter[Counter.jsx] --> APIRequests
  end

  subgraph Backend [Spring Boot — demo]
    AuthAPI[AuthController]
    AuthAPI --> UserSvc[UserService]
    UserSvc --> UserRepo[UserRepository / DB]
    AuthAPI --> JwtUtil[JwtUtil / JwtAuthenticationFilter]
    ProtectedEndpoints[Other controllers]
    APIRequests -->|Bearer JWT| ProtectedEndpoints
    ProtectedEndpoints --> JwtUtil
    JwtUtil -->|validate| UserRepo
  end

  Browser -->|requests| Static[static build / public]
  Static --> Home

  %% Notes
  classDef infra fill:#f9f9f9,stroke:#333,stroke-width:1px;
  class Frontend,Backend infra
```

Saved as `activity/flow_diagram.md`.
