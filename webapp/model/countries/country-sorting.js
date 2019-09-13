function _sortByPopulation(countries, sortType) {
	return countries.sort(
		(a, b) =>
			sortType === "asc"
				? a.population - b.population
				: b.population - a.population
	);
}

function _sortByName(countries, sortType) {
	return countries.sort((a, b) => {
		if (sortType === "asc") {
			if (a.name < b.name) return -1;
			if (a.name > b.name) return 1;
			return 0;
		}
		if (sortType === "desc") {
			if (a.name < b.name) return 1;
			if (a.name > b.name) return -1;
			return 0;
		}
	});
}

sap.ui.define([
], function () {
	return function applyCountrySorting(countries, sortBy) {
		if (sortBy.length === 0) return countries;

		let _countries = [...countries];
		for (let i = 0; i < sortBy.length; i++) {
			let { by, type } = sortBy[i];
			if (by === "population") {
				_countries = _sortByPopulation(_countries, type);
			} else if (by === "name") {
				_countries = _sortByName(_countries, type);
			}
		}
		return _countries;
	}
});

