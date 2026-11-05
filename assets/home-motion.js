(() => {
  const page = document.querySelector('.home-page');

  if (!page) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const progress = document.querySelector('.home-scroll-progress span');
  const hero = document.querySelector('.hero');
  const revealTargets = document.querySelectorAll([
    '.section-head',
    '.module-card',
    '.showcase-media',
    '.showcase-copy',
    '.feed-card',
    '.aside-card',
    '.company-card',
    '.city-card',
    '.person-card',
    '.story-card',
    '.course-card',
    '.metrics',
    '.startup-strip',
    '.home-scroll-copy',
    '.home-scroll-step',
  ].join(','));

  revealTargets.forEach((element, index) => {
    element.classList.add('home-reveal');
    element.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 70}ms`);
  });

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    revealTargets.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  document.documentElement.classList.add('home-motion-ready');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.08,
  });

  revealTargets.forEach((element) => observer.observe(element));

  let queued = false;

  const updateScrollMotion = () => {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const scrollProgress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);

    if (progress) progress.style.transform = `scaleX(${scrollProgress})`;

    if (hero) {
      const heroRect = hero.getBoundingClientRect();
      const heroProgress = Math.min(Math.max(-heroRect.top / Math.max(heroRect.height, 1), 0), 1);

      hero.style.setProperty('--hero-shift', `${heroProgress * 56}px`);
      hero.style.setProperty('--hero-image-shift', `${heroProgress * 26}px`);
    }

    queued = false;
  };

  const queueUpdate = () => {
    if (queued) return;

    queued = true;
    window.requestAnimationFrame(updateScrollMotion);
  };

  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate);
  updateScrollMotion();
})();
