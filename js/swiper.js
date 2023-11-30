const SwiperClassName = 'swiper';
const SwiperDraggableClassName = 'swiper-draggable';
const SwiperLineClassName = 'swiper__line';
const SwiperLineContainerClassName = 'swiper__line-container';
const SwiperSlideClassName = 'swiper__slide';
const SwiperDotsClassName = 'swiper__dots';
const SwiperDotClassName = 'swiper__dot';
const SwiperDotActiveClassName = 'swiper__dot-active';
const SwiperNavClassName = 'swiper__nav';
const SwiperNavPrevClassName = 'swiper__nav-prev';
const SwiperNavNextClassName = 'swiper__nav-next';
const SwiperNavDisabledClassName = 'swiper__nav-disabled';

class Swiper {
  constructor(element, options = {}) {
    this.containerNode = element;
    this.size = element.childElementCount;
    this.currentSlide = 0;
    this.currentSlideWasChanged = false;

    this.settings = {
      margin: options.margin || 0,
    };

    this.manageHTML = this.manageHTML.bind(this);
    this.setParameters = this.setParameters.bind(this);
    this.setEvents = this.setEvents.bind(this);
    this.resizeSwiper = this.resizeSwiper.bind(this);
    this.startDrag = this.startDrag.bind(this);
    this.stopDrag = this.stopDrag.bind(this);
    this.dragging = this.dragging.bind(this);
    this.changeCurrentSlide = this.changeCurrentSlide.bind(this);
    this.changeActiveDotClass = this.changeActiveDotClass.bind(this);
    this.setStylePosition = this.setStylePosition.bind(this);
    this.changeDisabledNav = this.changeDisabledNav.bind(this);

    this.clickDots = this.clickDots.bind(this);
    this.moveToPrev = this.moveToPrev.bind(this);
    this.moveToNext = this.moveToNext.bind(this);

    this.manageHTML();
    this.setParameters();
    this.setEvents();
  }

  manageHTML() {
    this.containerNode.classList.add(SwiperClassName);
    this.containerNode.innerHTML = `
		<div class="${SwiperLineContainerClassName}">
			<div class="${SwiperLineClassName}" >
				${this.containerNode.innerHTML}
			</div>
		</div>
		<div class="${SwiperNavClassName}">
			<button class="${SwiperNavPrevClassName}"></button>
			<button class="${SwiperNavNextClassName}"></button>
		</div>
		<div class="${SwiperDotsClassName}"></div>
	  `;
    this.lineContainerNode = this.containerNode.querySelector(
      `.${SwiperLineContainerClassName}`
    );
    this.lineNode = this.containerNode.querySelector(`.${SwiperLineClassName}`);
    this.dotsNode = this.containerNode.querySelector(`.${SwiperDotsClassName}`);

    this.slideNodes = Array.from(this.lineNode.children).map((childNode) =>
      wrapElementByDiv({
        element: childNode,
        className: SwiperSlideClassName,
      })
    );

    this.dotsNode.innerHTML = Array.from(Array(this.size).keys())
      .map(
        (key) =>
          `<button class="${SwiperDotClassName} ${
            key === this.currentSlide ? SwiperDotActiveClassName : ''
          }"></button>`
      )
      .join('');

    this.dotNodes = this.dotsNode.querySelectorAll(`.${SwiperDotClassName}`);
    this.navPrev = this.containerNode.querySelector(
      `.${SwiperNavPrevClassName}`
    );
    this.navNext = this.containerNode.querySelector(
      `.${SwiperNavNextClassName}`
    );
  }

  setParameters() {
    const coordsLineContainer = this.lineContainerNode.getBoundingClientRect();
    this.width = coordsLineContainer.width;
    this.maximumX = -(this.size - 1) * (this.width + this.settings.margin);
    this.x = -this.currentSlide * (this.width + this.settings.margin);

    this.resetStyleTransition();
    this.lineNode.style.width = `${
      this.size * (this.width + this.settings.margin)
    }px`;
    this.setStylePosition();
    this.changeActiveDotClass();
    this.changeDisabledNav();
    Array.from(this.slideNodes).forEach((slideNode) => {
      slideNode.style.width = `${this.width}px`;
      slideNode.style.marginRight = `${this.settings.margin}px`;
    });
  }

  setEvents() {
    this.debouncedResizeSwiper = debounce(this.resizeSwiper);
    window.addEventListener('resize', this.debouncedResizeSwiper);
    this.lineNode.addEventListener('pointerdown', this.startDrag);
    window.addEventListener('pointerup', this.stopDrag);
    window.addEventListener('pointercancel', this.stopDrag);

    //   Navigation
    this.dotsNode.addEventListener('click', this.clickDots);
    this.navPrev.addEventListener('click', this.moveToPrev);
    this.navNext.addEventListener('click', this.moveToNext);
  }

  destroyEvents() {
    window.removeEventListener('resize', this.debouncedResizeSwiper);
    this.lineNode.removeEventListener('pointerdown', this.startDrag);
    window.removeEventListener('pointerup', this.stopDrag);
    window.removeEventListener('pointercancel', this.stopDrag);

    this.dotsNode.removeEventListener('click', this.clickDots);
    this.navPrev.removeEventListener('click', this.moveToPrev);
    this.navNext.removeEventListener('click', this.moveToNext);
  }

  resizeSwiper() {
    this.setParameters();
  }

  startDrag(e) {
    this.currentSlideWasChanged = false;
    this.clickX = e.pageX;
    this.startX = this.x;
    this.resetStyleTransition();

    this.containerNode.classList.add(SwiperDraggableClassName);

    window.addEventListener('pointermove', this.dragging);
  }

  stopDrag() {
    window.removeEventListener('pointermove', this.dragging);

    this.containerNode.classList.remove(SwiperDraggableClassName);

    this.changeCurrentSlide();
  }

  dragging(e) {
    this.dragX = e.pageX;
    const dragShift = this.dragX - this.clickX;
    const easing = dragShift / 5;
    this.x = Math.max(
      Math.min(this.startX + dragShift, easing),
      this.maximumX + easing
    );

    this.setStylePosition();

    //   Change active slide
    if (
      dragShift > 20 &&
      dragShift > 0 &&
      !this.currentSlideWasChanged &&
      this.currentSlide > 0
    ) {
      this.currentSlideWasChanged = true;
      this.currentSlide = this.currentSlide - 1;
    }

    if (
      dragShift < -20 &&
      dragShift < 0 &&
      !this.currentSlideWasChanged &&
      this.currentSlide < this.size - 1
    ) {
      this.currentSlideWasChanged = true;
      this.currentSlide = this.currentSlide + 1;
    }
  }

  clickDots(e) {
    const dotNode = e.target.closest('button');
    if (!dotNode) {
      return;
    }

    let dotNumber;
    for (let i = 0; i < this.dotNodes.length; i++) {
      if (this.dotNodes[i] === dotNode) {
        dotNumber = i;
        break;
      }
    }

    if (dotNumber === this.currentSlide) {
      return;
    }

    const countSwipes = Math.abs(this.currentSlide - dotNumber);
    this.currentSlide = dotNumber;
    this.changeCurrentSlide(countSwipes);
  }

  moveToPrev() {
    if (this.currentSlide <= 0) {
      return;
    }

    this.currentSlide = this.currentSlide - 1;
    this.changeCurrentSlide();
  }

  moveToNext() {
    if (this.currentSlide >= this.size - 1) {
      return;
    }

    this.currentSlide = this.currentSlide + 1;
    this.changeCurrentSlide();
  }

  changeCurrentSlide(countSwipes) {
    this.x = -this.currentSlide * (this.width + this.settings.margin);
    this.setStyleTransition(countSwipes);
    this.setStylePosition();
    this.changeActiveDotClass();
    this.changeDisabledNav();
  }

  changeActiveDotClass() {
    for (let i = 0; i < this.dotNodes.length; i++) {
      this.dotNodes[i].classList.remove(SwiperDotActiveClassName);
    }

    this.dotNodes[this.currentSlide].classList.add(SwiperDotActiveClassName);
  }

  changeDisabledNav() {
    if (this.currentSlide <= 0) {
      this.navPrev.classList.add(SwiperNavDisabledClassName);
    } else {
      this.navPrev.classList.remove(SwiperNavDisabledClassName);
    }

    if (this.currentSlide >= this.size - 1) {
      this.navNext.classList.add(SwiperNavDisabledClassName);
    } else {
      this.navNext.classList.remove(SwiperNavDisabledClassName);
    }
  }

  setStylePosition() {
    this.lineNode.style.transform = `translate3d(${this.x}px, 0, 0)`;
  }

  setStyleTransition(countSwipes = 1) {
    this.lineNode.style.transition = `all ${0.3 * countSwipes}s ease 0s`;
  }

  resetStyleTransition() {
    this.lineNode.style.transition = `all 0s ease 0s`;
  }
}

// Helpers
function wrapElementByDiv({ element, className }) {
  const wrapperNode = document.createElement('div');
  wrapperNode.classList.add(className);

  element.parentNode.insertBefore(wrapperNode, element);
  wrapperNode.appendChild(element);

  return wrapperNode;
}

function debounce(func, time = 100) {
  let timer;
  return function (e) {
    clearTimeout(timer);
    timer = setTimeout(func, time, e);
  };
}
