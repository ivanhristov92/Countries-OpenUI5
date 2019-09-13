/* global Fuse: true */

sap.ui.define([
	"../../libs/fuse",
], function () {
	"use strict";

	const _filterByName = (_countries, name) => {
		var options = {
			shouldSort: true,
			threshold: 0.1,
			location: 0,
			distance: 100,
			maxPatternLength: 32,
			minMatchCharLength: 1,
			keys: ["name"]
		};
		var fuse = new Fuse(_countries, options);
		let result = fuse.search(name);
		return result;
	};

	const _filterByLanguage = (_countries, language) => {
		return _countries.filter(country => {
			var options = {
				shouldSort: true,
				threshold: 0.1,
				location: 0,
				distance: 100,
				maxPatternLength: 32,
				minMatchCharLength: 1,
				keys: ["name"]
			};
			var fuse = new Fuse([country.languages[0] || {}], options);
			let result = fuse.search(language);
			return result.length > 0;
		});
	};
	const _filterByCurrency = (_countries, currency) => {
		return _countries.filter(country => {
			var options = {
				shouldSort: true,
				threshold: 0.1,
				location: 0,
				distance: 100,
				maxPatternLength: 32,
				minMatchCharLength: 1,
				keys: ["name"]
			};
			var fuse = new Fuse([country.currencies[0] || {}], options);
			let result = fuse.search(currency);
			return result.length > 0;
		});
	};

	const applyCountryFilters = (countryList, selectedFilters) => {
		let _countries = [...countryList];
		let { name, population, language, currency } = selectedFilters;
		if (name) {
			_countries = _filterByName(_countries, name);
		}
		if (language) {
			_countries = _filterByLanguage(_countries, language);
		}
		if (currency) {
			_countries = _filterByCurrency(_countries, currency);
			_countries = _filterByCurrency(_countries, currency);
		}
		if (population) {
			_countries = _countries.filter(country => {
				return country.population === population;
			});
		}
		return _countries;
	};

	return applyCountryFilters
});
