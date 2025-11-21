# TanStack Query SSR Guide

This guide explains how to use TanStack Query with Server-Side Rendering (SSR) in TanStack Start.

## Overview

TanStack Query in SSR involves:

1. **Server-side data fetching** during initial page load
2. **Cache hydration** - transferring server cache to client
3. **Seamless client-side transitions** after hydration

## Key Concepts

### 1. Query Cache Prefilling

The QueryClient cache is filled on the server and automatically transferred to the client during hydration.

### 2. Router Integration

The router is configured with `setupRouterSsrQueryIntegration` to coordinate between TanStack Router and TanStack Query.

See `src/router.tsx`:

```typescript
setupRouterSsrQueryIntegration({
  router,
  queryClient: rqContext.queryClient,
});
```

## SSR Patterns

### Pattern 1: Loader with prefetchQuery

**Best for:** Data that must be available before render

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

// Server function to fetch data
const getDataFn = createServerFn({ method: "GET" }).handler(async () => {
  // Call your API/database here
  const { Pet } = await import("@/api/petstore/sdk.gen");
  const response = await Pet.findPetsByStatus({
    query: { status: ["available"] },
  });
  return response.data || [];
});

export const Route = createFileRoute("/my-route")({
  component: MyComponent,
  // Loader runs on server during SSR
  loader: async ({ context }) => {
    const data = await getDataFn();

    // Prefill the query cache
    await context.queryClient.prefetchQuery({
      queryKey: ["pets", "available"],
      queryFn: async () => data,
    });

    return { data };
  },
});

function MyComponent() {
  // This query will use prefetched data immediately
  // No loading state on first render!
  const { data } = useQuery({
    queryKey: ["pets", "available"],
    queryFn: async () => {
      // On client refetch, call the API directly
      const response = await fetch("/api/pets?status=available");
      return response.json();
    },
  });

  return <div>{/* Use data */}</div>;
}
```

### Pattern 2: Using Custom Hooks with SSR

```typescript
export const Route = createFileRoute("/petstore-ssr")({
  component: PetstoreSSR,
  loader: async ({ context }) => {
    // Fetch data on server
    const pets = await getPetsSsr();

    // Prefill using the SAME query key your hook uses
    await context.queryClient.prefetchQuery({
      queryKey: ["petstore", "pets", "status", "available"],
      queryFn: async () => pets,
    });

    return { pets };
  },
});

function PetstoreSSR() {
  // Your custom hook automatically uses the prefetched data
  const { data: pets } = useFindPetsByStatus(["available"]);
  // No loading state! Data is immediately available
  return <div>{/* ... */}</div>;
}
```

### Pattern 3: Authentication in SSR

When using authenticated APIs in SSR:

```typescript
import { useAppSession } from "@/lib/session";

const getAuthenticatedData = createServerFn({ method: "GET" }).handler(
  async () => {
    // Get auth token from session
    const session = await useAppSession();
    const token = session.data.userId
      ? `Bearer ${session.data.userId}`
      : undefined;

    // Call API with auth
    const { Pet } = await import("@/api/petstore/sdk.gen");
    const response = await Pet.findPetsByStatus({
      query: { status: ["available"] },
      ...(token && { auth: token }),
    });

    return response.data || [];
  }
);

export const Route = createFileRoute("/protected")({
  loader: async ({ context }) => {
    const data = await getAuthenticatedData();

    await context.queryClient.prefetchQuery({
      queryKey: ["protected", "data"],
      queryFn: async () => data,
    });

    return { data };
  },
});
```

### Pattern 4: Using Loader Data Directly

If you don't need TanStack Query features after SSR:

```typescript
export const Route = createFileRoute("/simple-ssr")({
  component: SimpleSSR,
  loader: async () => {
    const data = await getDataFn();
    return { data };
  },
});

function SimpleSSR() {
  // Access loader data directly
  const { data } = Route.useLoaderData();
  return <div>{/* Use data */}</div>;
}
```

## Passing Auth Token to Router (SSR)

In your server entry point, extract the auth token from the request and pass it to `getRouter`:

```typescript
// Example server handler (location depends on your setup)
import { getRouter } from "./router";

async function handler(req: Request) {
  // Extract token from request (cookie, header, etc.)
  const token = extractTokenFromRequest(req);

  // Pass to router - this will initialize auth for SSR
  const router = getRouter(token);

  // ... render the app
}
```

The `getRouter` function (in `src/router.tsx`) accepts `initialAuthToken` and passes it to `TanstackQuery.getContext(initialAuthToken)`, which:

- Calls `initAuthForServer(token)` to set auth for server-side SDK calls
- Creates QueryClient with auth already configured

## Benefits of SSR with TanStack Query

1. **No loading states** on initial render
2. **Better SEO** - content rendered on server
3. **Faster perceived performance** - immediate content display
4. **Progressive enhancement** - client takes over after hydration
5. **Automatic deduplication** - React Query handles cache intelligently

## Common Patterns

### Refetching After Mutations

```typescript
function MyComponent() {
  const { data } = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
  });

  const mutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  return <div>{/* ... */}</div>;
}
```

### Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: updateItem,
  onMutate: async (newItem) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["items"] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(["items"]);

    // Optimistically update
    queryClient.setQueryData(["items"], (old) => [...old, newItem]);

    return { previous };
  },
  onError: (err, newItem, context) => {
    // Rollback on error
    queryClient.setQueryData(["items"], context.previous);
  },
  onSettled: () => {
    // Refetch after error or success
    queryClient.invalidateQueries({ queryKey: ["items"] });
  },
});
```

## Example Routes in This Project

- **`/demo/petstore-ssr`** - Full SSR with TanStack Query prefetch
- **`/demo/prisma`** - Server functions with loader
- **`/demo/start/ssr/full-ssr`** - Simple loader without TanStack Query
- **`/demo/tanstack-query`** - Client-only TanStack Query

## Troubleshooting

### Data not available on first render

- Ensure queryKey in `prefetchQuery` matches the one in your `useQuery`
- Check that loader is actually running (add console.log)

### Auth not working in SSR

- Verify token is passed to `getRouter(token)` in server entry
- Check `initAuthForServer` is called in `root-provider.tsx`
- Ensure SDK calls include `auth` parameter

### Hydration mismatches

- Make sure server and client query keys are identical
- Verify data serialization (dates, complex objects may need special handling)

## Resources

- [TanStack Query SSR Docs](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [TanStack Router Docs](https://tanstack.com/router/latest)
- [TanStack Start Docs](https://tanstack.com/start/latest)
