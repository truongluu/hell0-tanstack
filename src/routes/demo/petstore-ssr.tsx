import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { Pet } from "@/api/petstore/types.gen";
import { petstoreKeys, useFindPetsByStatus } from "@/api/petstore-hooks";

// Server function to fetch pets during SSR
const getPetsSsr = createServerFn({ method: "GET" }).handler(async () => {
	// Dynamically import to avoid module-level execution
	const { useAppSession } = await import("@/lib/session");
	const { Pet: PetAPI } = await import("@/api/petstore/sdk.gen");

	const session = await useAppSession();
	const token = session.data.userId
		? `Bearer ${session.data.userId}`
		: undefined;

	// Call the generated SDK directly on the server
	const response = await PetAPI.findPetsByStatus({
		query: { status: ["available"] },
		...(token && { auth: token }),
	});

	return response.data || [];
});

export const Route = createFileRoute("/demo/petstore-ssr")({
	component: PetstoreSSR,
	// Streaming loader - starts rendering before data is ready
	loader: ({ context }) => {
		// Start fetching but don't await
		const petsPromise = getPetsSsr();

		// Prefill the TanStack Query cache with the promise
		context.queryClient.prefetchQuery({
			queryKey: petstoreKeys.petsByStatus(["available"]),
			queryFn: () => petsPromise,
		});

		// Return immediately - data will stream in
		return { petsPromise };
	},
	pendingComponent: () => <div>Loading pets...</div>,
});

function PetstoreSSR() {
	// This hook will use the SSR-prefetched data immediately
	// No loading state on initial render!
	const { data: pets, isLoading, refetch } = useFindPetsByStatus(["available"]);

	return (
		<div className="container mx-auto p-6">
			<h1 className="text-3xl font-bold mb-6">Petstore SSR Demo</h1>

			<div className="mb-4 flex gap-2">
				<button
					type="button"
					onClick={() => refetch()}
					disabled={isLoading}
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
				>
					{isLoading ? "Loading..." : "Refetch Pets"}
				</button>
			</div>

			<div className="bg-white/10 p-4 rounded mb-4">
				<p className="text-sm text-gray-300">
					This page demonstrates TanStack Query SSR:
				</p>
				<ul className="list-disc list-inside text-sm text-gray-400 mt-2">
					<li>Data is fetched on the server during SSR</li>
					<li>Query cache is prefilled before hydration</li>
					<li>No loading state on initial render</li>
					<li>Subsequent refetches use client-side auth token</li>
				</ul>
			</div>

			<div className="grid gap-4">
				{pets?.map((pet: Pet) => (
					<div
						key={pet.id}
						className="bg-white/5 border border-white/10 rounded-lg p-4"
					>
						<h3 className="font-semibold text-lg">{pet.name}</h3>
						<p className="text-sm text-gray-400">Status: {pet.status}</p>
						{pet.category && (
							<p className="text-sm text-gray-400">
								Category: {pet.category.name}
							</p>
						)}
					</div>
				))}

				{!pets ||
					(pets.length === 0 && (
						<p className="text-gray-500">No pets available</p>
					))}
			</div>
		</div>
	);
}
