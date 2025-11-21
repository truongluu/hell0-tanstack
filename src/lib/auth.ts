import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { client } from "@/api/petstore/client.gen";

const STORAGE_KEY = "petstore_token";

export const getStoredToken = (): string | undefined => {
	try {
		if (typeof window === "undefined") return undefined;
		return localStorage.getItem(STORAGE_KEY) ?? undefined;
	} catch {
		return undefined;
	}
};

export const setStoredToken = (token: string) => {
	try {
		if (typeof window === "undefined") return;
		localStorage.setItem(STORAGE_KEY, token);
		// update global client header as well
		attachAuthToClient(token);
	} catch {
		// noop
	}
};

export const clearStoredToken = () => {
	try {
		if (typeof window === "undefined") return;
		localStorage.removeItem(STORAGE_KEY);
		attachAuthToClient(undefined);
	} catch {
		// noop
	}
};

export const authCallback = async () => {
	return getStoredToken();
};

// Attach token to generated client for client-side and server-side usage.
export const attachAuthToClient = (token?: string | undefined) => {
	if (!token) {
		// remove Authorization header
		client.setConfig({ headers: { Authorization: null } });
		return;
	}

	// If token already contains 'Bearer ' prefix, keep it, otherwise add it.
	const header = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

	client.setConfig({ headers: { Authorization: header } });
};

// For SSR usage you can call this with the token from cookies/headers
export const initAuthForServer = (token?: string) => {
	attachAuthToClient(token);
};

export const getTokenFromCookie = createServerFn({ method: "GET" }).handler(
	() => {
		return {
			token: "123",
		};
	},
);

export default {
	getStoredToken,
	setStoredToken,
	clearStoredToken,
	authCallback,
	attachAuthToClient,
	initAuthForServer,
};
