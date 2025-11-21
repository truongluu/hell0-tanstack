import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useId, useState } from "react";
import { loginFn } from "@/server/auth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { setStoredToken } from "../../lib/auth";

export const Route = createFileRoute("/demo/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const emailId = useId();
	const passwordId = useId();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loginMutation = useServerFn(loginFn);

	// TODO: replace with real server login function when available
	async function submit(e?: React.FormEvent) {
		e?.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await loginMutation({ data: { email, password } });

			// navigate to demo petstore page after login
			navigate({ to: "/demo/petstore" });
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Login failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="container mx-auto p-6 max-w-md">
			<h1 className="text-2xl font-bold mb-4">Login</h1>
			<form onSubmit={submit} className="space-y-4">
				<div>
					<Label htmlFor={emailId}>Email</Label>
					<Input
						id={emailId}
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
					/>
				</div>
				<div>
					<Label htmlFor={passwordId}>Password</Label>
					<Input
						id={passwordId}
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="••••••"
					/>
				</div>
				{error && <div className="text-red-600">{error}</div>}
				<Button type="submit" disabled={loading} className="w-full">
					{loading ? "Signing in..." : "Sign In"}
				</Button>
			</form>
			<p className="text-sm text-gray-500 mt-4">
				Use any email/password for the demo; token will be stored locally.
			</p>
		</div>
	);
}
