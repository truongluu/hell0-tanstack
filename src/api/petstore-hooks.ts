// TanStack Query hooks for Petstore API
import {
	type QueryClient,
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { client } from "./petstore/client.gen";
import { Pet, Store } from "./petstore/sdk.gen";
import type {
	AddPetData,
	Order,
	Pet as PetType,
	PlaceOrderData,
	UpdatePetData,
} from "./petstore/types.gen";

// Configure the base URL for the Petstore API
client.setConfig({
	baseUrl: "https://petstore.swagger.io/v2",
});

// Query Keys Factory
export const petstoreKeys = {
	all: ["petstore"] as const,
	pets: () => [...petstoreKeys.all, "pets"] as const,
	pet: (id: number) => [...petstoreKeys.pets(), id] as const,
	petsByStatus: (status: Array<"available" | "pending" | "sold">) =>
		[...petstoreKeys.pets(), "status", status] as const,
	inventory: () => [...petstoreKeys.all, "inventory"] as const,
	orders: () => [...petstoreKeys.all, "orders"] as const,
	order: (id: number) => [...petstoreKeys.orders(), id] as const,
};

// ============================================================================
// Pet Queries
// ============================================================================

/**
 * Hook to fetch pets by status
 */
export function useFindPetsByStatus(
	status: Array<"available" | "pending" | "sold">,
	options?: Omit<UseQueryOptions<PetType[], Error>, "queryKey" | "queryFn">,
	auth?: string | (() => Promise<string | undefined>),
) {
	return useSuspenseQuery({
		queryKey: petstoreKeys.petsByStatus(status),
		queryFn: async () => {
			const response = await Pet.findPetsByStatus({
				query: { status },
				auth,
			});
			return response.data ?? [];
		},
		...options,
	});
}

/**
 * Hook to fetch a single pet by ID
 */
export function useGetPetById(
	petId: number,
	options?: Omit<
		UseQueryOptions<PetType | null, Error>,
		"queryKey" | "queryFn"
	>,
	auth?: string | (() => Promise<string | undefined>),
) {
	return useSuspenseQuery({
		queryKey: petstoreKeys.pet(petId),
		queryFn: async () => {
			const response = await Pet.getPetById({
				path: { petId },
				auth,
			});
			return response.data ?? null;
		},
		enabled: petId > 0,
		...options,
	});
}

// ============================================================================
// Pet Mutations
// ============================================================================

/**
 * Hook to add a new pet
 */
export function useAddPet(
	options?: UseMutationOptions<PetType, Error, AddPetData["body"]>,
	auth?: string | (() => Promise<string | undefined>),
) {
	return useMutation({
		mutationFn: async (pet: AddPetData["body"]) => {
			const response = await Pet.addPet({
				body: pet,
				auth,
			});
			return response.data as PetType;
		},
		...options,
	});
}

/**
 * Hook to update an existing pet
 */
export function useUpdatePet(
	options?: UseMutationOptions<void, Error, UpdatePetData["body"]>,
	auth?: string | (() => Promise<string | undefined>),
) {
	return useMutation({
		mutationFn: async (pet: UpdatePetData["body"]) => {
			await Pet.updatePet({
				body: pet,
				auth,
			});
		},
		...options,
	});
}

/**
 * Hook to delete a pet
 */
export function useDeletePet(
	options?: UseMutationOptions<void, Error, number>,
	auth?: string | (() => Promise<string | undefined>),
) {
	return useMutation({
		mutationFn: async (petId: number) => {
			await Pet.deletePet({
				path: { petId },
				auth,
			});
		},
		...options,
	});
}

// ============================================================================
// Store Queries
// ============================================================================

/**
 * Hook to fetch store inventory
 */
export function useGetInventory(
	options?: Omit<
		UseQueryOptions<Record<string, number>, Error>,
		"queryKey" | "queryFn"
	>,
	auth?: string | (() => Promise<string | undefined>),
) {
	return useSuspenseQuery({
		queryKey: petstoreKeys.inventory(),
		queryFn: async () => {
			const response = await Store.getInventory({ auth });
			return response.data ?? {};
		},
		...options,
	});
}

/**
 * Hook to fetch an order by ID
 */
export function useGetOrderById(
	orderId: number,
	options?: Omit<UseQueryOptions<Order | null, Error>, "queryKey" | "queryFn">,
	auth?: string | (() => Promise<string | undefined>),
) {
	return useQuery({
		queryKey: petstoreKeys.order(orderId),
		queryFn: async () => {
			const response = await Store.getOrderById({
				path: { orderId },
				auth,
			});
			return response.data ?? null;
		},
		enabled: orderId > 0,
		...options,
	});
}

// ============================================================================
// Store Mutations
// ============================================================================

/**
 * Hook to place an order
 */
export function usePlaceOrder(
	options?: UseMutationOptions<Order | null, Error, PlaceOrderData["body"]>,
	auth?: string | (() => Promise<string | undefined>),
) {
	return useMutation({
		mutationFn: async (order: PlaceOrderData["body"]) => {
			const response = await Store.placeOrder({
				body: order,
				auth,
			});
			return response.data ?? null;
		},
		...options,
	});
}

// ============================================================================
// Helper function to invalidate queries
// ============================================================================

/**
 * Helper to invalidate all petstore queries
 */
export function invalidateAllPetstoreQueries(queryClient: QueryClient) {
	return queryClient.invalidateQueries({ queryKey: petstoreKeys.all });
}

/**
 * Helper to invalidate pet queries
 */
export function invalidatePetQueries(queryClient: QueryClient) {
	return queryClient.invalidateQueries({ queryKey: petstoreKeys.pets() });
}

export function invalidateInventoryQueries(queryClient: QueryClient) {
	return queryClient.invalidateQueries({ queryKey: petstoreKeys.inventory() });
}

export function invalidateOrderQueries(queryClient: QueryClient) {
	return queryClient.invalidateQueries({ queryKey: petstoreKeys.orders() });
}
