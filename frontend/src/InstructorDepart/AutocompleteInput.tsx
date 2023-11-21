import React, { useState, useEffect, useRef } from "react";
import './AutocompleteInput.css';

interface AutocompleteInputProps {
	  options: string[];	// The list of options to display in the autocomplete dropdown
	  onSelect: (value: string) => void; // The function to call when an option is selected
	  placeholder: string; // The placeholder text to display in the input
}

let blurTimeout: ReturnType<typeof setTimeout> | null = null;

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ options, onSelect, placeholder }) => {
	const [inputValue, setInputValue] = useState('');
	const [isDropdownVisible, setIsDropdownVisible] = useState(false);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const inputRef = useRef<HTMLInputElement>(null);

	const onBlurHandler = () => {
		if (blurTimeout) {
			clearTimeout(blurTimeout);
		}

		blurTimeout = setTimeout(() => {
			setIsDropdownVisible(false);
			setInputValue('');
		}, 100);
	};

	useEffect(() => {
		// Update suggestions based on input value
		setSuggestions(
			inputValue ? options.filter(option => option.toLowerCase().includes(inputValue.toLowerCase())) : options
		);
	}, [inputValue, options]);

	return (
		<div className = "autocomplete-container">
			<input
				ref={inputRef}
				type="text"
				id="department-input"
				name="department"
				className="autocomplete-input"
				placeholder={placeholder}
				value={inputValue}
				onChange={(event) => setInputValue(event.target.value)}
				onFocus={() => setIsDropdownVisible(true)}
				onBlur={onBlurHandler}
			/>
			{isDropdownVisible && (
				<div className = "suggestions-container">
					{suggestions.map((option) => (
						<div key={option} className="suggestion-item" onMouseDown={(event) => {
							event.preventDefault(); // Prevents input from losing focus
							console.log("Item clicked: " + option);
							onSelect(option);
							setIsDropdownVisible(false); // Hide dropdown after selecting an option
							inputRef.current?.blur(); // Focus on input after selecting an option
						}}>
							{option}
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default AutocompleteInput;
