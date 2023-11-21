import React from 'react';
import CourseSearchByInsDepart from "./InstructorDepart/CourseSearchByInsDepart";
import CourseAverageSearch from "./SearchAverage/CourseAverageSearch";
import RoomSearch from "./RoomsSearchComponent/RoomSearch";
// import './App.css';

function App() {
	return (
		<div className="App">
			<CourseSearchByInsDepart />
			<CourseAverageSearch />
			<RoomSearch />
		</div>
	);
}

export default App;
