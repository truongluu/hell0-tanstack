import { useQuery } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext } from "react";
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

function useCurrentUser() {
	return useQuery({
		queryKey: ["auth", "currentUser"],
		queryFn: getCurrentUserFn,
		staleTime: 1000 * 60 * 5, // 5 minutes
		retry: false,
	});
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const { data: user, isLoading, refetch } = useCurrentUser();

	return (
		<AuthContext.Provider
			value={{
				user: user ?? null,
				isLoading,
				refetch: () => {
					refetch();
				},
			}}
		>
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
