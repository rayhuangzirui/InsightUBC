import React, { useState } from 'react';
import constructQuery, { QueryParams, QueryType } from "../ConstructQuery";
import AutocompleteInput from "../InstructorDepart/AutocompleteInput";

type Room = {
	rooms_name: string;
	rooms_furniture: string;
	rooms_type: string;
	maxSeats: number;
}

interface ResultsTableProps {
	data: Room[];
}

const RoomSearch = () => {
	const [roomType, setRoomType] = useState<string>('');
	const [furnitureType, setFurnitureType] = useState<string>('');
	const [minSeats, setMinSeats] = useState<number>(0);
	const [searchResults, setSearchResults] = useState<Room[]>([]);
	const [error, setError] = useState<string>('');

	const handleRoomType = (value: string) => {
		setRoomType(value);
	};

	const handleFurnitureType = (value: string) => {
		setFurnitureType(value);
	};

	const handleMinSeats = (value: number) => {
		setMinSeats(value);
	};

	const mockAPI = (query: string): Promise<Room[]> => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve([
					{
						"rooms_name": "WOOD_2",
						"rooms_furniture": "Classroom-Fixed Tablets",
						"rooms_type": "Tiered Large Group",
						"maxSeats": 503
					},
					{
						"rooms_name": "CIRS_1250",
						"rooms_furniture": "Classroom-Fixed Tablets",
						"rooms_type": "Tiered Large Group",
						"maxSeats": 426
					},
					{
						"rooms_name": "ESB_1013",
						"rooms_furniture": "Classroom-Fixed Tablets",
						"rooms_type": "Tiered Large Group",
						"maxSeats": 350
					},
					{
						"rooms_name": "WESB_100",
						"rooms_furniture": "Classroom-Fixed Tablets",
						"rooms_type": "Tiered Large Group",
						"maxSeats": 325
					},
					{
						"rooms_name": "SCRF_100",
						"rooms_furniture": "Classroom-Fixed Tablets",
						"rooms_type": "Tiered Large Group",
						"maxSeats": 280
					},
					{
						"rooms_name": "BUCH_A101",
						"rooms_furniture": "Classroom-Fixed Tablets",
						"rooms_type": "Tiered Large Group",
						"maxSeats": 275
					},
					{
						"rooms_name": "CHEM_B150",
						"rooms_furniture": "Classroom-Fixed Tablets",
						"rooms_type": "Tiered Large Group",
						"maxSeats": 265
					},
					{
						"rooms_name": "HENN_200",
						"rooms_furniture": "Classroom-Fixed Tablets",
						"rooms_type": "Tiered Large Group",
						"maxSeats": 257
					},
					{
						"rooms_name": "FSC_1005",
						"rooms_furniture": "Classroom-Fixed Tablets",
						"rooms_type": "Tiered Large Group",
						"maxSeats": 250
					},
					{
						"rooms_name": "CHEM_B250",
						"rooms_furniture": "Classroom-Fixed Tablets",
						"rooms_type": "Tiered Large Group",
						"maxSeats": 240
					},
					{
						"rooms_name": "BIOL_2000",
						"rooms_furniture": "Classroom-Fixed Tablets",
						"rooms_type": "Tiered Large Group",
						"maxSeats": 228
					},
					{
						"rooms_name": "GEOG_100",
						"rooms_furniture": "Classroom-Fixed Tablets",
						"rooms_type": "Tiered Large Group",
						"maxSeats": 225
					},
					{
						"rooms_name": "MATH_100",
						"rooms_furniture": "Classroom-Fixed Tablets",
						"rooms_type": "Tiered Large Group",
						"maxSeats": 224
					}
				]);

				reject("Error: Could not fetch data");
			}, 1000);
		});
	}

	const handleSearch = async () => {
		if (!roomType) {
			setError("Please select a room type");
			return;
		}

		if (!furnitureType) {
			setError("Please select a furniture type");
			return;
		}

		const minSeatsRange = [0, 600];

		const validateMinSeats = (input: number) => {
			return input >= minSeatsRange[0] && input <= minSeatsRange[1];
		}

		if (!validateMinSeats(minSeats)) {
			console.log("Invalid minimum number of seats: " + minSeats + ".");
			setError("Please enter a valid minimum number of seats");
			return;
		} else {
			console.log("Valid minimum number of seats: " + minSeats + ".");
		}

		const queryParam: QueryParams = { roomType, furnitureType, minSeats };

		try {
			const query = constructQuery(QueryType.ROOM_SEARCH, queryParam);
			const results = await mockAPI(query);
			setSearchResults(results);
		} catch (err) {
			setError("Failed to fetch data");
		}
	};

	const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
		return (
			<table>
				<thead>
					<tr>
						<th>Room Name</th>
						<th>Furniture Type</th>
						<th>Room Type</th>
						<th>Max Seats</th>
					</tr>
				</thead>
				<tbody>
					{data.map((room, index) => (
						<tr key={index}>
							<td>{room.rooms_name}</td>
							<td>{room.rooms_furniture}</td>
							<td>{room.rooms_type}</td>
							<td>{room.maxSeats}</td>
						</tr>
					))}
				</tbody>
			</table>
		);
	}

	return (
		<div>
			<AutocompleteInput
				options={['Small Group', 'Medium Group', 'Large Group', 'Tiered Large Group']}
				placeholder="Select/enter a Room Type"
				onSelect={handleRoomType}
			/>
			<AutocompleteInput
				options={['Classroom-Fixed Tables', 'Classroom-Movable Tables & Chairs', 'Classroom-Movable Tablets', 'Classroom-Fixed Tablets']}
				onSelect={handleFurnitureType}
				placeholder="Select/enter a Furniture Type"
			/>
			<input type="number" value={minSeats} onChange={(e) => setMinSeats(e.target.valueAsNumber)} />
			<button onClick={handleSearch}>Search</button>
			{error && <div className="error">{error}</div>}
			{searchResults.length > 0 && <ResultsTable data={searchResults} />}
		</div>
	);
};

export default RoomSearch;
