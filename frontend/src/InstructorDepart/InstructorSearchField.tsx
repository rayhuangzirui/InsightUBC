import React, { useState } from "react";

interface InstructorSearchFieldProps {
	onSubmit: (value: string) => void;
}

const InstructorSearchField: React.FC<InstructorSearchFieldProps> = ({ onSubmit }) => {
	const [instructor, setInstructor] = useState('');
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleSearch = () => {
		if (!instructor) {
			return;
		}
		console.log("Searching for instructor: " + instructor);
		setIsSubmitted(true);
	};

	return (
		<form className = "instructor-search-field" onSubmit={(event)=> {
			event.preventDefault();
			handleSearch();
		}}>
			<input
				type="text"
				id="instructor-input"
				name="instructor"
				aria-label="Search by professor's last name"
				className="instructor-input"
				placeholder="Enter professor's last name"
				value={instructor}
				onChange={(event) => setInstructor(event.target.value)}
			/>
			<button type="submit" className="search-button" disabled={isSubmitted}>
				{isSubmitted ? "Submitted!" : "Submit"}
			</button>
		</form>
	)
};

export default InstructorSearchField;
