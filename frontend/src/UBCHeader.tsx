import React from "react";
import ubc_logo from "./ubc_icon.png";
import "./UBCHeader.css";

function UBCHeader() {
  return (
	<header className="ubc-header">
		<img src={ubc_logo} className="ubc-logo" alt="UBC logo"/>
		<h1 className="ubc-title">THE UNIVERSITY OF BRITISH COLUMBIA</h1>
	</header>
  );
}

export default UBCHeader;
