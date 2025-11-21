import { useSession } from "@tanstack/react-start/server";

type SessionData = {
	userId?: string;
	email?: string;
	role?: string;
};

export function useAppSession() {
	return useSession<SessionData>({
		// Session configuration
		name: process.env.SESSION_NAME || "app_session",
		password: process.env.SESSION_SECRET!, // At least 32 characters

		cookie: {
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			httpOnly: true,
		},
	});
}
