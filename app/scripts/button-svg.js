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
	duration2 = 1.5,
	cX = 50,
	cY = cX,
	r = 23,
	snapArray = [],
	snapCloseArray = [],
	btnCloseArray = [],
	btnArr = [],
	tlArray1 = [],
	jitStroke,
	curBtn, 
	curId, 
	$curId, 
	curRot,
	closeCircle,
	openDelay = 2000,
	timeLineArray = [];

	/* ---------------------------------------
	// begin mega loop for each exploder button
		- Also create and add your things to timelines so you're only doing it once
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

		var tlC = new TimelineMax({paused: true});
		var tempCircArr = [];
		// these buttons are the stroke array buttons
		for (var i = strokeNum; i > 0; i--) {
		  curId = 'btnId'+i+index;	// create all unique ids
			curBtn = snapArray[index].circle(cX, cY, r);	// create all circles 
			curRot = circSection * i; // this sets a unique starting rotation for each circle
			jitStroke = getRandomInt(jitMin, jitMax); // set a random stroke width for each loop
			curBtn.attr({
				id: curId,
				fill: 'rgba(0,0,0,0)',
				stroke: '#fff',
				strokeWidth: 0,
				'stroke-dasharray': strokeDash,
				'position': 'absolute',
				transform: 'r'+[curRot,50,50]
			});
			$curId = $('#'+curId); // make a unique jquery object out of each id 
			tempCircArr.push($curId);
			tlC.to($curId, duration1, {css:{strokeWidth: jitStroke}, ease: Back.easeOut.config(5)}, ((1*i) / 50));


		}

		timeLineArray.push(tlC);
		tlC.staggerTo(tempCircArr, duration2, {rotation: '+=60', svgOrigin:'50 50', ease:Sine.easeOut}, 0.02).add('endHover').addPause('endHover');

		tlC.to(tempCircArr, duration1/4, {css:{strokeWidth: 5}, ease:Sine.easeOut,transformOrigin:'center'}, 'endHover');
		tlC.to(tempCircArr, duration1/4, {scale:1.8, ease:Sine.easeOut, transformOrigin:'center'}, 'endHover+=0.125');
		tlC.to(tempCircArr, duration2, {rotation: '+=1500', ease:Sine.easeOut}, 'endHover+=0.2');
		tlC.to(tempCircArr, duration2 - 0.5, {scale:0, ease: Back.easeIn.config(1.4), transformOrigin:'center'}, 'endHover+=0.5');

		// this button is the center part
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
	}); // end the big each loop


	// setup timelines for each button
	for (var i = 0; i < btnArr.length ; i++) {
		var mE = document.getElementById('mainBtnId'+i); // grab the inner solid svg button circle
		var tl1 = new TimelineMax({paused: true});

		tl1.to(mE, duration1, {css:{strokeWidth: 10}, ease:Back.easeOut.config(5)}, 0);
		tl1.to(mE, duration1, {attr:{r: 0}, css:{strokeWidth: 0}, ease:Back.easeIn.config(3)}, 'clickSection');
		tl1.addPause(0);
		tl1.addPause('clickSection');

		tlArray1.push(tl1);
	}

	function animateBtnSVG (e) {
		var btnIndex = e.data.el.attr('id').slice(-1);
		timeLineArray[btnIndex].play();
		tlArray1[btnIndex].play(0);
	}

	function animateBtnSVGReverse (e) {
		var btnIndex = e.data.el.attr('id').slice(-1);
		timeLineArray[btnIndex].reverse();
		tlArray1[btnIndex].reverse();
	}

	function animateBtnSVGClick (e) {
		var clickedEl = e.data.el;
		clickedEl.off('mouseleave');
		var btnIndex = clickedEl.attr('id').slice(-1);
		var middleBtn = document.getElementById('mainBtnId' + btnIndex);

		setTimeout (function () {
			clickedEl.css('left', '-9999px');
			TweenMax.to(middleBtn, 0.1, {scale:1,transformOrigin:'center'});
			timeLineArray[btnIndex].pause(0);
			clickedEl.on('mouseleave', {el: clickedEl}, animateBtnSVGReverse);
		}, openDelay);
	
		TweenMax.to(middleBtn, duration1/4, {scale:0, ease:Sine.easeOut, transformOrigin:'center'});
		timeLineArray[btnIndex].play('endHover');
		tlArray1[btnIndex].play('clickSection');
		tlArray1[btnIndex].reverse();
	}


	for (var k = 0; k < btnArr.length ; k++) {
		btnArr[k].on('mouseenter', {el: btnArr[k]}, animateBtnSVG)
			.on('click dope-click', {el: btnArr[k]}, animateBtnSVGClick)
			.on('mouseleave', {el: btnArr[k]}, animateBtnSVGReverse);
	}

});