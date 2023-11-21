import React, { useEffect, useState } from "react";
import constructQuery, { QueryParams, QueryType } from "../ConstructQuery";
import AutocompleteInput from "../InstructorDepart/AutocompleteInput";
import performApiCall from "../apiCall";

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

	const [types, setTypeList] = useState<string[]>([]);
	const [furniture, setFurnitureList] = useState<string[]>([]);

	useEffect(() => {
		console.log("Fetching types");
		fetchTypes().then(() => console.log("Types fetched"));
	}, []);

	useEffect(() => {
		console.log("Fetching furniture");
		fetchFurniture().then(() => console.log("Furniture fetched"));
	}, []);

	const fetchTypes = async () => {
		try {
			console.log("Fetching types");
			const query = constructQuery(QueryType.ROOM_TYPE, {});
			console.log("Query: " + JSON.stringify(query));
			const response = await performApiCall(query, 'query');
			console.log("Here");
			console.log("Response received: " + response.result);
			const typeResult = response.result.map((type: any) => type.rooms_type);
			setTypeList(typeResult);
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			} else {
				setError("Error: Could not fetch data");
			}
		}
	}

	const fetchFurniture = async () => {
		try {
			const query = constructQuery(QueryType.ROOM_FURNITURE, {});
			const response = await performApiCall(query, 'query');
			console.log("Response received: " + response.result);
			const furnitureResult = response.result.map((furniture: any) => furniture.rooms_furniture);
			setFurnitureList(furnitureResult);
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			} else {
				setError("Error: Could not fetch data");
			}
		}
	}


	const handleRoomType = (value: string) => {
		setRoomType(value);
	};

	const handleFurnitureType = (value: string) => {
		setFurnitureType(value);
	};

	const handleMinSeats = (value: number) => {
		setMinSeats(value);
	};


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
			const results = await performApiCall(query, 'query');
			console.log("Response received: " + results.result);
			setSearchResults(results.result);
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
				options={types}
				placeholder="Select/enter a Room Type"
				onSelect={handleRoomType}
				id="room-type-input"
				name="room-type"
			/>
			<AutocompleteInput
				options={furniture}
				onSelect={handleFurnitureType}
				placeholder="Select/enter a Furniture Type"
				id="furniture-type-input"
				name="furniture-type"
			/>
			<input type="number" id="minSeats-input" name="minSeats" value={minSeats} onChange={(e) => setMinSeats(e.target.valueAsNumber)} />
			<button onClick={handleSearch}>Search</button>
			{error && <div className="error">{error}</div>}
			{searchResults.length > 0 && <ResultsTable data={searchResults} />}
		</div>
	);
};

export default RoomSearch;
