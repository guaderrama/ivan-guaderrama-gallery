# Authentication Feature

Sistema completo de autenticación con Firebase Authentication y control de roles.

## 📁 Estructura

```
auth/
├── components/              # UI Components
│   ├── LoginForm.tsx       # Email/Password login form
│   ├── LogoutButton.tsx    # Sign out button
│   ├── UserBadge.tsx       # User info display
│   ├── ProtectedRoute.tsx  # Route protection wrapper
│   └── index.ts
├── context/                # React Context
│   └── AuthContext.tsx     # Auth state & methods
├── hooks/                  # Custom Hooks
│   └── index.ts           # Re-exports useAuth
├── types/                  # TypeScript Types
│   └── index.ts
└── README.md              # Esta documentación
```

---

## 🚀 Quick Start

### 1. Wrap App with AuthProvider

```tsx
import { AuthProvider } from '@/features/auth';

function App() {
  return (
    <AuthProvider>
      {/* Your app */}
    </AuthProvider>
  );
}
```

### 2. Use Authentication in Components

```tsx
import { useAuth } from '@/features/auth';

function MyComponent() {
  const { user, signIn, signOut, isAdmin } = useAuth();

  if (!user) {
    return <button onClick={() => signIn(email, pass)}>Login</button>;
  }

  return (
    <div>
      <p>Welcome {user.email}!</p>
      {isAdmin && <p>You are an admin</p>}
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### 3. Protect Routes

```tsx
import { ProtectedRoute } from '@/features/auth';

function AdminPanel() {
  return (
    <ProtectedRoute requireAdmin>
      <div>Admin-only content</div>
    </ProtectedRoute>
  );
}
```

---

## 📚 API Reference

### `useAuth()` Hook

Hook principal para acceder a la autenticación.

#### Retorna

```typescript
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}
```

#### Propiedades

**`user`** - Usuario actual autenticado
```typescript
interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'admin' | 'user';
}
```

**`loading`** - Estado de carga durante verificación de auth

**`error`** - Mensaje de error si algo falla

**`isAdmin`** - `true` si el usuario tiene role 'admin'

#### Métodos

**`signIn(email, password)`**
```tsx
const { signIn } = useAuth();

const handleLogin = async () => {
  const success = await signIn('user@example.com', 'password123');
  if (success) {
    console.log('Logged in!');
  }
};
```

**`signUp(email, password)`**
```tsx
const { signUp } = useAuth();

const handleRegister = async () => {
  const success = await signUp('new@example.com', 'password123');
  if (success) {
    console.log('Account created!');
  }
};
```

**`signOut()`**
```tsx
const { signOut } = useAuth();

const handleLogout = async () => {
  await signOut();
  console.log('Logged out!');
};
```

---

### Componentes

#### `<AuthProvider>`

Proveedor de contexto de autenticación. Debe envolver toda la app.

```tsx
import { AuthProvider } from '@/features/auth';

<AuthProvider>
  <App />
</AuthProvider>
```

**Funcionalidad:**
- Escucha cambios de estado de Firebase Auth
- Obtiene role del usuario desde Firestore (`/users/{uid}`)
- Crea documento de usuario automáticamente en sign up
- Expone estado y métodos de auth a toda la app

---

#### `<LoginForm>`

Formulario completo de login/registro.

```tsx
import { LoginForm } from '@/features/auth/components';

<LoginForm onSuccess={() => console.log('Logged in!')} />
```

**Props:**
```typescript
interface LoginFormProps {
  onSuccess?: () => void;  // Callback al login exitoso
}
```

**Features:**
- Toggle entre sign in / sign up
- Validación de inputs
- Manejo de errores
- Estados de loading
- Responsive design

---

#### `<LogoutButton>`

Botón simple de logout.

```tsx
import { LogoutButton } from '@/features/auth/components';

<LogoutButton
  className="custom-class"
  onSuccess={() => console.log('Logged out!')}
/>
```

**Props:**
```typescript
interface LogoutButtonProps {
  className?: string;
  onSuccess?: () => void;
}
```

---

#### `<UserBadge>`

Muestra información del usuario actual.

```tsx
import { UserBadge } from '@/features/auth/components';

<UserBadge showRole={true} />
```

**Props:**
```typescript
interface UserBadgeProps {
  className?: string;
  showRole?: boolean;  // Default: true
}
```

**Display:**
- Avatar inicial (primera letra del email)
- Email o displayName
- Role badge (Admin/User)

---

#### `<ProtectedRoute>`

Wrapper para proteger rutas/componentes.

```tsx
import { ProtectedRoute } from '@/features/auth/components';

// Requiere autenticación
<ProtectedRoute>
  <PrivateContent />
</ProtectedRoute>

// Requiere role admin
<ProtectedRoute requireAdmin>
  <AdminPanel />
</ProtectedRoute>

// Custom loading/unauthorized
<ProtectedRoute
  requireAdmin
  fallback={<Spinner />}
  unauthorized={<AccessDenied />}
>
  <AdminPanel />
</ProtectedRoute>
```

**Props:**
```typescript
interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;      // Default: false
  fallback?: ReactNode;        // Loading component
  unauthorized?: ReactNode;    // Unauthorized component
}
```

**Behavior:**
- Si `loading`: Muestra fallback o spinner default
- Si no autenticado: Muestra `<LoginForm />`
- Si requiere admin y user no es admin: Muestra unauthorized
- Si todo OK: Renderiza children

---

## 🔐 Sistema de Roles

### Firestore Schema

Collection: `users`

```typescript
{
  uid: string;           // Firebase Auth UID
  email: string;         // User email
  role: 'admin' | 'user'; // User role
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Asignar Role Admin

#### Opción A: Manualmente en Firestore Console

1. Ve a Firestore Database
2. Abre collection `users`
3. Busca el documento con tu UID
4. Edita el campo `role` a `"admin"`

#### Opción B: Mediante Script

```typescript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';

async function makeAdmin(uid: string) {
  await updateDoc(doc(db, 'users', uid), {
    role: 'admin',
    updatedAt: serverTimestamp(),
  });
}

// Uso
makeAdmin('user-uid-here');
```

#### Opción C: Al crear primer usuario

Edita `AuthContext.tsx` temporalmente:

```typescript
// En la función signUp, cambia:
role: 'user', // Default role

// Por:
role: 'admin', // First user is admin

// Después de crear el primer admin, revierte a 'user'
```

---

## 🎯 Patrones de Uso Comunes

### Panel de Admin con Rutas Protegidas

```tsx
import { ProtectedRoute, UserBadge, LogoutButton } from '@/features/auth';

function AdminLayout() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen">
        {/* Header */}
        <header className="bg-white shadow p-4 flex justify-between">
          <h1>Admin Panel</h1>
          <div className="flex gap-4">
            <UserBadge />
            <LogoutButton />
          </div>
        </header>

        {/* Content */}
        <main className="p-4">
          {/* Admin content */}
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

### Conditional Rendering por Role

```tsx
import { useAuth } from '@/features/auth';

function ProductCard({ product }) {
  const { user, isAdmin } = useAuth();

  return (
    <div className="card">
      <h3>{product.nombre}</h3>
      <p>${product.precioUSD}</p>

      {/* Solo admins ven botones de edición */}
      {isAdmin && (
        <div className="admin-actions">
          <button>Edit</button>
          <button>Delete</button>
        </div>
      )}
    </div>
  );
}
```

### Login Page Standalone

```tsx
import { LoginForm } from '@/features/auth/components';
import { useAuth } from '@/features/auth';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect si ya está logueado
  if (user) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">
          Ivan Guaderrama Gallery
        </h1>
        <LoginForm onSuccess={() => navigate('/dashboard')} />
      </div>
    </div>
  );
}
```

### Logout con Confirmación

```tsx
import { useAuth } from '@/features/auth';

function Header() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  return (
    <header>
      <button onClick={handleLogout}>Sign Out</button>
    </header>
  );
}
```

---

## 🔒 Seguridad

### Reglas de Firestore

Las reglas están definidas en `firestore.rules`:

```javascript
// Helper function
function isAdmin() {
  return request.auth != null &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// Artworks
match /artworks/{artworkId} {
  allow read: if resource.data.status == 'active' || isAdmin();
  allow create, update, delete: if isAdmin();
}

// Users
match /users/{userId} {
  allow read: if request.auth.uid == userId || isAdmin();
  allow update: if request.auth.uid == userId &&
                   request.resource.data.role == resource.data.role; // Can't change own role
  allow create, delete: if isAdmin();
}
```

### Best Practices

1. **Nunca confiar en el cliente**
   - Las reglas de Firestore son la verdadera seguridad
   - `isAdmin` en el frontend es solo para UX
   - Siempre validar en backend (Firestore rules + Cloud Functions)

2. **Proteger rutas sensibles**
   ```tsx
   <ProtectedRoute requireAdmin>
     <AdminPanel />
   </ProtectedRoute>
   ```

3. **No exponer información sensible**
   ```tsx
   // ❌ MAL
   console.log('Admin token:', user.accessToken);

   // ✅ BIEN
   // No loggear tokens ni información sensible
   ```

---

## ⚠️ Notas Importantes

### 1. Configuración Requerida

Antes de usar, asegúrate de:

- ✅ Habilitar Email/Password en Firebase Console
- ✅ Crear Firestore Database
- ✅ Desplegar reglas de seguridad
- ✅ Configurar `.env.local` con credenciales Firebase

### 2. Primer Usuario Admin

El primer usuario NO será admin por defecto. Debes:

1. Crear usuario con sign up
2. Ir a Firestore Console
3. Cambiar `role: 'user'` a `role: 'admin'`

O usar el método temporal en signUp mencionado arriba.

### 3. Error Handling

Todos los errores de Firebase se traducen a mensajes user-friendly:

```typescript
// Firebase error codes → User messages
'auth/user-not-found' → 'No user found with this email'
'auth/wrong-password' → 'Incorrect password'
'auth/email-already-in-use' → 'Email already in use'
'auth/weak-password' → 'Password should be at least 6 characters'
```

### 4. Persistence

Firebase Auth persiste sesiones automáticamente:
- El usuario permanece logueado entre reloads
- onAuthStateChanged detecta el estado al montar la app

---

## 🐛 Troubleshooting

### "useAuth must be used within AuthProvider"

**Causa:** Componente fuera del AuthProvider

**Solución:**
```tsx
// Asegúrate de que AuthProvider envuelve tu app
<AuthProvider>
  <App />
</AuthProvider>
```

### "Missing or insufficient permissions"

**Causa:** Reglas de Firestore no permiten la operación

**Solución:**
1. Verifica que las reglas estén desplegadas
2. Verifica que el usuario tenga el role correcto
3. Revisa la consola de Firebase para ver el error específico

### Usuario siempre tiene role 'user' aunque sea admin

**Causa:** Cache de role

**Solución:**
1. Logout y login de nuevo
2. O usa `fetchUserRole()` manualmente

### Password muy corta

**Firebase requiere mínimo 6 caracteres**

```tsx
// Validación en el frontend
if (password.length < 6) {
  setError('Password must be at least 6 characters');
}
```

---

## 📖 Integración con Artwork Service

```tsx
import { useAuth } from '@/features/auth';
import { useArtworks } from '@/features/artwork-management/hooks';

function ArtworkManager() {
  const { isAdmin } = useAuth();
  const { artworks, createArtwork, deleteArtwork } = useArtworks();

  return (
    <div>
      {artworks.map(art => (
        <div key={art.id}>
          {art.nombre}

          {/* Solo admins pueden eliminar */}
          {isAdmin && (
            <button onClick={() => deleteArtwork(art.id)}>
              Delete
            </button>
          )}
        </div>
      ))}

      {/* Solo admins pueden crear */}
      {isAdmin && (
        <button onClick={() => createArtwork(newArt)}>
          Add New Artwork
        </button>
      )}
    </div>
  );
}
```

---

## 🚀 Próximos Pasos

1. **Habilitar Firebase Authentication** en Console
2. **Crear primer usuario admin**
3. **Integrar con App.tsx** principal
4. **Proteger rutas de administración**
5. **Testing** de flujos de auth

---

**Última actualización:** 2025-11-19
**Estado:** ✅ Implementado y listo para usar
