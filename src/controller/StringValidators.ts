import {Mfield, Sfield} from "./QueryInterfaces";

export function IDValidator (id: string): boolean {
	if (id.includes("_")) {
		return false;
	} else if (!id.trim()) {
		return false;
	}

	return true;
}

export function inputStringValidator(inputString: string): boolean {
	if (inputString.includes("*")) {
		const firstAsterisk = inputString.indexOf("*");
		const lastAsterisk = inputString.lastIndexOf("*");

		if (firstAsterisk !== 0 && firstAsterisk !== inputString.length - 1) {
			return false;
		}

		if (lastAsterisk !== 0 && lastAsterisk !== inputString.length - 1) {
			return false;
		}
	}

  // empty or no *
	return true;
}

export function isMkey(key: string): boolean {
	const mFields = Object.values(Mfield);
	return mFields.some((field) => key.endsWith(`_${field}"`));
}

export function isSkey(key: string): boolean {
	const sFields = Object.values(Sfield);
	return sFields.some((field) => key.endsWith(`_${field}"`));
}
