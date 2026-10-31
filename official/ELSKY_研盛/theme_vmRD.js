/**
 * 主题通用脚本
 */
(function () {
	'use strict';

	var navConfig = window.tongyongNav || {};
	var navBreakpoint = parseInt(navConfig.breakpoint, 10) || 1100;
	var navI18n = navConfig.i18n || {};

	/* ── 导航滚动固定 ── */
	var nav = document.getElementById('nav');
	if (nav) {
		var scrollTicking = false;
		window.addEventListener(
			'scroll',
			function () {
				if (scrollTicking) {
					return;
				}
				scrollTicking = true;
				window.requestAnimationFrame(function () {
					var scrolled = window.scrollY > 40;
					nav.classList.toggle('scrolled', scrolled);
					document.body.classList.toggle('nav-fixed', scrolled);
					scrollTicking = false;
				});
			},
			{ passive: true }
		);
	}

	/* ── 移动端抽屉菜单 ── */
	var toggle = document.getElementById('nav-toggle');
	var overlay = document.getElementById('nav-overlay');
	var drawer = document.getElementById('nav-drawer');
	var closeBtn = document.getElementById('nav-drawer-close');
	var menu = document.getElementById('nav-links');
	var lastMenuTrigger = null;

	function isMobileNav() {
		return window.innerWidth <= navBreakpoint;
	}

	function getDrawerFocusables() {
		if (!drawer) {
			return [];
		}
		return Array.prototype.slice.call(
			drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
		).filter(function (el) {
			return el.offsetParent !== null || el === closeBtn;
		});
	}

	function setSubmenuOpen(li, open) {
		if (!li) {
			return;
		}
		li.classList.toggle('submenu-open', open);

		var btn = null;
		var link = null;
		if (li.children) {
			for (var i = 0; i < li.children.length; i++) {
				var child = li.children[i];
				if (!child.classList) {
					continue;
				}
				if (child.classList.contains('nav-submenu-toggle')) {
					btn = child;
				}
				if (child.tagName === 'A') {
					link = child;
				}
			}
		}

		if (btn) {
			btn.setAttribute('aria-expanded', open ? 'true' : 'false');
		}
		if (link) {
			link.setAttribute('aria-expanded', open ? 'true' : 'false');
		}
	}

	function closeAllSubmenus(root) {
		var scope = root || menu;
		if (!scope) {
			return;
		}
		scope.querySelectorAll('.submenu-open').forEach(function (li) {
			setSubmenuOpen(li, false);
		});
	}

	function expandCurrentNavTrail() {
		if (!menu || !isMobileNav()) {
			return;
		}
		menu.querySelectorAll('.current-menu-ancestor, .current-menu-item').forEach(function (li) {
			if (li.classList.contains('menu-item-has-children')) {
				setSubmenuOpen(li, true);
			}
			var parent = li.parentElement;
			while (parent && parent !== menu) {
				if (parent.classList && parent.classList.contains('menu-item-has-children')) {
					setSubmenuOpen(parent, true);
				}
				parent = parent.parentElement;
			}
		});
	}

	function syncDrawerA11y(menuOpen) {
		if (!drawer) {
			return;
		}

		if (!isMobileNav()) {
			drawer.removeAttribute('inert');
			drawer.setAttribute('aria-hidden', 'false');
			return;
		}

		if (menuOpen) {
			drawer.removeAttribute('inert');
			drawer.setAttribute('aria-hidden', 'false');
			return;
		}

		drawer.setAttribute('inert', '');
		drawer.setAttribute('aria-hidden', 'true');
	}

	function setMenuOpen(open) {
		var wasOpen = document.body.classList.contains('nav-menu-open');

		document.body.classList.toggle('nav-menu-open', open);

		if (toggle) {
			toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
			toggle.setAttribute('aria-label', open ? (navI18n.closeMenu || 'Close menu') : (navI18n.openMenu || 'Open menu'));
		}

		syncDrawerA11y(open);

		if (open) {
			lastMenuTrigger = document.activeElement;
			expandCurrentNavTrail();
			window.setTimeout(function () {
				if (closeBtn) {
					closeBtn.focus();
				}
			}, 80);
			return;
		}

		if (wasOpen) {
			closeAllSubmenus();
			if (lastMenuTrigger && typeof lastMenuTrigger.focus === 'function') {
				lastMenuTrigger.focus();
			}
		}
	}

	function toggleSubmenuItem(li) {
		if (!li) {
			return;
		}
		var isOpen = li.classList.contains('submenu-open');
		var siblings = li.parentElement ? li.parentElement.children : [];
		Array.prototype.forEach.call(siblings, function (sib) {
			if (sib !== li && sib.classList && sib.classList.contains('submenu-open')) {
				setSubmenuOpen(sib, false);
				// 关闭同级时一并收起其深层子菜单
				sib.querySelectorAll('.submenu-open').forEach(function (nested) {
					setSubmenuOpen(nested, false);
				});
			}
		});
		setSubmenuOpen(li, !isOpen);
		if (isOpen) {
			li.querySelectorAll('.submenu-open').forEach(function (nested) {
				setSubmenuOpen(nested, false);
			});
		}
	}

	if (toggle && drawer && menu) {
		toggle.addEventListener('click', function () {
			setMenuOpen(!document.body.classList.contains('nav-menu-open'));
		});

		if (closeBtn) {
			closeBtn.addEventListener('click', function () {
				setMenuOpen(false);
			});
		}

		if (overlay) {
			overlay.addEventListener('click', function () {
				setMenuOpen(false);
			});
		}

		menu.addEventListener('click', function (e) {
			var toggleBtn = e.target.closest('.nav-submenu-toggle');
			if (toggleBtn) {
				e.preventDefault();
				e.stopPropagation();
				toggleSubmenuItem(toggleBtn.closest('li.menu-item-has-children'));
				return;
			}

			var link = e.target.closest('a');
			if (link && menu.contains(link) && isMobileNav()) {
				setMenuOpen(false);
			}
		});

		drawer.addEventListener('keydown', function (e) {
			if (!document.body.classList.contains('nav-menu-open') || e.key !== 'Tab') {
				return;
			}

			var focusables = getDrawerFocusables();
			if (!focusables.length) {
				return;
			}

			var first = focusables[0];
			var last = focusables[focusables.length - 1];

			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		});

		window.addEventListener('resize', function () {
			if (!isMobileNav()) {
				setMenuOpen(false);
				closeAllSubmenus();
			}
			syncDrawerA11y(document.body.classList.contains('nav-menu-open'));
		});

		syncDrawerA11y(false);
	}

	/* ── 搜索面板 ── */
	var searchPanel = document.getElementById('nav-search-panel');
	var searchInput = document.getElementById('nav-search-input');
	var searchOpenBtns = document.querySelectorAll('.js-nav-search-open');
	var searchCloseBtns = document.querySelectorAll('.js-nav-search-close');

	function setSearchOpen(open) {
		document.body.classList.toggle('nav-search-open', open);

		if (searchPanel) {
			searchPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
		}

		searchOpenBtns.forEach(function (btn) {
			btn.setAttribute('aria-expanded', open ? 'true' : 'false');
		});

		if (open) {
			setMenuOpen(false);
			window.setTimeout(function () {
				if (searchInput) {
					searchInput.focus();
				}
			}, 80);
		}
	}

	searchOpenBtns.forEach(function (btn) {
		btn.addEventListener('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (window.innerWidth <= navBreakpoint) {
				return;
			}
			setSearchOpen(!document.body.classList.contains('nav-search-open'));
		});
	});

	searchCloseBtns.forEach(function (btn) {
		btn.addEventListener('click', function () {
			setSearchOpen(false);
		});
	});

	document.addEventListener('keydown', function (e) {
		if (e.key !== 'Escape') {
			return;
		}

		if (document.body.classList.contains('nav-menu-open')) {
			setMenuOpen(false);
			if (toggle) {
				toggle.focus();
			}
			return;
		}

		if (document.body.classList.contains('nav-search-open')) {
			setSearchOpen(false);
			if (searchOpenBtns.length) {
				searchOpenBtns[0].focus();
			}
		}
	});

	/* ── Banner 背景缩放 ── */
	var bannerBg = document.getElementById('bannerBg');
	if (bannerBg) {
		window.addEventListener('load', function () {
			bannerBg.classList.add('zoomed');
		});
	}

	/* ── 浮动通讯栏：联系集合（仅悬停耳机按钮）+ 返回顶部 ── */
	var floatContactToggle = document.getElementById('float-contact-toggle');
	var floatContactPanel = document.getElementById('floatContactPanel');
	var floatContactGroup = floatContactToggle ? floatContactToggle.closest('.float-contact__group') : null;
	if (floatContactToggle && floatContactPanel && floatContactGroup) {
		function setFloatContactOpen(isOpen) {
			floatContactPanel.classList.toggle('is-open', isOpen);
			floatContactToggle.classList.toggle('is-open', isOpen);
			floatContactToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
		}

		function canHoverFloatContact() {
			return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
		}

		floatContactGroup.addEventListener('mouseenter', function () {
			if (canHoverFloatContact()) {
				setFloatContactOpen(true);
			}
		});

		floatContactGroup.addEventListener('mouseleave', function () {
			if (canHoverFloatContact()) {
				setFloatContactOpen(false);
			}
		});

		floatContactToggle.addEventListener('click', function (event) {
			if (canHoverFloatContact()) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			setFloatContactOpen(!floatContactPanel.classList.contains('is-open'));
		});

		document.addEventListener('click', function (event) {
			if (canHoverFloatContact() || !floatContactPanel.classList.contains('is-open')) {
				return;
			}
			if (floatContactGroup.contains(event.target)) {
				return;
			}
			setFloatContactOpen(false);
		});

		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape' && floatContactPanel.classList.contains('is-open')) {
				setFloatContactOpen(false);
			}
		});
	}

	var floatBackTop = document.getElementById('float-back-top');
	if (floatBackTop) {
		floatBackTop.addEventListener('click', function () {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}

	/* ── 关于我们：简介视频播放 ── */
	document.querySelectorAll('[data-about-video]').forEach(function (wrap) {
		var playBtn = wrap.querySelector('[data-about-video-play]');
		var video = wrap.querySelector('.about-intro__video-el');
		if (!playBtn || !video) {
			return;
		}

		playBtn.addEventListener('click', function () {
			wrap.classList.add('is-playing');
			video.setAttribute('controls', 'controls');
			var playPromise = video.play();
			if (playPromise && typeof playPromise.catch === 'function') {
				playPromise.catch(function () {
					/* 自动播放被拦截时仍展示控件，便于手动播放 */
				});
			}
		});
	});

	/* ── 关于我们：荣誉资质 Tab 切换 ── */
	document.querySelectorAll('[data-about-honor]').forEach(function (section) {
		var tabs = section.querySelectorAll('[data-about-honor-tab]');
		var panels = section.querySelectorAll('[data-about-honor-panel]');
		if (!tabs.length || !panels.length) {
			return;
		}

		tabs.forEach(function (tab) {
			tab.addEventListener('click', function () {
				var index = tab.getAttribute('data-index');
				if (!index) {
					return;
				}

				tabs.forEach(function (btn) {
					btn.classList.remove('active');
					btn.setAttribute('aria-selected', 'false');
				});

				panels.forEach(function (panel) {
					panel.classList.remove('is-active');
					panel.setAttribute('hidden', '');
				});

				tab.classList.add('active');
				tab.setAttribute('aria-selected', 'true');

				var activePanel = section.querySelector('[data-about-honor-panel][data-index="' + index + '"]');
				if (activePanel) {
					activePanel.classList.add('is-active');
					activePanel.removeAttribute('hidden');
				}
			});
		});
	});

	/* ── 关于我们2：画廊轮播（逐张滑动，圆点按页；手机端一排 1 张） ── */
	document.querySelectorAll('[data-about-gallery-slider]').forEach(function (section) {
		var track = section.querySelector('[data-about-gallery-track]');
		var items = section.querySelectorAll('[data-about-gallery-item]');
		var dotsRoot = section.querySelector('[data-about-gallery-dots]');
		var desktopPerView = parseInt(section.getAttribute('data-per-view'), 10) || 3;

		if (!track || !items.length) {
			return;
		}

		var current = 0;
		var perView = desktopPerView;
		var maxIndex = 0;
		var timer = null;
		var resizeTimer = null;

		function getPerView() {
			return window.innerWidth <= 768 ? 1 : desktopPerView;
		}

		function getStep() {
			var gap = parseFloat(window.getComputedStyle(track).gap) || 0;
			return items[0].getBoundingClientRect().width + gap;
		}

		function rebuildDots() {
			if (!dotsRoot) {
				return;
			}
			var pageCount = Math.max(1, Math.ceil(items.length / perView));
			dotsRoot.innerHTML = '';
			for (var i = 0; i < pageCount; i++) {
				var btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 'about-gallery-slider__dot' + (0 === i ? ' is-active' : '');
				btn.setAttribute('data-about-gallery-dot', '');
				btn.setAttribute('data-index', String(i));
				btn.setAttribute('aria-label', '第 ' + (i + 1) + ' 页');
				btn.setAttribute('aria-selected', 0 === i ? 'true' : 'false');
				btn.addEventListener('click', function () {
					var page = parseInt(this.getAttribute('data-index'), 10);
					if (isNaN(page)) {
						return;
					}
					goTo(page * perView);
					startAutoplay();
				});
				dotsRoot.appendChild(btn);
			}
			if (pageCount <= 1) {
				dotsRoot.hidden = true;
			} else {
				dotsRoot.hidden = false;
			}
		}

		function getDots() {
			return dotsRoot ? dotsRoot.querySelectorAll('[data-about-gallery-dot]') : [];
		}

		function getActivePage() {
			var dots = getDots();
			if (!dots.length) {
				return 0;
			}
			if (current >= maxIndex) {
				return dots.length - 1;
			}
			return Math.min(Math.floor(current / perView), dots.length - 1);
		}

		function updateDots() {
			var page = getActivePage();
			getDots().forEach(function (dot, i) {
				var active = i === page;
				dot.classList.toggle('is-active', active);
				dot.setAttribute('aria-selected', active ? 'true' : 'false');
			});
		}

		function goTo(index) {
			current = Math.max(0, Math.min(index, maxIndex));
			track.style.transform = 'translateX(-' + current * getStep() + 'px)';
			updateDots();
		}

		function next() {
			if (current >= maxIndex) {
				goTo(0);
				return;
			}
			goTo(current + 1);
		}

		function startAutoplay() {
			stopAutoplay();
			if (maxIndex <= 0) {
				return;
			}
			timer = window.setInterval(next, 4000);
		}

		function stopAutoplay() {
			if (timer) {
				window.clearInterval(timer);
				timer = null;
			}
		}

		function layout(resetIndex) {
			perView = getPerView();
			maxIndex = Math.max(0, items.length - perView);
			rebuildDots();
			goTo(resetIndex ? 0 : current);
		}

		section.addEventListener('mouseenter', stopAutoplay);
		section.addEventListener('mouseleave', startAutoplay);

		window.addEventListener('resize', function () {
			window.clearTimeout(resizeTimer);
			resizeTimer = window.setTimeout(function () {
				layout(false);
			}, 120);
		});

		layout(true);
		startAutoplay();
	});

	/* ── 产品详情：缩略图轮播 + Tab ── */
	var productDetail = document.querySelector('.product-detail');
	if (productDetail) {
		var mainImage = productDetail.querySelector('#mainImage');
		var mainVideo = productDetail.querySelector('#mainVideo');
		var mainWrap = productDetail.querySelector('[data-detail-main]');
		var thumbsRoot = productDetail.querySelector('[data-detail-thumbs]');
		var thumbs = productDetail.querySelectorAll('.detail-thumbs .thumb');

		function showMainImage(src) {
			if (mainVideo) {
				try {
					mainVideo.pause();
					mainVideo.currentTime = 0;
				} catch (e) {
					/* ignore */
				}
				mainVideo.removeAttribute('controls');
				mainVideo.setAttribute('hidden', 'hidden');
			}
			if (mainWrap) {
				mainWrap.classList.remove('is-showing-video');
			}
			if (mainImage && src) {
				mainImage.src = src;
				mainImage.removeAttribute('hidden');
			}
		}

		function showMainVideo(videoSrc, posterSrc) {
			if (!mainVideo || !videoSrc) {
				showMainImage(posterSrc);
				return;
			}
			if (posterSrc && mainImage) {
				mainImage.src = posterSrc;
			}
			if (mainVideo.getAttribute('src') !== videoSrc) {
				mainVideo.setAttribute('src', videoSrc);
			}
			if (posterSrc) {
				mainVideo.setAttribute('poster', posterSrc);
			}
			mainVideo.removeAttribute('hidden');
			mainVideo.setAttribute('controls', 'controls');
			if (mainWrap) {
				mainWrap.classList.add('is-showing-video');
			}
			var playPromise = mainVideo.play();
			if (playPromise && typeof playPromise.catch === 'function') {
				playPromise.catch(function () {
					/* 自动播放被拦截时保留控件供手动播放 */
				});
			}
		}

		function setMainFromThumb(thumb) {
			var src = thumb.getAttribute('data-src');
			var videoSrc = thumb.getAttribute('data-video');
			thumbs.forEach(function (t) {
				t.classList.remove('active');
			});
			thumb.classList.add('active');
			if (videoSrc) {
				showMainVideo(videoSrc, src);
			} else {
				showMainImage(src);
			}
		}

		thumbs.forEach(function (thumb) {
			thumb.addEventListener('click', function () {
				setMainFromThumb(thumb);
			});
		});

		if (thumbsRoot) {
			var viewport = thumbsRoot.querySelector('.detail-thumbs__viewport');
			var track = thumbsRoot.querySelector('.detail-thumbs__track');
			var prevBtn = thumbsRoot.querySelector('.detail-thumbs__prev');
			var nextBtn = thumbsRoot.querySelector('.detail-thumbs__next');
			var thumbItems = Array.prototype.slice.call(thumbsRoot.querySelectorAll('.thumb'));
			var index = 0;
			var resizeTimer = null;
			var gap = 10;

			function getPerView() {
				if (window.innerWidth <= 768) {
					return 3;
				}
				if (window.innerWidth <= 992) {
					return 5;
				}
				return 6;
			}

			function getMaxIndex() {
				return Math.max(0, thumbItems.length - getPerView());
			}

			function layout() {
				var perView = getPerView();
				var styles = window.getComputedStyle(viewport);
				var padX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
				var vw = Math.max(0, viewport.clientWidth - padX);
				var w = Math.max(40, (vw - gap * (perView - 1)) / perView);
				thumbItems.forEach(function (item) {
					item.style.width = w + 'px';
					item.style.flex = '0 0 ' + w + 'px';
				});
				track.style.gap = gap + 'px';
			}

			function getStep() {
				if (!thumbItems.length) {
					return 0;
				}
				return thumbItems[0].getBoundingClientRect().width + gap;
			}

			function updateNav() {
				var max = getMaxIndex();
				if (prevBtn) {
					prevBtn.disabled = index <= 0;
				}
				if (nextBtn) {
					nextBtn.disabled = index >= max;
				}
				thumbsRoot.classList.toggle('has-overflow', max > 0);
			}

			function goTo(nextIndex, instant) {
				index = Math.max(0, Math.min(nextIndex, getMaxIndex()));
				if (instant) {
					track.style.transition = 'none';
				}
				track.style.transform = 'translateX(-' + index * getStep() + 'px)';
				updateNav();
				if (instant) {
					track.offsetHeight; /* force reflow */
					track.style.transition = '';
				}
			}

			function ensureVisible(thumbIndex) {
				var perView = getPerView();
				if (thumbIndex < index) {
					goTo(thumbIndex);
				} else if (thumbIndex >= index + perView) {
					goTo(thumbIndex - perView + 1);
				}
			}

			thumbItems.forEach(function (thumb, i) {
				thumb.addEventListener('click', function () {
					ensureVisible(i);
				});
			});

			if (prevBtn) {
				prevBtn.addEventListener('click', function () {
					goTo(index - 1);
				});
			}
			if (nextBtn) {
				nextBtn.addEventListener('click', function () {
					goTo(index + 1);
				});
			}

			window.addEventListener('resize', function () {
				window.clearTimeout(resizeTimer);
				resizeTimer = window.setTimeout(function () {
					layout();
					goTo(index, true);
				}, 120);
			});

			layout();
			goTo(0, true);
			thumbsRoot.classList.add('is-ready');
		}

		var tabs = productDetail.querySelectorAll('.specs-tab');
		var panels = productDetail.querySelectorAll('.specs-content');
		tabs.forEach(function (tab) {
			tab.addEventListener('click', function () {
				var tabId = tab.getAttribute('data-tab');
				if (!tabId) {
					return;
				}
				tabs.forEach(function (t) {
					t.classList.remove('active');
				});
				tab.classList.add('active');
				panels.forEach(function (panel) {
					panel.classList.toggle('active', panel.id === tabId);
				});
			});
		});
	}

	/* ── 通用弹窗（客户留言 / 供应商留言） ── */
	var openModalBtns = document.querySelectorAll('[data-open-modal]');
	if (openModalBtns.length) {
		function getModalById(id) {
			return id ? document.getElementById(id) : null;
		}

		function openSiteModal(modal) {
			if (!modal) {
				return;
			}
			modal.hidden = false;
			modal.setAttribute('aria-hidden', 'false');
			modal.classList.add('is-open');
			document.body.classList.add('contact-modal-open');
		}

		function closeSiteModal(modal) {
			if (!modal) {
				return;
			}
			modal.classList.remove('is-open');
			modal.setAttribute('aria-hidden', 'true');
			modal.hidden = true;
			if (!document.querySelector('.contact-form-modal.is-open, .contact-supplier-modal.is-open')) {
				document.body.classList.remove('contact-modal-open');
			}
		}

		openModalBtns.forEach(function (btn) {
			btn.addEventListener('click', function (event) {
				event.preventDefault();
				openSiteModal(getModalById(btn.getAttribute('data-open-modal')));
			});
		});

		document.querySelectorAll('.contact-form-modal, .contact-supplier-modal').forEach(function (modal) {
			modal.querySelectorAll('[data-close-modal]').forEach(function (btn) {
				btn.addEventListener('click', function (event) {
					event.preventDefault();
					closeSiteModal(modal);
				});
			});
		});

		document.addEventListener('keydown', function (event) {
			if (event.key !== 'Escape') {
				return;
			}
			document.querySelectorAll('.contact-form-modal.is-open, .contact-supplier-modal.is-open').forEach(function (modal) {
				closeSiteModal(modal);
			});
		});
	}

	/* ── 滚动显现动画（与首页一致；首屏板块进入页面也会过渡显示） ── */
	var animElements = document.querySelectorAll('.animate-on-scroll');
	if (animElements.length && 'IntersectionObserver' in window) {
		var animObserver = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
						animObserver.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
		);

		animElements.forEach(function (el) {
			animObserver.observe(el);
		});

		/* 等一帧再检测首屏元素，保证能播过渡动画 */
		window.requestAnimationFrame(function () {
			window.requestAnimationFrame(function () {
				animElements.forEach(function (el) {
					if (el.classList.contains('visible')) {
						return;
					}
					var rect = el.getBoundingClientRect();
					if (rect.top < window.innerHeight && rect.bottom > 0) {
						el.classList.add('visible');
						animObserver.unobserve(el);
					}
				});
			});
		});
	} else {
		animElements.forEach(function (el) {
			el.classList.add('visible');
		});
	}
})();
