define( ["qlik"
		,"jquery"
		,"./assets/js/properties"
		,"./assets/js/colorPalettes"
		, "text!./style.css"
		, "text!./template.html"
		,'//d3js.org/d3.v4.min.js'
		,'require'
		,'https://momentjs.com/downloads/moment.js'
		,'./bower_components/QlikSenseD3Utils/senseD3utils'
		// ,'https://d3js.org/d3-scale-chromatic.v1.min.js'
		], 
	function (qlik, $, props, colorPalette, cssContent, template, d3, localRequire, moment) {
	'use strict';

    $("<style>").html(cssContent).appendTo("head");
	//////////////////////////////////////////////
	// Create helper function for array equality /
	//////////////////////////////////////////////
	function arraysEqual(a, b) {
	  if (a === b) return true;
	  if (a == null || b == null) return false;
	  if (a.length != b.length) return false;

	  for (var i = 0; i < a.length; ++i) {
	  	//if nested array - recurse the value
// console.log('type of subarray', typeof(a[i]), typeof(b[i]))
	  	if (typeof(a[i])==='array' && typeof(b[i])==='array') {
			arraysEqual(a[i], b[i]);
	  	}
	    else if (a[i] !== b[i]) {
	    	return false
	    };
	  }
	  return true;
	}
	function createXScale( data ) {
	//////////////////////////////////////////////
	// Create xScale component ///////////////////
	//////////////////////////////////////////////
		let xScale 	= d3.scaleTime()
						.domain([
							d3.min(data, function(d) { return d.TimeStart; }),
							d3.max(data, function(d) { return d.TimeEnd; })
						])
						;
		return xScale;
	}

	function createYScale( data, height ) {
	//////////////////////////////////////////////
	// Create yScale component ///////////////////
	//////////////////////////////////////////////
		let yScale 	= d3.scaleBand().rangeRound([0, height])
						.domain(data.map(function (d) { return d.Dim; }))
						.round(true)
						.padding(.1)
						;

		return yScale;
	}
	function dataChanges( data, chartID ) {

		//get chart selectors
		let selectors = getSelectors(chartID);
		//get size fields
		let sizeFields = getSizeFields( selectors );
		//get width
		let widthObj = getChartWidth(sizeFields);

		// //create selector vars
		// let chart 		= d3.select('div#gantt_' + chartID),
		// 	svg 		= chart.select('svg'),
		// 	artboard 	= svg.select('g.axisBoard'),
		// 	// bars		= svg.selectAll('g#bars > rect'),
		// 	xAxisEl		= artboard.select('g.xAxis.gantt'),
		// 	yAxisEl		= artboard.select('g.yAxis.gantt');

		// // create dynamic sizing
		// let	divWidth 		= parseInt(selectors.chart.style('width'), 10),
		// 	divHeight		= parseInt(selectors.chart.style('height'), 10),
		// 	marginRight		= 20,
		// 	marginBottom	= 30,
		// 	// marginLeft 		= divWidth <= 480 ? 0 : 100,
		// 	marginTop 		= divWidth <= 480 ? 0 : 30,
		// 	height 			= divHeight - marginTop - marginBottom;

		// set data related vars
		let xScale 		= createXScale( data ),
			yScale 		= createYScale( data, sizeFields.height ),
			minDate		= d3.min(data, function(d) { return d.TimeStart; }),
			xAxis       = d3.axisBottom().scale( xScale ),
			yAxis       = d3.axisLeft().scale( yScale )
	                      .tickSize(5),
	        numOfPts	= d3.max(data, function(d, i) { return i; })+1;

	 	let transitionDuration = (numOfPts<5 ? 1000 : 2500)/numOfPts;

// console.log('data return', data);


		let bars = selectors.svg.select('g#bars').selectAll('rect')
						.data(data);

		// Set new range for xScale
		xScale.range([0, widthObj.width]);

		//Enter…
		bars.enter()
			.append("rect")
			.attr("class", "selectable")
			.attr('data-value', function (d) {
				return d.ID;
			})
			.attr("transform", "translate(" + widthObj.marginLeft + "," + (sizeFields.marginTop) + ")")
     		.attr('height', yScale.bandwidth())
			.attr("y", function(d) {
				return yScale(d.Dim);
			})
			.attr("x",0)
			.attr('width',0)
			.attr('fill', function (d, i) {
				return d.Color;
			})
			.transition()
				.duration(1000)
				.ease(d3.easeLinear)
				.delay(function(d, i) { return i * transitionDuration; })
				.attr('width', function(d){
					let taskDuration = moment(moment(d.TimeStart).diff(minDate));
					let barLength = moment(moment(d.TimeEnd).diff(taskDuration));
					return xScale(barLength.toDate());
				})
				.attr("x", function(d, i) {
					return xScale(d.TimeStart);
				})
			;

		//Update…
		bars.transition()
			.duration(1000)
			.attr("x", function(d, i) {
				return xScale(d.TimeStart);
			})
			.attr("y", function(d) {
				return yScale(d.Dim);
			})
			.attr('width', function(d){
				let taskDuration = moment(moment(d.TimeStart).diff(minDate));
				let barLength = moment(moment(d.TimeEnd).diff(taskDuration));
				return xScale(barLength.toDate());
			})
			.attr('fill', function (d, i) {
				return d.Color;
			})
     		.attr('height', yScale.bandwidth());


		//Exit…
		bars.exit()
			.transition()
			.duration(1000)
			.attr("y", sizeFields.height)
			.remove();

		// give the x axis the resized scale
		xAxis.scale(xScale);

		// draw the new xAxis
		selectors.xAxisEl.call(xAxis);
// console.log('bars exit',bars);
	}
	function getSizeFields( selectors ) {
		// create dynamic sizing
		let	sizeFields = {
			divWidth 		: parseInt(selectors.chart.style('width'), 10),
			divHeight		: parseInt(selectors.chart.style('height'), 10),
			marginRight		: 20,
			marginBottom 	: 30
		};

		sizeFields['marginTop'] =sizeFields.divWidth <= 480 ? 0 : 30,
		sizeFields['height'] =sizeFields.divHeight - sizeFields.marginTop - sizeFields.marginBottom;	

		return sizeFields;
	}

	function getChartWidth(sizeFields) {
				//get the total axis height
		let yAxisText = $('.qv-object-sense-d3-gantt .yAxis.gantt g.tick text'),
			yAxisG = $('.qv-object-sense-d3-gantt .yAxis.gantt g.tick');
		let yAxisHeight = 0;
		yAxisText.each(function (index) {
			yAxisHeight += parseInt($(this)[0].getBoundingClientRect().height, 10);
		});

		// check if axis height can fit in canvas
		let hideAxis 	= (sizeFields.height < yAxisHeight) || (sizeFields.divWidth<=480),
			marginLeft 	= hideAxis ? 0 : 100,
			width 		= sizeFields.divWidth - marginLeft - sizeFields.marginRight;

		let widthObj = {
			'hideAxis'		: hideAxis,
			'marginLeft'	: marginLeft,
			'width'			: width
		}

		return widthObj;
	}
	function getSelectors (chartID) {
		//create selector vars if selectors were not passed in params
		let selectors = {
			'chart' 	: d3.select('div#gantt_' + chartID)
		};
		selectors['svg'] = selectors.chart.select('svg'),
		selectors['artboard'] = selectors['svg'].select('g.axisBoard'),
		selectors['bars'] 	= selectors['svg'].selectAll('g#bars > rect'),
		selectors['xAxisEl'] = selectors['artboard'].select('g.xAxis.gantt'),
		selectors['yAxisEl'] = selectors['artboard'].select('g.yAxis.gantt');

		return selectors;
	}

	function resizeChart( data, chartID, selectors ) {
	//////////////////////////////////////////////
	// Draw key size-based element ///////////////
	//////////////////////////////////////////////
		let selectorVar;
		if(!selectors){
			//create selector vars if selectors were not passed in params
			selectorVar = getSelectors(chartID);
		} else {
			selectorVar = selectors;
		}


		// var chart 		= d3.select('div#gantt_' + chartID),
		// 	svg 		= chart.select('svg'),
		// 	artboard 	= svg.select('g.axisBoard'),
		// 	bars		= svg.selectAll('g#bars > rect'),
		// 	xAxisEl		= artboard.select('g.xAxis.gantt'),
		// 	yAxisEl		= artboard.select('g.yAxis.gantt');

		// // create dynamic sizing
		// let	divWidth 		= parseInt(selectors.chart.style('width'), 10),
		// 	divHeight		= parseInt(selectors.chart.style('height'), 10),
		// 	marginRight		= 20,
		// 	marginBottom	= 30,
		// 	// marginLeft 		= divWidth <= 480 ? 0 : 100,
		// 	marginTop 		= divWidth <= 480 ? 0 : 30,
		// 	height 			= divHeight - marginTop - marginBottom;

		let sizeFields = getSizeFields( selectorVar );

		// set data related vars
		let xScale 		= createXScale( data ),
			yScale 		= createYScale( data, sizeFields.height ),
			minDate		= d3.min(data, function(d) { return d.TimeStart; }),
			xAxis       = d3.axisBottom().scale( xScale ),
			yAxis       = d3.axisLeft().scale( yScale )
	                      .tickSize(5),
	        numOfPts	= d3.max(data, function(d, i) { return i; })+1;

	   var transitionDuration = (numOfPts<5 ? 2500 : 5000)/numOfPts;

		//change yaxis and hide if width below "small" screen size breakpoint
		selectorVar.yAxisEl.call(yAxis);
// console.log('axis', yAxis, 'el', yAxisEl);

		selectorVar.yAxisEl.selectAll(".tick text")
			.call(axisTextWrap, 90)//second param is size for axis
			;


		let widthObj = getChartWidth(sizeFields);

		//get the total axis height
		let yAxisText = $('.qv-object-sense-d3-gantt .yAxis.gantt g.tick text'),
			yAxisG = $('.qv-object-sense-d3-gantt .yAxis.gantt g.tick');
		let yAxisHeight = 0;
		yAxisText.each(function (index) {
			yAxisHeight += parseInt($(this)[0].getBoundingClientRect().height, 10);
		});

		// yAxisG.attr("transform", "translate(-10,0)");

		// check if axis height can fit in canvas
		let hideAxis 	= (sizeFields.height < yAxisHeight) || (sizeFields.divWidth<=480),
			marginLeft 	= hideAxis ? 0 : 100,
			width 		= sizeFields.divWidth - marginLeft - sizeFields.marginRight;

		// translate g inside svg for axis container
		selectorVar.artboard.attr("transform", "translate(" + marginLeft + "," + sizeFields.marginTop + ")")

		// set the svg dimensions
		selectorVar.svg.attr("width", sizeFields.divWidth - 5)
			.attr("height", sizeFields.divHeight - 5);

		// Set new range for xScale
		xScale.range([0, width]);

		// give the x axis the resized scale
		xAxis.scale(xScale);

		// draw the new xAxis
		selectorVar.xAxisEl.call(xAxis)
			.transition()
				.duration(1000)
				.ease(d3.easeLinear)
				.style("opacity",(sizeFields.divWidth<=480 ? 0 : 1));

		//Create bars
		selectorVar.bars.attr("transform", "translate(" + marginLeft + "," + (sizeFields.marginTop) + ")")
			.transition()
				.duration(200)
	     		.attr('height', yScale.bandwidth())
				.attr("y", function(d) {
					return yScale(d.Dim);
				})
			.transition()
				.duration(1000)
				.ease(d3.easeLinear)
				.delay(function(d, i) { return i * transitionDuration; })
				.attr("x", function (d) {
				 	return xScale(d.TimeStart);
				 })
				.attr('rx', width*.001)
				.attr('ry', width*.001)//used for curved bars
				.attr('width', function(d){
					let taskDuration = moment(moment(d.TimeStart).diff(minDate));
					let barLength = moment(moment(d.TimeEnd).diff(taskDuration));
					return xScale(barLength.toDate());
				})
			;

		// change xAxis positioning
		selectorVar.xAxisEl.attr("transform", "translate(0," + sizeFields.height + ")");

		//change yaxis and hide if width below "small" screen size breakpoint
		selectorVar.yAxisEl.transition()
				.duration(1000)
				.ease(d3.easeLinear)
				.style("opacity",(hideAxis ? 0 : 1));



	}

	// function barSelector( selections, api, chartID ) {
	// //////////////////////////////////////////////
	// // Create bar selection component ////////////
	// //////////////////////////////////////////////
	// 	//create selector vars
	// 	let chart 		= d3.select('div#gantt_' + chartID),
	// 		svg 		= chart.select('svg'),
	// 		artboard 	= svg.select('g.axisBoard'),
	// 		bars		= svg.selectAll('g#bars > rect');

	// 	//add click event
	// 	bars.on("click",function (d) {
	// 		// selections.selectedValue
	// 		api.selectValues(0, [d.ID], true);
	//     });

	// 	return selections;
	// }

	function displayExperience( data, id ) {
		//////////////////////////////////////////////
		// Chart Config /////////////////////////////
		//////////////////////////////////////////////
		let chartID = id;
		let chart = d3.select('div#gantt_' + chartID)
			.classed('container', true);

		// Define the div for the tooltip
		let tooltipDiv = chart.append("div") 
		.attr("class", "tooltip")       
		.style("opacity", 0);

		// Set the scales ranges
		var xScale 	= createXScale( data ), //d3.scaleTime(),
			// yScale 		= d3.scaleBand().rangeRound([0, height]),
			colorScale 	= d3.scaleSequential(d3.interpolatePuBuGn);

		// Define the axes
		var xAxis 	= d3.axisBottom().scale( xScale ),
		minDate 	= d3.min(data, function(d) { return d.TimeStart; });

		// Add the svg canvas
		var svg = chart
			.append("svg");

	 	// set the domain range for colors from the data
		colorScale.domain([-1, d3.max(data, function(d, i) { return i; })]);

		// create element for where elements will be drawn
		var artboard = svg.append("g")
			.classed('axisBoard', true);

		// Add the X Axis
		var xAxisEl = artboard.append("g")
			.attr("class","xAxis gantt")
		;

		// Add the Y Axis
		var yAxisEl = artboard.append("g")
			.attr("class","yAxis gantt");

		//Create bars
		var bars = svg.append("g")
			.attr("id", "bars")
			.attr("transform", "translate(0,0)")
			.selectAll("rect")
			.data( data )
			.enter()
			.append("rect")
			.attr("class", "selectable")
			.attr('data-value', function (d) {
				return d.ID;
			})
			.attr('x', function (d) {
				return xScale(minDate);
			})
			.attr('y', 0)
			.attr('width', 0)
			.attr('height', 0)
			.attr('fill', function (d, i) {
				return d.Color;
			})
			.style("stroke", 'black')
			.style("stroke-width", 0.25)
			// add tooltips to each bar
			.on("mouseover", tooltipStart)          
			.on("mouseout", tooltipEnd)
		;
// console.log('O.G. bars', bars);

		let selectors = {
			'chart' 	: chart,
			'svg' 		: svg,
			'artboard' 	: artboard,
			'bars' 		: bars,
			'xAxisEl' 	: xAxisEl,
			'yAxisEl'	: yAxisEl
		};
// console.log('selectors',selectors);

		 function tooltipStart(d, i, bars) {
			let bar				= $(bars[i]),
				topBar 			= bar.offset().top,
				divParent		= bar.closest('.container'),
				topDivParent	= divParent.offset().top,
				leftDivParent	= divParent.offset().left;
			
			// create transitions for tooltip
			tooltipDiv.transition()
			.duration(200)
			.style("opacity", .9);
			tooltipDiv .html( d.Dim+ " from " + moment(d.TimeStart).format("MMM YYYY") + ' to ' + moment(d.TimeEnd).format("MMM YYYY"))
			.style("left", (d3.event.pageX - leftDivParent) + "px")
			.style("top", (d3.event.pageY - topDivParent- 28) + "px");

		 }

		function tooltipEnd(d) {
			//hide tooltip
			tooltipDiv.transition()
				.duration(500)
				.style("opacity", 0);
		}

		// call function to call components based on size
		resizeChart( data, chartID, selectors );

	}

	//function to wrap text for axis
	function axisTextWrap(text, width) {
	  text.each(function() {
	    let text = d3.select(this),
	        words = text.text().split(/\s+/).reverse(),
	        word,
	        line = [],
	        lineNumber = 0,
	        lineHeight = 1.1, // ems
	        y = text.attr("y"),
	        dy = parseFloat(text.attr("dy")),
	        tspan = text.text(null).append("tspan").attr("x", -5).attr("y", y).attr("dy", dy + "em");
	    while (word = words.pop()) {
	      line.push(word);
	      tspan.text(line.join(" "));
	      if (tspan.node().getComputedTextLength() > width) {
	        line.pop();
	        tspan.text(line.join(" "));
	        line = [word];
	        tspan = text.append("tspan").attr("x", -5).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
	      }
	    }
	  });
	}
	function dataObj(layout) {
		let ganttData	= senseD3.createJSONObj(layout);

// console.log('ganttData',ganttData);

		let colorType		= layout.qHyperCube.qMeasureInfo[0].colorType,
			//get the value selected in props and find the associated value in the palette array
			singleColorVal 	= colorPalette.singlePalette[layout.qHyperCube.qMeasureInfo[0].singleColorVal],
			// get scale selected from property
			selectedScaleObj	= colorPalette.scales[layout.qHyperCube.qMeasureInfo[0].scaleColorVal],
			// create an array of scale keys
			selectedScaleKeys 	= Object.keys(selectedScaleObj),
			// max scale
			selectedScaleMax  	= (selectedScaleKeys.length+2),
			// get the max if the values in the range are more than the values in the dropdown selected
			selectedScale = selectedScaleObj[layout.qHyperCube.qMeasureInfo[0].numOfColorVals > selectedScaleMax ? selectedScaleMax : layout.qHyperCube.qMeasureInfo[0].numOfColorVals]
			;

		let data = ganttData.map(function (inner_d) {
			let dynamicColorVals;
			// set the color variable based on properties
			if (colorType=='singleColor') {
				dynamicColorVals = singleColorVal;
			} else if (colorType=='useStatus' && layout.qHyperCube.qMeasureInfo[0].colorCodeBool) {
				//check type to see if rgb passed
				dynamicColorVals = typeof(inner_d.meas_0_attr_0)=='number' ? '#' + Number(inner_d.meas_0_attr_0).toString(16).substring(2) : inner_d.meas_0_attr_0;
			} else if (colorType=='useStatus' && !layout.qHyperCube.qMeasureInfo[0].colorCodeBool) {
				//use mod to repeat colors if scale is smaller than value shown
				dynamicColorVals = selectedScale[inner_d.meas_0_attr_0 % selectedScale.length];
			} else if (colorType=='colorByDim') {
				//use mod to repeat colors if scale is smaller than value shown
				dynamicColorVals = selectedScale[inner_d.dim_0_id % selectedScale.length];
			} else {
				dynamicColorVals = '#000000';
			};

			//create a flag for if data is valid
			let goodData = inner_d.dim_0!=null && inner_d.dim_1!=null && inner_d.meas_0!=null
							&& inner_d.dim_0!='NA' && inner_d.dim_1!='NA' && inner_d.meas_0!='NA'
							&& inner_d.meas_0>0
							;

			// Create an array of objects with only the dimension, id, start, end, and color
			var indivJob = {
			  'Dim'			: inner_d.dim_0,
			  'ID'			: inner_d.dim_0_id,
			  'TimeStart'	: moment(inner_d.dim_1, "M/D/YYYY").toDate(),
			  'TimeEnd'		: moment(inner_d.dim_1, "M/D/YYYY").add(+inner_d.meas_0, 'days').toDate(),
			  'goodData'	: goodData,
			  'Color'		: dynamicColorVals
			}
			return indivJob;
		});

		data = data.filter(function(d) { return d.goodData; });

// console.log('data', data);

		return data;
	}

	function validDataObject (layout) {
		/*---------------------------------
		Test for edge cases here
		-less than two dims
		-no measure
		-second dim not of type date
		-----------------------------------*/
		return true;
	}

	function initChartRender(scope) {
		let layout 	= scope.$parent.layout,
			chartID = scope.id;
		
		$('div#gantt_' + scope.id).empty();

		let data = dataObj(layout);

		scope.data = data;

console.log('dataObj', data);

		displayExperience( data, chartID );

	}

	function bindSelections( layout, $element, app_this, $scope ) {
		let selectionsEnabled,
			scope;

		if (!app_this) {
			selectionsEnabled 	= true,
			scope 				= $scope;
		} else {
			selectionsEnabled 	= app_this.selectionsEnabled,
			scope 				= app_this.$scope;
		}

		if(selectionsEnabled && layout.selectionMode !== "NO") {
			$element.find('.selectable').on('qv-activate', function() {
				if(this.hasAttribute("data-value")) {
					var value = parseInt(this.getAttribute("data-value"), 10), dim = 0;

					if(layout.selectionMode === "CONFIRM") {
						scope.selectValues(dim, [value], true);

						//set classes for selectable/selected depending on what was already set
						if ($(this).attr("class").indexOf("selected") > -1) {
							var selClass = $(this).attr("class");
							$(this).attr("class", selClass.replace("selected", "selectable"));
						} else {
							$(this).attr("class", "selected");
						}
					} else {
						scope.backendApi.selectValues(dim, [value], true);
					}
				}
			});
			$element.find('.selectable').toggleClass('active');
		}
	}

	return {
       template: template,
       initialProperties : {
			qHyperCubeDef : {
				qDimensions : [],
				qMeasures : [],
				qInitialDataFetch : [{
					qWidth : 10,
					qHeight : 50
				}]
			},
			selectionMode : "CONFIRM"
		},
		definition : props,
		support : {
			snapshot: true,
			export: true,
			exportData : true
		},
		resize: function ($element, layout) {
			let app_this 	= this,
				data 		= app_this.$scope.data,
				chartID 	= layout.qInfo.qId;

			
			resizeChart( data, chartID );
// 			app_this.$scope.component.model.Validated.bind( function () {
// 				console.info( 'Validated' );

// // 				if ($scope.paint===true) {
// // console.log('already painted');
// // 				} else {
// 					// initChartRender($scope);
// 				// 	$scope.paint = true
// 				// }
				
// 				// events.push({ ts: extUtils.timeStamp(), event: 'Validated'});

// // console.log('validated events', events);
// 			} );
		},
		paint: function ( $element, layout ) {

			let app_this = this;
			let chartID = layout.qInfo.qId;

			// set layout variable to create id used to set the div id
			app_this.$scope.id= chartID;

			app_this.$scope.$element = $element;

			if(layout.qHyperCube.qDataPages[0] && $element.find('div#gantt_' + chartID).length>0) {
				if (app_this.$scope.paint===true) {
					console.log('already painted');
				} else {
					initChartRender(app_this.$scope);
					app_this.$scope.paint = true;
				}
				// build selection model - utlizing the confirm selection model
				bindSelections(layout, $element, app_this);

			}

/*Handling events
-data selection change (layout.qHyperCube)
	-re-render data array
	-enter bars
	-update bars
	-exit bars
	-resize bars - new max/min - change width/height
	-resize yaxis
	-resize xaxis
	-resize func for data movement
-chart resize
	-resize bars - change width/height
	-resize yaxis
	-resize xaxis
-configuration change(layout.properties)
	-color changes
		-recreate color in data array
	-dim and measure changes
		-re-render chart
	-sort

-full page refresh(does not exist yet)
	-render data array
	-render selection module
*/	


// 			return qlik.Promise.resolve();
		},
		controller: ['$scope', function ($scope) {
			let events = $scope.events =  [];

			/**
			 * Validated event.
			 *
			 * @description The data has been recalculated and new valid data is available.
			 */
// console.log('model', $scope.component.model)
			// $scope.component.model.Validated.bind( function () {
			// 	console.info( 'Validated' );
// 				if ($scope.paint===true) {
// console.log('already painted');
// 				} else {
					// initChartRender($scope);
				// 	$scope.paint = true
				// }
				
				// events.push({ ts: extUtils.timeStamp(), event: 'Validated'});

// console.log('validated events', events);
			// } );
			//detect data changes
			$scope.$watch("layout.qHyperCube.qDataPages[0].qMatrix", function (newVal, oldVal) {
				if (!arraysEqual(oldVal,newVal) && newVal!==undefined){
					let data = dataObj($scope.$parent.layout);
					dataChanges(data, $scope.id);
				}
			});
// 			$scope.$watchCollection("layout.qHyperCube.qMeasureInfo", function (newVal, oldVal) {
// console.log('measure watch called', oldVal, newVal);
// 				if (!arraysEqual(oldVal,newVal) && newVal!==undefined){

// 					// initChartRender($scope);
// 					// $scope.paint = true;
// 					// bindSelections($scope.$parent.layout, $scope.$element, '', $scope);

// console.log('real prop change', oldVal, newVal);
// 				}
// 			});
// 			$scope.$watchCollection("layout.qHyperCube.qDimensionInfo", function (newVal, oldVal) {
// 				if (!arraysEqual(oldVal,newVal) && newVal!==undefined){

// 					initChartRender($scope);
// 					$scope.paint = true;
// 					bindSelections($scope.$parent.layout, $scope.$element, '', $scope);

// console.log('real prop change', oldVal, newVal);
// 				}
// 			});

			//watch if dimension or measure fields change
			let fieldsToWatch = ["id"
								,"layout.qHyperCube.qDimensionInfo[0].cId"
								,"layout.qHyperCube.qDimensionInfo[1].cId"
								,"layout.qHyperCube.qMeasureInfo[0].cId"
								,"layout.qHyperCube.qMeasureInfo[0].colorCodeBool"
								,"layout.qHyperCube.qMeasureInfo[0].colorType"
								,"layout.qHyperCube.qMeasureInfo[0].numOfColorVals"
								,"layout.qHyperCube.qMeasureInfo[0].scaleColorVal"
								,"layout.qHyperCube.qMeasureInfo[0].singleColorVal"];

			$scope.$watchGroup(fieldsToWatch, function (newVal, oldVal) {
// console.log('prop change monitored', oldVal, newVal, arraysEqual(oldVal,newVal));
				// let myId = $scope.id;
				let chartElementCount = $scope.id==='undefined' ? 0 : $('div#gantt_' + newVal[0]).length;

				if ((!arraysEqual(oldVal,newVal) && newVal!==undefined) || chartElementCount!==0) {

					initChartRender($scope);
					$scope.paint = true;
					bindSelections($scope.$parent.layout, $scope.$element, '', $scope);

// console.log('prop change only', oldVal, newVal);
				}
			});
		}]
	};

} );
