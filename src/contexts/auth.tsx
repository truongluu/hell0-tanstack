import { useServerFn } from "@tanstack/react-start";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { getCurrentUserFn } from "@/server/auth";

type User = {
	id: string;
	email?: string;
	name: string;
};

type AuthContextType = {
	user: User | null;
	isLoading: boolean;
	refetch: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const getCurrentUser = useServerFn(getCurrentUserFn);
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchUser = async () => {
		setIsLoading(true);
		try {
			const userData = await getCurrentUser();
			setUser(userData);
		} catch {
			setUser(null);
		} finally {
			setIsLoading(false);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: ---
	useEffect(() => {
		fetchUser();
	}, []);

	return (
		<AuthContext.Provider value={{ user, isLoading, refetch: fetchUser }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
