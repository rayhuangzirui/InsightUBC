import {Key} from "./QueryInterfaces";
import {Mfield, Sfield} from "./ClausesEnum";

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

export function isMkey(key: any): boolean {
	const mFields = Object.values(Mfield);
	return mFields.some((field) => key.endsWith(`_${field}"`));
}

export function isSkey(key: any): boolean {
	const sFields = Object.values(Sfield);
	return sFields.some((field) => key.endsWith(`_${field}"`));
}

export function orderKeyValidator(key: Key, key_list: Key[]): boolean {
	return key_list.includes(key);
}
