 /* jshint newcap: false, camelcase: false */
/* global $, Snap */
 'use strict';

$(function() {
	/* -------------
	SVG HEADER 
	* May need to look into less cpu intensive methods for animating
	* greensock
	* exported svg and greensock
	------------- */
		
	var s = Snap('#svgContent'),
	a = Snap('#svgContentAbout'),
	x = 300,
	y = x;

	var headerSvgVals = {
		circles: [s.circle(x, y, 70), s.circle(x, y, 150), s.circle(x, y, 200)],
		colors: ['#091928', '#0c2033', '#0d273e'],
		strokeWidths: [60, 90, 130],
		dashes: ['30, 180', '120, 140', '160, 120'],
		times: [125000, 75000, 105000]
	};

	var aboutSvgVals = {
		circles: [a.circle(x, y, 70), a.circle(x, y, 150), a.circle(x, y, 200)],
		strokeWidths: [60, 90, 130],
		dashes: ['30, 180', '120, 140', '160, 120'],
		times: [115000, 105000, 95000]
	};

	headerSvgVals.circles.forEach(function(element, index) {
		element.attr({
			fill: 'rgba(0,0,0,0)',
			stroke: headerSvgVals.colors[index],
			strokeWidth: headerSvgVals.strokeWidths[index],
			'stroke-dasharray': headerSvgVals.dashes[index]
		});
		circleAnim(element, headerSvgVals.times[index]);
	});

	aboutSvgVals.circles.forEach(function(element, index) {
		element.attr({
			fill: 'rgba(0,0,0,0)',
			stroke: '#f8daaa',
			strokeWidth: aboutSvgVals.strokeWidths[index],
			'stroke-dasharray': aboutSvgVals.dashes[index]
		});
		circleAnim(element, aboutSvgVals.times[index]);
	});

	function circleAnim(el, dur) {
		var innerEl = el,
		innerDur = dur;
		innerEl.stop().animate(
			{ transform: 'r360, ' + x + ', ' + y },
			innerDur,
			function(){
				innerEl.attr({ transform: 'rotate(0 ' + x + ' ' + y + ')'});
				circleAnim(innerEl, innerDur);
			}
		);	
	}

});