import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { Pet } from "../../api/petstore/types.gen";
import {
	invalidateInventoryQueries,
	invalidatePetQueries,
	useAddPet,
	useDeletePet,
	useFindPetsByStatus,
	useGetInventory,
	useGetPetById,
	useUpdatePet,
} from "../../api/petstore-hooks";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";

export const Route = createFileRoute("/demo/petstore")({
	component: PetstoreDemo,
});

function PetstoreDemo() {
	const [status, setStatus] = useState<"available" | "pending" | "sold">(
		"available",
	);
	const [petId, setPetId] = useState<string>("");
	const [newPetName, setNewPetName] = useState<string>("");
	const [newPetPhotoUrl, setNewPetPhotoUrl] = useState<string>("");

	const queryClient = useQueryClient();

	// Queries
	const {
		data: pets,
		isLoading: petsLoading,
		error: petsError,
	} = useFindPetsByStatus([status]);
	const {
		data: pet,
		isLoading: petLoading,
		error: petError,
	} = useGetPetById(Number.parseInt(petId) || 0);
	const {
		data: inventory,
		isLoading: inventoryLoading,
		error: inventoryError,
	} = useGetInventory({ staleTime: 10000 });

	// Mutations
	const addPetMutation = useAddPet({
		onSuccess: () => {
			invalidatePetQueries(queryClient);
			setNewPetName("");
			setNewPetPhotoUrl("");
			alert("Pet added successfully!");
			invalidateInventoryQueries(queryClient);
		},
		onError: (error: Error) => {
			alert(`Error adding pet: ${error.message}`);
		},
	});

	const updatePetMutation = useUpdatePet({
		onSuccess: () => {
			invalidatePetQueries(queryClient);
			alert("Pet updated successfully!");
		},
		onError: (error: Error) => {
			alert(`Error updating pet: ${error.message}`);
		},
	});

	const deletePetMutation = useDeletePet({
		onSuccess: () => {
			invalidatePetQueries(queryClient);
			setPetId("");
			alert("Pet deleted successfully!");
		},
		onError: (error: Error) => {
			alert(`Error deleting pet: ${error.message}`);
		},
	});

	const handleAddPet = () => {
		if (!newPetName || !newPetPhotoUrl) {
			alert("Please provide both name and photo URL");
			return;
		}

		addPetMutation.mutate({
			name: newPetName,
			photoUrls: [newPetPhotoUrl],
			status: "available",
		});
	};

	const handleUpdatePet = (pet: Pet) => {
		const newStatus =
			pet.status === "available"
				? "pending"
				: pet.status === "pending"
					? "sold"
					: "available";

		updatePetMutation.mutate({
			...pet,
			status: newStatus,
		});
	};

	const handleDeletePet = (petId: number) => {
		if (confirm(`Are you sure you want to delete pet #${petId}?`)) {
			deletePetMutation.mutate(petId);
		}
	};

	return (
		<div className="container mx-auto p-6 space-y-8">
			<div>
				<h1 className="text-3xl font-bold mb-2">Petstore API Demo</h1>
				<p className="text-gray-600">
					Integration with Swagger Petstore using OpenAPI Generator + TanStack
					Query
				</p>
			</div>

			{/* Store Inventory Section */}
			<section className="border rounded-lg p-6 bg-white shadow-sm">
				<h2 className="text-2xl font-semibold mb-4">Store Inventory</h2>
				{inventoryLoading && (
					<p className="text-gray-500">Loading inventory...</p>
				)}
				{inventoryError && (
					<p className="text-red-500">Error: {inventoryError.message}</p>
				)}
				{inventory && (
					<div className="grid grid-cols-3 gap-4">
						{Object.entries(inventory).map(([status, count]) => (
							<div
								key={status}
								className="border rounded p-4 bg-gray-50 text-center"
							>
								<div className="text-2xl font-bold text-blue-600">{count}</div>
								<div className="text-sm text-gray-600 capitalize">{status}</div>
							</div>
						))}
					</div>
				)}
			</section>

			{/* Add Pet Section */}
			<section className="border rounded-lg p-6 bg-white shadow-sm">
				<h2 className="text-2xl font-semibold mb-4">Add New Pet</h2>
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label htmlFor="petName">Pet Name</Label>
							<Input
								id="petName"
								placeholder="Enter pet name"
								value={newPetName}
								onChange={(e) => setNewPetName(e.target.value)}
							/>
						</div>
						<div>
							<Label htmlFor="photoUrl">Photo URL</Label>
							<Input
								id="photoUrl"
								placeholder="Enter photo URL"
								value={newPetPhotoUrl}
								onChange={(e) => setNewPetPhotoUrl(e.target.value)}
							/>
						</div>
					</div>
					<Button
						onClick={handleAddPet}
						disabled={addPetMutation.isPending}
						className="w-full"
					>
						{addPetMutation.isPending ? "Adding..." : "Add Pet"}
					</Button>
				</div>
			</section>

			{/* Find Pets by Status */}
			<section className="border rounded-lg p-6 bg-white shadow-sm">
				<h2 className="text-2xl font-semibold mb-4">Find Pets by Status</h2>
				<div className="mb-4">
					<Label htmlFor="status">Status</Label>
					<Select
						value={status}
						onValueChange={(value) =>
							setStatus(value as "available" | "pending" | "sold")
						}
					>
						<SelectTrigger id="status">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="available">Available</SelectItem>
							<SelectItem value="pending">Pending</SelectItem>
							<SelectItem value="sold">Sold</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{petsLoading && <p className="text-gray-500">Loading pets...</p>}
				{petsError && (
					<p className="text-red-500">Error: {petsError.message}</p>
				)}
				{pets && (
					<div>
						<p className="text-sm text-gray-600 mb-4">
							Found {pets.length} pet(s) with status "{status}"
						</p>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{pets.slice(0, 12).map((pet) => (
								<div
									key={pet.id}
									className="border rounded-lg p-4 bg-gray-50 space-y-2"
								>
									<div className="flex justify-between items-start">
										<h3 className="font-semibold">{pet.name}</h3>
										<span
											className={`text-xs px-2 py-1 rounded ${
												pet.status === "available"
													? "bg-green-100 text-green-800"
													: pet.status === "pending"
														? "bg-yellow-100 text-yellow-800"
														: "bg-gray-100 text-gray-800"
											}`}
										>
											{pet.status}
										</span>
									</div>
									<p className="text-sm text-gray-600">ID: {pet.id}</p>
									{pet.category && (
										<p className="text-sm text-gray-600">
											Category: {pet.category.name}
										</p>
									)}
									<div className="flex gap-2 mt-2">
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleUpdatePet(pet)}
											disabled={updatePetMutation.isPending}
										>
											Change Status
										</Button>
										<Button
											size="sm"
											variant="outline"
											onClick={() => pet.id && handleDeletePet(pet.id)}
											disabled={deletePetMutation.isPending}
											className="text-red-600 hover:text-red-700"
										>
											Delete
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</section>

			{/* Get Pet by ID */}
			<section className="border rounded-lg p-6 bg-white shadow-sm">
				<h2 className="text-2xl font-semibold mb-4">Get Pet by ID</h2>
				<div className="mb-4">
					<Label htmlFor="petId">Pet ID</Label>
					<Input
						id="petId"
						type="number"
						placeholder="Enter pet ID"
						value={petId}
						onChange={(e) => setPetId(e.target.value)}
					/>
				</div>

				{petLoading && <p className="text-gray-500">Loading pet...</p>}
				{petError && <p className="text-red-500">Error: {petError.message}</p>}
				{pet && (
					<div className="border rounded-lg p-4 bg-gray-50 space-y-2">
						<h3 className="font-semibold text-lg">{pet.name}</h3>
						<p className="text-sm text-gray-600">ID: {pet.id}</p>
						<p className="text-sm text-gray-600">Status: {pet.status}</p>
						{pet.category && (
							<p className="text-sm text-gray-600">
								Category: {pet.category.name}
							</p>
						)}
						{pet.tags && pet.tags.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-2">
								{pet.tags.map((tag) => (
									<span
										key={tag.id}
										className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800"
									>
										{tag.name}
									</span>
								))}
							</div>
						)}
						{pet.photoUrls && pet.photoUrls.length > 0 && (
							<div className="mt-2">
								<p className="text-sm font-medium mb-1">Photos:</p>
								<div className="flex flex-wrap gap-2">
									{pet.photoUrls.map((url, index) => (
										<a
											key={index}
											href={url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs text-blue-600 hover:underline"
										>
											Photo {index + 1}
										</a>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</section>
		</div>
	);
}
