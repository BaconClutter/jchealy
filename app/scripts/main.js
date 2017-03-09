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
	tlWindowScroll = new TimelineMax({paused: true}),
	btnArr = [],
	initialHeight = 0,
	lastScrollTop = 0,
	newHeight = 0,
	expandHeight = 406,
	expandHeightMobile = 270,
	$squishyEl = '',
	divOffsetMobile = $('#Work').offset().top + 300,
	divOffset = divOffsetMobile + 200,
	$btnProjClose = $('.btn-project-close'),
	$btnProjExplode = $('.btn-project-explode'),
	$projTitle = $('.project-title'),
	$projSubTitle = $('.project-subtitle'),
	$projReturn = $('.project-return'),
	scrollReady = false;
	
	// prepare project banner array and load animations 
	for (var i = 0; i < $projectBanners.length; i++) {
		// prep buttons
		btnArr[i] = $('#btnExplodeContainer'+i);
	}

	function loadProject (e) {
		var clickedId = $(e.target).parents('.project-banner').attr('id'),
		svgId = $('#' + clickedId).find('.btn-project-explode').attr('id'),
		$svgContainer = $('#' + svgId);

		$svgContainer.trigger('dope-click');
		prepNext(clickedId);

		setTimeout (function () {
			$('.project-return').empty();
			// ajax in project section using naming convention that matches clicked element > file > div
			$('#' + clickedId + 'Return').load(clickedId + '.html #' + clickedId + 'Inner', function() {
				toggleProjectBanners(clickedId);
				jump(clickedId, false);
			});
		}, 500);
	}
	
	function toggleProjectBanners (openId) {
		for (var i = 0; i < $projectBanners.length; i++) {
			if ($projectBanners.eq(i).attr('id') !== openId) {	
				$projectBanners.eq(i).height(0);
				$projectBanners.eq(i).trigger('sticky_kit:detach');
			}
		}
	}
	
	function prepNext (curId) {
		var	$btnClose = $('#' + curId + 'Close');
		$btnClose.removeClass('btn-project-off').attr('data-close', curId);
		$('#navWork').attr('data-close', curId);
	}
	
	function closeProject (e) {
		// manage the buttons and remove data element from next button
		var $cP = $('#'+ $(e.target).closest('.btn-project-close').attr('data-close'));
		$cP.trigger('sticky_kit:detach');
		$squishyEl = '';

		$btnProjClose.addClass('btn-project-off');
		$btnProjExplode.removeClass('btn-project-off');

		// display all banners and more buttons again
		var uClosedTho = jump($cP.attr('id'), true);

		if (uClosedTho === 'yup') {
			// clear all project return divs
			
			$projReturn.empty();
			if (document.documentElement.clientWidth > 480) {
				TweenLite.to(window, 0, {scrollTo:{y: 2100, autokill: false, immediateRender: false}});
				TweenMax.staggerTo($projectBanners, tweenTimeFast, {height: expandHeight}, tweenTimeFast);
			} else {
				TweenLite.to(window, 0, {scrollTo:{y: 1600, autokill: false, immediateRender: false}});
				TweenMax.staggerTo($projectBanners, tweenTimeFast, {height: expandHeightMobile}, tweenTimeFast);
			}
		}
		$projTitle.css('top', '0px');
		$projSubTitle.css('top', '0px');

		// handle svg button display
		$btnE.each(function(index) {
			btnArr[index].css('left', '0');
			$('#mainBtnId'+index).attr('r', 23);
		});
	}
	
	
	function jump (h, c) {
		var	curId = h,
				$projEl = $('#'+curId);
		if (document.documentElement.clientWidth > 480) {
			// desktop size
			if (!c) {
				TweenMax.to($projEl, tweenTimeFast, {height: 300, onComplete: function () {
					initialHeight = 0;
					lastScrollTop = 0;
					newHeight = 0;
					$squishyEl = $projEl;
					$squishyEl.stick_in_parent({recalc_every: 100}); // stick for desktop
				}});
				$projReturn.height('100%');
				TweenLite.to(window, 0, {scrollTo:{y: divOffset, autokill: false, immediateRender: false}});
			}
		} else {
			// mobile size
			// we are not sticking in mobile
			$projReturn.height('100%');
			initialHeight = 0;
			$squishyEl = $projEl;

			//just set the height on mobile
			$squishyEl.height(170);
			var title = title || $squishyEl.find('.project-title');
			var subTitle = subTitle || $squishyEl.find('.project-subtitle');
			title.css('top', '45px');
			subTitle.css('top', '45px');

			TweenLite.to(window, 0, {scrollTo:{y: divOffsetMobile, autokill: false, immediateRender: false}});
		}
		scrollReady = !scrollReady;
		if (c) { return 'yup'; }
	}
	
	/* ----------------
		 WINDOW SCROLLING
		 ---------------- */

	/*
	 * Should probably be doing some kind of more css
	 * centric bg image overlap thing, rather than
	 * actually adjusting the height of the banner
	 * background-attachment perhaps
	*/
	
		$(window).scroll(function() { 		// make this better
			if (scrollReady && document.documentElement.clientWidth > 480) {
				if ($squishyEl !== '') {
					var curH = $(this).scrollTop();
					var title = title || $squishyEl.find('.project-title');
					var subTitle = subTitle || $squishyEl.find('.project-subtitle');
					if (initialHeight === 0) {
						initialHeight = curH;
					}
					var diff = (curH - initialHeight) / 3;

					if (curH > lastScrollTop) {  // Going Down
			
						if ($squishyEl.height() > 100 && $squishyEl.height() < 301) {
							newHeight = Math.max(100, ($squishyEl.height() - diff));
							if (newHeight < 301) {
								$squishyEl.height(newHeight);
								title.css('top', '45px');
								subTitle.css('top', '45px');
							}
						}

					} else {  // Going Up
						
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
			}
		});

	/* ----------------
		 /WINDOW SCROLLING
		 ---------------- */

	$('.nav-link').on('click', function(e) {
		e.preventDefault();
		var linkOffset = $($(this).attr('href')).offset().top;
		tlWindowScroll.to(window, tweenTime, {scrollTo:{y: linkOffset, autokill: false}});
		tlWindowScroll.play();
	});
 	$('.btn-project-explode').on('click', loadProject);
	$('.btn-project-close').on('click', closeProject);
	$('#navWork').on('click', closeProject);
	
});


