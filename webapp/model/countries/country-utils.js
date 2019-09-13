
sap.ui.define([
	"../../libs/ramda"
], function () {
	"use strict";

	let {uniq, uniqBy, groupBy, toLower, prop} = R;
	return {
		extractCurrencies(allCountries) {
			let currencies = allCountries.reduce((acc, country) => {
				return acc.concat(country.currencies);
			}, []);
			let sorted = R.sortBy(prop("name"), currencies);
			return uniqBy(prop("name"), sorted);
		},
		extractNames(allCountries) {
			let names = allCountries.map(country => {
				return country.name;
			});

			return uniq(names);
		},
		extractLanguages(allCountries) {
			let languages = allCountries.reduce((acc, country) => {
				return acc.concat(country.languages);
			}, []);
			let sortedLangs = R.sortBy(prop("name"), languages);
			return uniqBy(prop("name"), sortedLangs);
		},
		extractPopulationNumbers(allCountries) {
			let numbers = allCountries.map(country => country.population).sort((a, b)=>a-b);
			return uniq(numbers);
		},
		extractRegions(allCountries) {
			let regions = allCountries.map(country => country.region);
			return uniq(regions);
		},

		groupCountriesByRegion(allCountries){
			let grouped = groupBy(prop("region"), allCountries);
			return grouped;
		}
	};
})

