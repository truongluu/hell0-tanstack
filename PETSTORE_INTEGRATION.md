# Petstore API Integration

This project integrates with the Swagger Petstore API using OpenAPI Generator for type-safe API clients and TanStack Query for data fetching.

## 🚀 Setup

### 1. OpenAPI Generator Configuration

The project uses `@hey-api/openapi-ts` to generate TypeScript types and API clients from the Petstore OpenAPI specification.

**Configuration File:** `openapi-ts.config.ts`

```typescript
import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./petstore-openapi.json",
  output: {
    path: "./src/api/petstore",
    format: "prettier",
    lint: "biome",
  },
  client: "@hey-api/client-axios",
  plugins: [
    {
      name: "@hey-api/sdk",
      asClass: true,
    },
  ],
});
```

### 2. Generate API Client

To regenerate the API client after updating the OpenAPI spec:

```bash
pnpm openapi:generate
```

This will:

- Parse the `petstore-openapi.json` file
- Generate TypeScript types in `src/api/petstore/types.gen.ts`
- Generate API client SDK in `src/api/petstore/sdk.gen.ts`
- Format code with Prettier and lint with Biome

### 3. Generated Files

The generator creates the following files in `src/api/petstore/`:

- **`types.gen.ts`** - TypeScript types and interfaces for all API models
- **`sdk.gen.ts`** - SDK classes with methods for each API endpoint
- **`client.gen.ts`** - Configured HTTP client instance
- **`core/`** - Core utilities and helpers

## 📦 TanStack Query Hooks

Custom React hooks wrapping the Petstore API with TanStack Query are available in `src/api/petstore-hooks.ts`.

### Query Hooks

#### `useFindPetsByStatus(status, options?)`

Fetch pets by their status (available, pending, or sold).

```typescript
import { useFindPetsByStatus } from '~/api/petstore-hooks';

function MyComponent() {
  const { data: pets, isLoading, error } = useFindPetsByStatus(['available']);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{pets?.length} pets found</div>;
}
```

#### `useGetPetById(petId, options?)`

Fetch a single pet by ID.

```typescript
const { data: pet } = useGetPetById(123);
```

#### `useGetInventory(options?)`

Fetch store inventory counts by status.

```typescript
const { data: inventory } = useGetInventory();
// Returns: { available: 10, pending: 5, sold: 3 }
```

#### `useGetOrderById(orderId, options?)`

Fetch an order by ID.

```typescript
const { data: order } = useGetOrderById(456);
```

### Mutation Hooks

#### `useAddPet(options?)`

Add a new pet to the store.

```typescript
const addPet = useAddPet({
  onSuccess: () => {
    console.log("Pet added!");
  },
});

addPet.mutate({
  name: "Fluffy",
  photoUrls: ["https://example.com/photo.jpg"],
  status: "available",
});
```

#### `useUpdatePet(options?)`

Update an existing pet.

```typescript
const updatePet = useUpdatePet({
  onSuccess: () => {
    console.log("Pet updated!");
  },
});

updatePet.mutate({
  id: 123,
  name: "Fluffy Updated",
  photoUrls: ["https://example.com/photo.jpg"],
  status: "sold",
});
```

#### `useDeletePet(options?)`

Delete a pet by ID.

```typescript
const deletePet = useDeletePet();

deletePet.mutate(123);
```

#### `usePlaceOrder(options?)`

Place an order for a pet.

```typescript
const placeOrder = usePlaceOrder();

placeOrder.mutate({
  petId: 123,
  quantity: 1,
  status: "placed",
});
```

## 🔑 Query Keys

The hooks use a standardized query key factory for cache management:

```typescript
import { petstoreKeys } from "~/api/petstore-hooks";

// Query keys structure:
petstoreKeys.all; // ['petstore']
petstoreKeys.pets(); // ['petstore', 'pets']
petstoreKeys.pet(123); // ['petstore', 'pets', 123]
petstoreKeys.petsByStatus(["available"]); // ['petstore', 'pets', 'status', ['available']]
petstoreKeys.inventory(); // ['petstore', 'inventory']
petstoreKeys.orders(); // ['petstore', 'orders']
petstoreKeys.order(456); // ['petstore', 'orders', 456]
```

## 🔄 Cache Invalidation

Helper functions for invalidating queries:

```typescript
import { invalidatePetQueries, invalidateAllPetstoreQueries } from '~/api/petstore-hooks';
import { useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    // Invalidate all pet queries
    invalidatePetQueries(queryClient);

    // Or invalidate everything
    invalidateAllPetstoreQueries(queryClient);
  };

  return <button onClick={handleSuccess}>Refresh</button>;
}
```

## 🎨 Demo Page

A complete demo page is available at `/demo/petstore` showcasing:

- **Store Inventory** - Display pet counts by status
- **Add New Pet** - Form to create new pets
- **Find Pets by Status** - Filter and display pets with actions
- **Get Pet by ID** - Lookup individual pets

To view the demo:

```bash
pnpm dev
```

Then navigate to `http://localhost:3000/demo/petstore`

## 📚 API Reference

The Petstore API is documented at:

- **Swagger UI:** https://petstore.swagger.io/
- **OpenAPI Spec:** https://petstore.swagger.io/v2/swagger.json

## 🔧 Customization

### Changing the Base URL

The API client is configured to use `https://petstore.swagger.io/v2` by default. To change this:

```typescript
// In src/api/petstore-hooks.ts
import { client } from "./petstore/client.gen";

client.setConfig({
  baseUrl: "https://your-api.example.com",
});
```

### Adding Authentication

To add authentication headers:

```typescript
client.setConfig({
  baseUrl: "https://petstore.swagger.io/v2",
  headers: {
    api_key: "your-api-key",
  },
});
```

### Authentication (Client + SSR)

This project includes simple auth helpers in `src/lib/auth.ts` to manage tokens and attach them to the generated API client.

- `setStoredToken(token: string)` — stores token in `localStorage` and attaches it to the generated client as an `Authorization` header.
- `clearStoredToken()` — removes stored token and clears client Authorization header.
- `authCallback()` — async helper that returns the stored token (useful when passing an auth callback to the generated SDK).
- `attachAuthToClient(token?)` — attach a token directly to the generated client (useful for SSR).

Client-side example (login flow):

```tsx
import { setStoredToken, clearStoredToken } from "~/lib/auth";

// after login
setStoredToken("my-jwt-token");

// logout
clearStoredToken();
```

Per-request auth in hooks

The hooks in `src/api/petstore-hooks.ts` accept an optional `auth` parameter you can pass per-call:

```ts
useFindPetsByStatus(["available"], undefined, () => Promise.resolve("my-jwt"));
useAddPet(undefined, "my-jwt");
```

Server-side example (SSR)

When doing SSR, call the `getContext` helper with the token extracted from the incoming request (cookie/header) so the generated client will include the header while performing server-side fetches:

```ts
import * as TanstackQuery from "~/integrations/tanstack-query/root-provider";

// on server, extract token from request cookies/headers
const token = getTokenFromRequest(req);
const rqContext = TanstackQuery.getContext(token);

// use rqContext.queryClient for SSR rendering
```

Alternatively you can call `attachAuthToClient(token)` directly before running any server-side data fetches.

### Custom Query Options

All hooks accept TanStack Query options:

```typescript
const { data } = useFindPetsByStatus(["available"], {
  staleTime: 5000,
  refetchInterval: 10000,
  enabled: someCondition,
});
```

## 📝 Type Safety

All API interactions are fully type-safe thanks to the generated types:

```typescript
import type { Pet, Order, Category } from "~/api/petstore/types.gen";

// TypeScript will enforce correct types
const pet: Pet = {
  name: "Fluffy", // Required
  photoUrls: ["url"], // Required
  status: "available", // Only accepts 'available' | 'pending' | 'sold'
  id: 123, // Optional
  category: {
    // Optional, but typed
    id: 1,
    name: "Dogs",
  },
};
```

## 🛠️ Updating the API Spec

To update to a new version of the Petstore API:

1. Download the new OpenAPI spec:

   ```bash
   curl -o petstore-openapi.json https://petstore.swagger.io/v2/swagger.json
   ```

2. Regenerate the client:

   ```bash
   pnpm openapi:generate
   ```

3. Review any breaking changes in the generated types
4. Update your hooks and components as needed

## 📦 Dependencies

- **@hey-api/openapi-ts** - OpenAPI code generator
- **@hey-api/client-axios** - Axios-based HTTP client
- **axios** - HTTP client library
- **@tanstack/react-query** - Data fetching and caching

## 💡 Tips

1. **Always run the generator after updating the OpenAPI spec** to keep types in sync
2. **Use query keys consistently** for better cache management
3. **Leverage TypeScript** to catch API usage errors at compile time
4. **Handle loading and error states** in your components
5. **Consider implementing optimistic updates** for better UX
