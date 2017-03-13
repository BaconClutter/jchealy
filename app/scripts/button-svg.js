/* jshint newcap: false, camelcase: false */
/* global $, Snap, TweenMax, TimelineMax, Back, Sine */

'use strict';

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

$(function() {

	var $exploderButtons = $('.btn-project-explode'),
	jitMin = 25,
	jitMax = 85,
	strokeNum = 5,
	strokeDash = '27, 120',
	circSection = 360 / strokeNum,
	duration1 = 0.5,
	duration2 = 3,
	cX = 50,
	cY = cX,
	r = 23,
	snapArray = [],
	snapCloseArray = [],
	btnCloseArray = [],
	btnArr = [],
	circArray = [], // prep vars for unique ids and looping
	tlArray1 = [],
	tlArray2 = [],
	jitStroke,
	curBtn, 
	curId, 
	$curId, 
	cE, 
	curRot,
	closeCircle;

	/* ---------------------------------------
	// begin mega loop for each exploder button
	--------------------------------------- */
	$exploderButtons.each(function(index) {
		// Create close buttons
		snapCloseArray[index] = Snap('#btnClose'+index);
		btnCloseArray[index] = $('#btnCloseContainer'+index);
		snapCloseArray[index].attr({
			height: 100,
			width: 100,
			'overflow': 'visible'
		});

		closeCircle = snapCloseArray[index].circle(cX, cY, r);
		closeCircle.attr({
			fill: 'rgba(255,255,255,1)',
			stroke: '#fff',
			strokeWidth: 0,
			'position': 'absolute'
		});

		snapArray[index] = Snap('#btnExplode'+index); 
		btnArr[index] = $('#btnExplodeContainer'+index);
		snapArray[index].attr({
			height: 100,
			width: 100,
			'overflow': 'visible'
		});

		for (var i = (strokeNum+2); i > -1; i--) {
		  curId = 'btnId'+i+index;	// create all unique ids
		  
			curBtn = snapArray[index].circle(cX, cY, r);	// create all circles 
			curBtn.attr({
				id: curId,
				fill: 'rgba(0,0,0,0)',
				stroke: '#fff',
				strokeWidth: 0,
				'stroke-dasharray': strokeDash,
				'position': 'absolute'
			});
			
			// set the same attributes on each new circle, cloning and swapping id's would be more efficient
			
			$curId = $('#'+curId); // make a unique jquery object out of each id 
			curRot = circSection * i; // this sets a unique starting rotation for each circle
			TweenMax.to($curId, 0, {rotation: curRot, svgOrigin:'50 50'}); // rotate each circle to it's unique staring point

		}

		var mainBtn = snapArray[index].circle(cX, cY, r);
		mainBtn.attr({
			id: 'mainBtnId'+index,
			fill: 'rgba(255,255,255,1)',
			stroke: '#fff',
			strokeWidth: 0,
			'position': 'absolute'
		});

		var plusAttrs = {
			id: 'plusRectId'+index,
			fill: 'rgba(13,19,22,1)',
			stroke: '#fff',
			strokeWidth: 0,
			'position': 'absolute'
		};

		// Make svg plus signs
		var plusRectVert = snapArray[index].rect(48, 40, 4, 20);
		var plusRectHorz = snapArray[index].rect(40, 48, 20, 4);
		plusRectVert.attr(plusAttrs);
		plusRectHorz.attr(plusAttrs);

		var plusRectVertClose = snapCloseArray[index].rect(48, 40, 4, 20);
		var plusRectHorzClose = snapCloseArray[index].rect(40, 48, 20, 4);
		plusRectVertClose.attr(plusAttrs);
		plusRectHorzClose.attr(plusAttrs);

		/* -------------
	   EVENT HANDLERS
		 ------------- */
	}); // end the big each loop


	// setup timelines for each button
	for (var i = 0; i < btnArr.length ; i++) {
		var mE = document.getElementById('mainBtnId'+i); // grab the inner solid svg button circle
		var tl1 = new TimelineMax({paused: true});
		var tl2 = new TimelineMax({paused: true});

		tl1.to(mE, duration1, {css:{strokeWidth: 10}, ease:Back.easeOut.config(5)}, 0);
		tl1.to(mE, duration1, {attr:{r: 0}, css:{strokeWidth: 0}, ease:Back.easeIn.config(3)}, 'clickSection');
		tl1.addPause(0);
		tl1.addPause('clickSection');

		tlArray1.push(tl1);
		tlArray2.push(tl2);
	}

	function animateBtnSVG (e) {
		var clickedEl = e.data.el;
		var btnIndex = clickedEl.attr('id').slice(-1);
		// make your circle array and animate the part that can't be staggered to
		for (var j = strokeNum; j > 0; j--) {
			curId = 'btnId'+j+btnIndex; // select id iteratively
			cE = document.getElementById(curId); // select each circle the old fashioned way
			circArray.push(cE);
			jitStroke = getRandomInt(jitMin, jitMax); // set a random stroke width for each loop
			TweenMax.to(cE, duration1, {css:{strokeWidth: jitStroke}, ease: Back.easeOut.config(5), delay: (1*j) / 50});
		}
		tlArray2[btnIndex].staggerTo(circArray, duration2, {rotation: '+=60', ease:Sine.easeOut}, 0.02);
		tlArray2[btnIndex].play();
		// animate this inner button out a little bit to move with the stroked circles.
		tlArray1[btnIndex].play(0);
	}
	

	function animateBtnSVGClick (e) {
		var clickedEl = e.data.el;
		var btnIndex = clickedEl.attr('id').slice(-1);
		var middleBtn = document.getElementById('mainBtnId' + btnIndex);
		
		function hideEl () {
			setTimeout (function () {
				clickedEl.css('left', '-9999px');
				TweenMax.to(middleBtn, 0.1, {scale:1,transformOrigin:'center'});
			}, 2000);
		}

		for (var j = strokeNum; j > 0; j--) {
			cE = document.getElementById('btnId'+j+btnIndex);
			circArray.push(cE);
			TweenMax.to(cE, duration2, {css:{strokeWidth: 0}, ease: Back.easeOut.config(5), delay: (1*j) / 50});	
		//	TweenMax.to(cE, duration2, {css:{strokeWidth: 0}, ease: Back.easeOut.config(5), delay: (1*j) / 50, onComplete: hideEl });	
		}

		TweenMax.to(middleBtn, duration2, {scale:0,transformOrigin:'center'});
		TweenMax.to(circArray, duration2, {rotation: '+=2000', ease:Sine.easeOut, onComplete: hideEl(clickedEl)});

		tlArray1[btnIndex].play('clickSection');
		tlArray1[btnIndex].reverse();

		//hideEl(clickedEl);
	}

	function animateBtnSVGReverse (e) {
		var clickedEl = e.data.el;
		var btnIndex = clickedEl.attr('id').slice(-1);
		// make your circle array and animate the part that can't be staggered to
		for (var j = strokeNum; j > 0; j--) {
			curId = 'btnId'+j+btnIndex; // select id iteratively
			cE = document.getElementById(curId); // select each circle the old fashioned way
			TweenMax.to(cE, duration1, {css:{strokeWidth: 0}, ease: Back.easeOut.config(5), delay: (1*j) / 50});
		}
		tlArray2[btnIndex].reverse();
		tlArray1[btnIndex].reverse();
	}

	for (var k = 0; k < btnArr.length ; k++) {
		btnArr[k].on('mouseenter', {el: btnArr[k]}, animateBtnSVG);
		btnArr[k].on('click dope-click', {el: btnArr[k]}, animateBtnSVGClick);
		btnArr[k].on('mouseleave', {el: btnArr[k]}, animateBtnSVGReverse);
	}


});