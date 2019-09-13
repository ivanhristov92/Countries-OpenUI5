sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"./D3Chart",
	"sap/ui/thirdparty/d3",
	"sap/ui/core/theming/Parameters"
], function($, D3Chart, d3, Parameters) {
	"use strict";

	return D3Chart.extend("sap.ui.demo.masterdetail.control.D3ColumnChart", {

		init: function () {
			D3Chart.prototype.init.call(this);
			this.setType("Column");
		},

		_updateSVG: function (iWidth) {
			var aData = this.getBinding("data").getCurrentContexts().map(function (oContext) {
				return oContext.getObject();
			});

			aData = aData.map(d=> (typeof d.population === "number") ? d : {...d, population: 0})
			if(!aData.length) return;

			var selContainer = d3.select("#" + this._sContainerId);
			var selRects = selContainer.selectAll("rect").data(aData);

			// sort the data by "v" parameter and extract the highest value
			var iHightestValue = aData[Object.keys(aData).sort(function(a, b){return aData[a].population - aData[b].population;}).pop()].population;

			selRects.enter().append("rect");
			selContainer.select("rect:nth-child(1)").style("fill", Parameters.get("sapUiChart1"));
			selContainer.select("rect:nth-child(2)").style("fill", Parameters.get("sapUiChart2"));
			selContainer.select("rect:nth-child(3)").style("fill", Parameters.get("sapUiChart3"));
			selContainer.select("rect:nth-child(4)").style("fill", Parameters.get("sapUiChart4"));
			selContainer.select("rect:nth-child(5)").style("fill", Parameters.get("sapUiChart5"));

			selContainer.selectAll("text").each(function (d) {
				var bVisible = d.population > 50 && $(this).parent().width() > 150;
				$(this).css("display", bVisible ? "block" : "none");
			});

			var iNumDataPoints = aData.length;
			var iNumSpaces = iNumDataPoints - 1;
			var iSpaceRelativeDoDataPoint = 0.25;
			var iBarWidth = iWidth / (iNumDataPoints + iNumSpaces * iSpaceRelativeDoDataPoint);
			var iSpaceWidth = iBarWidth * iSpaceRelativeDoDataPoint;
			selRects
				.attr("width", iBarWidth <= 100 ? iBarWidth : 100)
				.attr("height", function (d) {
					return d.population / iHightestValue * this._iHeight;
				}.bind(this))
				.attr("x", function (d, i) {
					return i * (iSpaceWidth + iBarWidth);
				})
				.attr("y", function (d, i) {
					return (this._iHeight - d.population / iHightestValue * this._iHeight) - 27;
				}.bind(this));

			var selTexts = selContainer.selectAll("text")
				.data(aData);

			selTexts.enter()
				.append("text").text(function (d) {
					return `${d.country}`
				}).attr("font-size", "0.875rem")
				.attr("fill", "black");



			selTexts
				.attr("x", function (d, i) {
				var fTextWidth = $(this).width();
				// return i * (iSpaceWidth + iBarWidth) + iBarWidth / 2 - fTextWidth * 0.75;
				return i * (iSpaceWidth + iBarWidth)
			})
				.attr("y", function () {
				return this._iHeight;
			}.bind(this));

			///////////////////

			var population = selTexts.enter()
				.append("text").text(function (d) {
					return `${d.population}`
				}).attr("font-size", "0.875rem")
				.attr("fill", "black");

			population.attr("x", function (d, i) {
					var fTextWidth = $(this).width();
					// return i * (iSpaceWidth + iBarWidth) + iBarWidth / 2 - fTextWidth * 0.75;
					return i * (iSpaceWidth + iBarWidth)
				})
				.attr("y", function () {
					return this._iHeight - 15;
				}.bind(this));

		},

		renderer: function () {
			D3Chart.prototype.getRenderer().render.apply(this, arguments);
		}
	});
});
