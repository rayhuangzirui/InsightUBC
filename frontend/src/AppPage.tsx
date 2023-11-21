import React from 'react';
import CourseSearchByInsDepart from "./InstructorDepart/CourseSearchByInsDepart";
import CourseAverageSearch from "./SearchAverage/CourseAverageSearch";
import RoomSearch from "./RoomsSearchComponent/RoomSearch";
// import './App.css';


// let app = new App();
// await app.initServer(4321);

function AppPage() {
	return (
		<div className="AppPage">
			<CourseSearchByInsDepart />
			<CourseAverageSearch />
			<RoomSearch />
		</div>
	);
}

export default AppPage;
