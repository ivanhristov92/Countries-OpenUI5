sap.ui.define([
], function () {
	"use strict";
	 function applyPagination(resultsPerPage, currentPage, list) {
		if (!resultsPerPage) return list;

		let listItemsToShow = list.slice(
			resultsPerPage * (currentPage - 1),
			resultsPerPage * (currentPage - 1) + resultsPerPage
		);
		return listItemsToShow;
	}

	applyPagination.calculateTotalPages = function(aAllData, nItemsPerPage){
		if(!nItemsPerPage){return 1}
		return Math.ceil(aAllData.length / nItemsPerPage);
	}

	return applyPagination;
});
