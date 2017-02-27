/* jshint newcap: false, camelcase: false */
/* global $, TweenMax, TweenLite, TimelineMax */

'use strict';

$(function() {

  /* -------------
  	PROJECT LOAD
 		------------- */
		
	var $btnE = $('.btn-svg'),
	$projectBanners = $('.project-banner'),
	tweenTime = 0.7,
	tweenTimeFast = 0.3,
	btnArray = ['btnA0' ,'btnA1' ,'btnA2' ,'btnA3'],
	tlWindowScroll = new TimelineMax({paused: true}),
	tlBannerSizeArr = [
		new TimelineMax({paused: true}), 
		new TimelineMax({paused: true}), 
		new TimelineMax({paused: true}), 
		new TimelineMax({paused: true})
	],
	projBannerArr = [];
	
	// prepare project banner array and load animations 
	for (var i = 0; i < $projectBanners.length; i++) {
		projBannerArr.push($projectBanners.eq(i).attr('id'));
		tlBannerSizeArr[i].to($projectBanners.eq(i), tweenTimeFast, {height: 0}, 'start').to($projectBanners.eq(i), tweenTimeFast, {height: 406}, 'expand');
		// prep buttons
		btnArray[i] = $('#btnExplodeContainer'+i);
	}

	$('.nav-link').click(function(e) {
		e.preventDefault();
		var linkOffset = $($(this).attr('href')).offset().top;
		tlWindowScroll.to(window, tweenTime, {scrollTo:{y: linkOffset, autokill: false}});
		tlWindowScroll.play();
	});

	function loadProject (e) {
		var clickedId = $(e.target).parents('.project-banner').attr('id'),
		svgId = $('#' + clickedId).find('.btn-project-explode').attr('id'),
		$svgContainer = $('#' + svgId);

		toggleProjectBanners(clickedId);

		$svgContainer.trigger('dope-click');
		prepNext(projBannerArr, projBannerArr.indexOf(clickedId));

		$('.project-return').empty();
		// ajax in project section using naming convention that matches clicked element > file > div
		$('#' + clickedId + 'Return').load(clickedId + '.html #' + clickedId + 'Inner', function() {
			jump(clickedId, false);
		});
	}
	
	function toggleProjectBanners (openId) {
		for (var i = 0; i < $projectBanners.length; i++) {
			if ($projectBanners.eq(i).attr('id') !== openId) {	
				tlBannerSizeArr[i].tweenFromTo('start','expand');
				$projectBanners.eq(i).trigger('sticky_kit:detach');
			}
		}
	}
	
	function prepNext (idList, curIdIndex) {
		var	$btnClose = $('#' + idList[curIdIndex] + 'Close');
		$btnClose.removeClass('btn-project-off').attr('data-close', idList[curIdIndex]);
		$('#navWork').attr('data-close', idList[curIdIndex]);
	}
	

	function closeProject (e) {
		// manage the buttons and remove data element from next button
		var $cP = $('#'+ $(e.target).closest('.btn-project-close').attr('data-close'));
		$cP.trigger('sticky_kit:detach');
		$squishyEl = '';
		
		$('.btn-project-close').addClass('btn-project-off');
		$('.btn-project-explode').removeClass('btn-project-off');

		// display all banners and more buttons again
		var uClosedTho = jump($cP.attr('id'), true);

		if (uClosedTho === 'yup') {
			// clear all project return divs
			TweenLite.to(window, tweenTimeFast, {scrollTo:{y: 2000, autokill: false}});
			setTimeout(function() {
				$('.project-return').empty();
				TweenMax.staggerTo($projectBanners, tweenTimeFast, {height: 406}, tweenTimeFast);
			}, 400);
		}
		$('.project-title').css('top', '0px');
		$('.project-subtitle').css('top', '0px');
		// handle svg button display
		$btnE.each(function(index) {
			btnArray[index].css('left', '0');
			$('#mainBtnId'+index).attr('r', 23);
		});
	}
	
	
	function jump (h, c) {
		var	curId = h,
				$projEl = $('#'+curId),
				divOffset = 0;
		if (document.documentElement.clientWidth > 480) {
			divOffset = $('#Work').offset().top + 450;
			// set vars for scroll sizing detection
			if (!c) {
				TweenMax.to($projEl, tweenTime, {height: 300, onComplete: function () {
					initialHeight = 0;
					lastScrollTop = 0;
					newHeight = 0;
					$squishyEl = $projEl;
					$squishyEl.stick_in_parent({recalc_every: 100});
				}});
				TweenMax.to($('.project-return'), 0.1, {css:{height: '100%'}});	
				TweenLite.to(window, tweenTime, {scrollTo:{y: divOffset, autokill: false}});
			}
		} else {
			divOffset = $('#Work').offset().top + 350;
			$('.project-return').height('100%');
			initialHeight = 0;
			$squishyEl = $projEl;
			TweenLite.to(window, tweenTime, {scrollTo:{y: divOffset, autokill: false}});
		}
		if (c) { return 'yup'; }
	}
	
	/* ----------------
		 WINDOW SCROLLING
		 ---------------- */
	var initialHeight = 0;
	var lastScrollTop = 0;
	var newHeight = 0;
	var $squishyEl = '';

	/*
	 * Should probably be doing some kind of more css
	 * centric bg image overlap thing, rather than
	 * actually adjusting the height of the banner
	 * background-attachment perhaps
	*/

	$(window).scroll(function() { 		// make this better
		if ($squishyEl !== '') {
			var curH = $(this).scrollTop();
			var title = title || $squishyEl.find('.project-title');
			var subTitle = subTitle || $squishyEl.find('.project-subtitle');
			if (initialHeight === 0) {
				initialHeight = curH;
			}
			var diff = (curH - initialHeight) / 3;
			if(curH > lastScrollTop) {
				if ($squishyEl.height() > 100 && $squishyEl.height() < 301) {
					newHeight = Math.max(100, ($squishyEl.height() - diff));
					if (newHeight < 301) {
						$squishyEl.height(newHeight);
						title.css('top', '45px');
						subTitle.css('top', '45px');
					}
				}
			} else {
				if ($squishyEl.height() < 300 && curH < initialHeight) {
					newHeight = Math.min(300, ($squishyEl.height() + ( diff * -1)));
					if (newHeight > 100) {
						$squishyEl.height(newHeight);
						title.css('top', '0px');
						subTitle.css('top', '0px');
					}
				}
			}
			lastScrollTop = curH;
		}
	});

	/* ----------------
		 /WINDOW SCROLLING
		 ---------------- */

 	$('.btn-project-explode').on('click', loadProject);
	$('.btn-project-close').on('click', closeProject);
	$('#navWork').on('click', closeProject);
	
});


