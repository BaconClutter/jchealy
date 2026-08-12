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
	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	/* Read a colour from the CSS palette in main.css rather than hardcoding
	   it here. That stylesheet is the single source of truth for colour, so
	   changing a value there updates these animated backdrops too — and the
	   [data-theme] scheme blocks work on this canvas artwork just as they do
	   on the rest of the page.

	   Safe to call at this point: main.css is a <link> in <head> and this
	   script runs at the end of <body>, so the cascade has already resolved.
	   The fallback covers a missing or renamed token. */
	var palette = window.getComputedStyle(document.documentElement);
	function color(token, fallback) {
		return palette.getPropertyValue('--color-' + token).trim() || fallback;
	}

	var s = Snap('#svgContent'),
	a = Snap('#svgContentAbout'),
	x = 300,
	y = x;
	//dashArray = ['30, 180', '120, 140', '160, 120'];
	function buildDashArray () {
		var dashArray = [],
				tempString = '',
				dMin = 30,
				dMax = 180;
		for (var i = 0; i < 6; i++) {
			var rand = getRandomInt(dMin, dMax);
			if (i%2 === 0) {
				tempString = rand+',';
			}
			if (i%2 === 1) {
				dashArray.push(tempString.concat(rand.toString()));
			 	tempString = '';
			}
		}
		return dashArray;
	}

	var headerSvgVals = {
		circles: [s.circle(x, y, 70), s.circle(x, y, 130), s.circle(x, y, 200)],
		colors: [color('backdrop-1', '#091928'), color('backdrop-2', '#0c2033'), color('backdrop-3', '#0d273e')],
		strokeWidths: [70, 90, 130],
		dashes: buildDashArray(),
		times: [125000, 75000, 105000]
	};

	var aboutSvgVals = {
		circles: [a.circle(x, y, 60), a.circle(x, y, 150), a.circle(x, y, 200)],
		strokeWidths: [60, 90, 130],
		dashes: buildDashArray(),
		times: [115000, 85000, 45000]
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
			stroke: color('backdrop-warm', '#f8daaa'),
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