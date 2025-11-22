import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { AuthProvider } from "./contexts/auth";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
	const rqContext = TanstackQuery.getContext();

	const router = createRouter({
		routeTree,
		context: { ...rqContext },
		defaultPreload: "intent",
		Wrap: (props: { children: React.ReactNode }) => {
			return (
				<TanstackQuery.Provider {...rqContext}>
					<AuthProvider>{props.children}</AuthProvider>
				</TanstackQuery.Provider>
			);
		},
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient: rqContext.queryClient,
	});

	return router;
};

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
