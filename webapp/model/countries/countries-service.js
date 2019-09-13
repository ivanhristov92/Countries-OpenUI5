sap.ui.define([
], function () {
	"use strict";

	function fetchAllCountries(){
		return $.ajax({
			method: "GET",
			url: "https://restcountries.eu/rest/v2/all?fields=flag;name;population;languages;currencies;region",
			dataType: "JSON"
		})
	}

	function fetchCountry(countryName){
		return $.ajax({
			method: "GET",
			url: `https://restcountries.eu/rest/v2/name/${countryName}`,
			dataType: "JSON"
		})

	}

	return {
		fetchAllCountries,
		fetchCountry
	};
});
