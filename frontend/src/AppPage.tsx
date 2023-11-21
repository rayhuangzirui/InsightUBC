import React from 'react';
import CourseSearchByInsDepart from "./InstructorDepart/CourseSearchByInsDepart";
import CourseAverageSearch from "./SearchAverage/CourseAverageSearch";
import RoomSearch from "./RoomsSearchComponent/RoomSearch";
import UBCHeader from "./UBCHeader";
import "./InstructorDepart/Title.css";

function AppPage() {
	return (
		<div className="AppPage">
			<UBCHeader />
			<div className="search-container">
				<h2 className="search-title">Course Search</h2>
				<p className="search-description">Select a department from the dropdown list and enter the instructor's last name to find relevant courses.</p>
			</div>

			<CourseSearchByInsDepart />
			<div className="search-container">
				<h2 className="search-title">Search for CS Course Average</h2>
				<p className="search-description">Enter a CS course number and earliest year you want to trace back to get the average grades of the courses</p>
			</div>

			<CourseAverageSearch />
			<div className="search-container">
				<h2 className="search-title">Search for Rooms</h2>
				<p className="search-description">Select room type and furniture type as you prefer, and enter the minimum number of seats to find suitable rooms.</p>
			</div>
			<RoomSearch />
		</div>
	);
}

export default AppPage;
