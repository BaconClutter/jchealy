/* jshint newcap: false, camelcase: false */
/* global $, Snap, TweenMax, TimelineMax, Back, Sine */

'use strict';

	/* ---------------------------------------
	// begin mega loop for each exploder button
		--------------------------------------- */
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

$(function() {

	var $projectBanners = $('.project-banner'),
	jitMin = 25,
	jitMax = 85,
	strokeNum = 5,
	strokeDash = '27, 120',
	circSection = 360 / strokeNum,
	snapArray = ['sb0' ,'sb1' ,'sb2' ,'sb3'],
	btnArray = ['btnA0' ,'btnA1' ,'btnA2' ,'btnA3'],
	snapCloseArray = ['cb0' ,'cb1' ,'cb2' ,'cb3'],
	btnCloseArray = ['btnCA0' ,'btnCA1' ,'btnCA2' ,'btnCA3'],
	cX = 50,
	cY = cX,
	r = 23,
	circArray = [], // prep vars for unique ids and looping
	jitStroke,
	curBtn, 
	curId, 
	$curId, 
	cE, 
	curRot,
	closeCircle;

	$projectBanners.each(function(index) {
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
		btnArray[index] = $('#btnExplodeContainer'+index);
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

		var plusRectVert = snapArray[index].rect(48, 40, 4, 20);
		var plusRectHorz = snapArray[index].rect(40, 48, 20, 4);
		plusRectVert.attr(plusAttrs);
		plusRectHorz.attr(plusAttrs);

		var plusRectVertClose = snapCloseArray[index].rect(48, 40, 4, 20);
		var plusRectHorzClose = snapCloseArray[index].rect(40, 48, 20, 4);
		plusRectVertClose.attr(plusAttrs);
		plusRectHorzClose.attr(plusAttrs);

		var mE = document.getElementById('mainBtnId'+index); // grab the inner solid svg button circle

		/* -------------
	   ANIMATIONS
		 ------------- */

		// Pre load a tween using a timeline so they are not having to be loaded during the even.
		var tl2 = new TimelineMax({paused: true}),
			start = 0,
			duration1 = 0.5,
			duration2 = 3;
		
		var tl1 = new TimelineMax({paused: true});
			tl1.to(mE, duration1, {css:{strokeWidth: 10}, ease:Back.easeOut.config(5)}, start);
			tl1.to(mE, duration1, {attr:{r: 0}, css:{strokeWidth: 0}, ease:Back.easeIn.config(3)}, 'clickSection');
			tl1.addPause(start);
			tl1.addPause('clickSection');

		function animateBtnSVG () {
			// make your circle array and animate the part that can't be staggered to
			btnArray[index].one('mouseleave', animateBtnSVGReverse);
			for (var j = strokeNum; j > 0; j--) {
				curId = 'btnId'+j+index; // select id iteratively
				cE = document.getElementById(curId); // select each circle the old fashioned way
				circArray.push(cE);
				jitStroke = getRandomInt(jitMin, jitMax); // set a random stroke width for each loop
				TweenMax.to(cE, duration1, {css:{strokeWidth: jitStroke}, ease: Back.easeOut.config(5), delay: (1*j) / 50});
			}
			tl2.staggerTo(circArray, duration2, {rotation: '+=60', ease:Sine.easeOut}, 0.02);
			tl2.play();
			// animate this inner button out a little bit to move with the stroked circles.
			tl1.play(start);
		}

		function animateBtnSVGReverse () {
			btnArray[index].one('mouseenter', animateBtnSVG);
			// make your circle array and animate the part that can't be staggered to
			for (var j = strokeNum; j > 0; j--) {
				curId = 'btnId'+j+index; // select id iteratively
				cE = document.getElementById(curId); // select each circle the old fashioned way
				TweenMax.to(cE, duration1, {css:{strokeWidth: 0}, ease: Back.easeOut.config(5), delay: (1*j) / 50});
			}
			tl2.reverse();
			tl1.reverse();
		}

		function animateBtnSVGClick () {
			btnArray[index].off('mouseleave');
			btnArray[index].one('mouseenter', animateBtnSVG);
			function hideBtn () {
				btnArray[index].css('left', '-9999px');
			}
			for (var j = strokeNum; j > 0; j--) {
				curId = 'btnId'+j+index; // select id iteratively
				cE = document.getElementById(curId); // select each circle the old fashioned way
				TweenMax.to(cE, duration1, {css:{strokeWidth: 0}, ease: Back.easeOut.config(5), delay: (1*j) / 50, onComplete: hideBtn});
			}
			tl1.play('clickSection');
		}

		/* -------------
	   EVENT HANDLERS
		 ------------- */
		btnArray[index].on('click dope-click', animateBtnSVGClick);
		btnArray[index].one('mouseenter', animateBtnSVG);
	});
});