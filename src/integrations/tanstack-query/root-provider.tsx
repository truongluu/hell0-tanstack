import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Default stale time for queries (2 minutes)
const DEFAULT_STALE_TIME = 1000 * 60 * 2;

export function getContext() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// Keep data fresh for 2 minutes by default
				staleTime: DEFAULT_STALE_TIME,
				// Avoid refetching on window focus unless explicitly enabled
				refetchOnWindowFocus: false,
			},
			mutations: {
				// Don't retry failed mutations by default
				retry: false,
			},
		},
	});

	// If a token is supplied (e.g. in SSR), attach it to the generated client
	try {
		// lazy import to avoid circular deps during generation
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const auth = require("../../lib/auth");

		// On the client, ensure the generated client will call our authCallback
		if (typeof window !== "undefined") {
			if (typeof auth?.authCallback === "function") {
				// register default auth callback used by setAuthParams
				// lazy require the generated client to avoid circular imports
				try {
					const { client } = require("../../api/petstore/client.gen");
					client.setConfig({ auth: auth.authCallback });
				} catch {
					// noop
				}
			}

			// Attach any stored token to the client headers right away
			if (typeof auth?.getStoredToken === "function") {
				const token = auth.getStoredToken();
				if (token) {
					try {
						const { attachAuthToClient } = require("../../lib/auth");
						attachAuthToClient(token);
					} catch {
						// noop
					}
				}
			}
		}
	} catch {
		// noop
	}

	return {
		queryClient,
	};
}

export function Provider({
	children,
	queryClient,
}: {
	children: React.ReactNode;
	queryClient: QueryClient;
}) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
