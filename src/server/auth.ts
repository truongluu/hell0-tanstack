import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useAppSession } from "@/lib/session";

// Login server function
export const loginFn = createServerFn({ method: "POST" })
	.inputValidator((data: { email: string; password: string }) => data)
	.handler(async ({ data }) => {
		// Create session
		const session = await useAppSession();
		// Verify credentials (replace with your auth logic)
		const user = { name: "test", id: "1", email: data.email }; // Mock user

		if (!user) {
			return { error: "Invalid credentials" };
		}

		await session.update({
			userId: user.id,
			email: user.email,
		});

		// Redirect to protected area
		throw redirect({ to: "/" });
	});

// Logout server function
export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
	const session = await useAppSession();
	await session.clear();
	throw redirect({ to: "/" });
});

// Get current user
export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await useAppSession();
		const userId = session.data.userId;

		if (!userId) {
			return null;
		}

		// Mock user retrieval, replace with DB call
		return { name: "test", id: userId, email: session.data.email };
	},
);
