sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"../model/formatter",
	"../model/countries/country-filtering",
	"../model/countries/country-sorting",
	"../model/countries/country-pagination",
	"../model/countries/country-utils",
	"../model/countries/countries-service",
	"sap/ui/core/mvc/XMLView",
	"../model/countries/population-stats-service",
], function (BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem,
			 Device, Fragment, formatter, applyCountryFilters, applyCountrySorting, applyCountryPagination,
			 countryUtils, CountriesService, XMLView, PopulationStatsService) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.controller.Master", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit : function () {
			var oList = this.byId("list");
			var	iOriginalBusyDelay = oList.getBusyIndicatorDelay();
			this._oList = oList;

			CountriesService.fetchAllCountries()
			.done(setUpModelAndView.bind(this));

			function setUpModelAndView(aAllData){
				var oViewModel = this.makeModel(aAllData)
				this.setModel(oViewModel, "masterView");
				oList.attachEventOnce("updateFinished", function(){
					oViewModel.setProperty("/delay", iOriginalBusyDelay);
				});
				this.getView().addEventDelegate({
					onBeforeFirstShow: function () {
						this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
					}.bind(this)
				});
				this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
				this.getRouter().attachBypassed(this.onBypassed, this);
				this.updateStatsChart();
			}
		},



		makeModel: function(aAllCountries){
			return new JSONModel({
				allCountries: aAllCountries,
				selectedFilters: {
					name: "",
					currency: "",
					language: "",
					population: ""
				},
				pagination: {
					resultsPerPage: 0, //means all
					currentPage: 1, // first page
					totalPages: 1 // all countries
				},
				sortBy: [],

				/////// Filtering Options
				allNames: countryUtils.extractNames(aAllCountries),
				allCurrencies: countryUtils.extractCurrencies(aAllCountries),
				allLanguages: countryUtils.extractLanguages(aAllCountries),
				allPopulationNumbers: countryUtils.extractPopulationNumbers(aAllCountries),
				allRegions: countryUtils.extractRegions(aAllCountries),
				allCountriesByRegion: countryUtils.groupCountriesByRegion(aAllCountries),
				////////// Filtering, Sorting and Pagination Result
				visibleCountries: aAllCountries,
				////////// Population Statistics
				statisticControls: PopulationStatsService.getPersistedStatsData() || [],
				///////// General Visualization Properties
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				features: [
					"Enterprise-Ready Web Toolkit",
					"Powerful Development Concepts",
					"Feature-Rich UI Controls",
					"Consistent User Experience",
					"Free and Open Source",
					"Responsive Across Browsers and Devices"
				]
			});

		},

		model: function(){
			return this.getModel("masterView");
		},


		updateStatsChart: function () {
			XMLView.create({
				viewName: "sap.ui.demo.masterdetail.view.StatisticsD3"
			}).then(function (oView) {
				this.byId("statisticsContainer").destroyContent();
				this.byId("statisticsContainer").addContent(oView);
			}.bind(this));
		},

		persistStatsData(){
			let data = this.model().getProperty("/statisticControls");
			PopulationStatsService.persistStatsData(data)
		},

		/**
		 * Event Handlers - Country Population Stats
		 */


		onAddCountryStatsRow: function(){
			this.setNewStatsControlsRow();
			this.updateStatsChart();
			this.persistStatsData();
		},

		setNewStatsControlsRow(){
			let currentControls = this.model().getProperty("/statisticControls");
			let id = PopulationStatsService.generateId();
			let newControl = {region: "", country: "", countries: [],
				countriesForRegion: [], population: 0, id: id, showCountries: false};
			this.model().setProperty("/statisticControls", [...currentControls, newControl]);
		},

		onRemoveStatsRow: function(oEvent){
			let statsControlId = oEvent.getSource().getCustomData()[0].mProperties.value;
			this.removeStatsControlWithId(statsControlId);
			this.updateStatsChart();
			this.persistStatsData();
		},

		removeStatsControlWithId(statsControlId){
			let currentStatsControls = this.model().getProperty("/statisticControls");
			let newStats = currentStatsControls.filter(s=>s.id !== statsControlId);
			this.model().setProperty("/statisticControls", newStats);
		},

		onStatsRegionSelected(oEvent){
			let statsControlId = oEvent.getSource().getCustomData()[0].mProperties.value;
			let region = oEvent.getSource().getSelectedKey();
			this.setRegionForStatsRowWithId(statsControlId, region);
			this.deselectCountryForStatsRowWithId(statsControlId);
			this.updateStatsChart();
			this.persistStatsData();
		},

		setRegionForStatsRowWithId(statsControlId, region){
			let currentControls = this.model().getProperty("/statisticControls");
			let newControls = currentControls.map(c=>{
				return c.id === statsControlId ?
					{
						...c, region: region,
						countriesForRegion: this.model().getProperty(`/allCountriesByRegion/${region}`),
						showCountries: true
					}
					: c;
			});
			this.model().setProperty("/statisticControls", newControls);
		},


		onStatsCountrySelected(oEvent){
			let statsControlId = oEvent.getSource().getCustomData()[0].mProperties.value;
			let country = oEvent.getSource().getSelectedKey();
			this.setCountryForStatsRowWithId(statsControlId, country);
			this.updateStatsChart();
			this.persistStatsData();
		},

		setCountryForStatsRowWithId(statsControlId, country){
			let currentControls = this.model().getProperty("/statisticControls");
			let newControls = currentControls.map(c=>{
				if(c.id !== statsControlId) {
					return c
				}
				let {population} = c.countriesForRegion.find(country=>country.name === c.country);
				return {
					...c, country: country,
					population: population
				}
			});
			this.model().setProperty("/statisticControls", newControls);
		},

		deselectCountryForStatsRowWithId(statsControlId){
			let currentControls = this.model().getProperty("/statisticControls");
			let newControls = currentControls.map(c=>{
				if(c.id !== statsControlId) {
					return c
				}
				return {
					...c, country: "",
					population: 0,
				}
			});
			this.model().setProperty("/statisticControls", newControls);
		},

		/**
		 * Event Handlers - Country List
		 */


		onSearchChange(oEvent){
			var name = oEvent.getSource().getValue();
			if(name === ""){
				this.setNameFilter(name);
				this.setCurrentPageToFirst();
				this.recalculateVisibleCountries();
			}
		},

		onSearch: function(oEvent){
			var name = oEvent.getSource().getValue();
			this.setNameFilter(name);
			this.setCurrentPageToFirst();
			this.recalculateVisibleCountries();
		},


		onResultsPerPageChange: function(oEvent){
			var numberOfResults = Number(oEvent.getSource().getValue());
			this.setResultsPerPage(numberOfResults);
			this.setCurrentPageToFirst();
			this.recalculateVisibleCountries();
		},

		onNextPage(){
			let model = this.model();
			let currentPage = model.getProperty("/pagination/currentPage");
			if(currentPage < model.getProperty("/pagination/totalPages")){
				this.setPageNumber(currentPage+1);
				this.recalculateVisibleCountries();
			}
		},

		onPrevPage(){
			let model = this.model();
			let currentPage = model.getProperty("/pagination/currentPage");
			if(currentPage > 1){
				this.setPageNumber(currentPage - 1);
				this.recalculateVisibleCountries();
			}
		},

		onOpenViewSettings : function (oEvent) {
			var sDialogTab = "filter";
			if (oEvent.getSource() instanceof sap.m.Button) {
				var sButtonId = oEvent.getSource().getId();
				if (sButtonId.match("sort")) {
					sDialogTab = "sort";
				} else if (sButtonId.match("group")) {
					sDialogTab = "group";
				}
			}
			// load asynchronous XML fragment
			if (!this.byId("viewSettingsDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "sap.ui.demo.masterdetail.view.ViewSettingsDialog",
					controller: this,
				}).then(function(oDialog){
					// connect dialog to the root view of this component (models, lifecycle)
					let view = this.getView();
					view.addDependent(oDialog);


					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open(sDialogTab);
				}.bind(this));
			} else {
				this.byId("viewSettingsDialog").open(sDialogTab);
			}
		},

		onConfirmViewSettingsDialog(oEvent){
			// filters
			var aFilterItems = oEvent.getParameters().filterItems;
			let lang = aFilterItems.find(oItem=>oItem.getKey() === "language");
			let curr = aFilterItems.find(oItem=>oItem.getKey() === "currency");
			let pop = aFilterItems.find(oItem=>oItem.getKey() === "population");
			this.setLanguageFilter(lang ? lang.getText() : "");
			this.setCurrencyFilter(curr ? curr.getText() : "");
			this.setPopulationFilter(pop ? Number(pop.getText()) : "");
			// sorting
			var mParams = oEvent.getParameters();
			var sortKey = mParams.sortItem.getKey();
			let sortType = mParams.sortDescending ? "desc" : "asc";
			this.setSortType(sortKey, sortType);
			this.setCurrentPageToFirst();
			// rerender
			this.recalculateVisibleCountries();
		},


		/**
		 * State Setters
		 */
		setNameFilter: function(name){
			this.model().setProperty("/selectedFilters/name", name);
		},
		setLanguageFilter: function(language){
			this.model().setProperty("/selectedFilters/language", language)
		},
		setCurrencyFilter: function(currency){
			this.model().setProperty("/selectedFilters/currency", currency)
		},
		setPopulationFilter : function(population){
			this.model().setProperty("/selectedFilters/population", population)
		},
		setPageNumber: function(changeTo){
			this.model().setProperty("/pagination/currentPage", changeTo)
		},
		setCurrentPageToFirst : function(){
			this.model().setProperty("/pagination/currentPage", 1)
		},
		setResultsPerPage  : function(numberOfResults){
			this.model().setProperty("/pagination/resultsPerPage", numberOfResults);
		},

		getSortType(sortKey){
			let sorts =  this.model().getProperty("/sortBy");
			return (sorts.find(sort => sort.by === sortKey) || {})
				.type;
		},

		setSortType : function(sortKey, sortType){
			let currentSortByPopulation = this.getSortType(sortKey);
			if (!currentSortByPopulation) {
				return this.model().setProperty("/sortBy", [...this.model().getProperty("/sortBy"), { by: sortKey, type: sortType }]);
			}
			let newSortState = this.model().getProperty("/sortBy").filter(sort => sort.by !== sortKey);
			newSortState = newSortState.concat([{ by: sortKey, type: sortType }]);
			return this.model().setProperty("/sortBy", newSortState);

		},

		/**
		 * Filtering, Sorting and Pagination functionality
		 */
		prepareCountriesForVisualization: function(){
			/**
			 * Filter And Sort Countries
			 */
			let filteredCountries = applyCountryFilters(
				this.model().getProperty("/allCountries"),
				this.model().getProperty("/selectedFilters")
			);
			let sortedCountries = applyCountrySorting(
				filteredCountries,
				this.model().getProperty("/sortBy")
			);
			/**
			 * Paginate the list of countries
			 */
			let { resultsPerPage, currentPage } = this.model().getProperty("/pagination");
			let paginatedCountries = applyCountryPagination(
				resultsPerPage,
				currentPage,
				sortedCountries
			);

			let totalPages = applyCountryPagination.calculateTotalPages(sortedCountries, resultsPerPage)
			return {
				paginatedCountries,
				totalPages
			};
		},

		/**
		 * Rerendering on state changes
		 */
		recalculateVisibleCountries(){
		 	let {paginatedCountries, totalPages} = this.prepareCountriesForVisualization();
		 	this.model().setProperty("/visibleCountries", paginatedCountries);
		 	this.model().setProperty("/pagination/totalPages", totalPages);
		},



		/**
		 * After list data is available, this handler method updates the
		 * master list counter
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished : function (oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
		},


		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange : function (oEvent) {
			let countryName  = oEvent.getParameter("listItem").getCells()[1].getText();
			// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
			this._showDetail(countryName);
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed : function () {
			this._oList.removeSelections(true);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader : function (oGroup) {
			return new GroupHeaderListItem({
				title : oGroup.text,
				upperCase : false
			});
		},

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser historz
		 * @public
		 */
		onNavBack : function() {
			history.go(-1);
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */


		_onMasterMatched :  function() {
			//Set the layout property of the FCL control to 'OneColumn'
			this.getModel("appView").setProperty("/layout", "OneColumn");
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail : function (countryName) {
			var bReplace = !Device.system.phone;
			// set the layout property of FCL control to show two columns
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getRouter().navTo("object", {
				objectId : countryName
			}, bReplace);
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount : function (iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}
		},

	});

});
