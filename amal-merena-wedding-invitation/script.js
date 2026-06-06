(function () {
  const config = window.INVITATION;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function applyConfig() {
    $$('[data-config-text]').forEach((node) => {
      node.textContent = config[node.dataset.configText] || '';
    });
    $$('[data-config-src]').forEach((node) => {
      node.src = config[node.dataset.configSrc] || '';
    });
    $('#music').src = config.music;
    $('#mapButton').href = config.locationLink;
  }

  function openInvite() {
    $('#cover').classList.add('is-open');
    document.body.classList.add('is-opened');
    setTimeout(() => $('#invitation').scrollIntoView({ behavior: 'smooth' }), 360);
    playMusic();
  }

  async function playMusic() {
    const music = $('#music');
    try {
      await music.play();
      $('#musicToggle').classList.add('is-playing');
      $('#musicToggle').textContent = 'Playing';
    } catch (error) {
      $('#musicToggle').textContent = 'Music';
    }
  }

  function toggleMusic() {
    const music = $('#music');
    if (music.paused) {
      playMusic();
    } else {
      music.pause();
      $('#musicToggle').classList.remove('is-playing');
      $('#musicToggle').textContent = 'Music';
    }
  }

  function setupRevealAnimation() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .18 });
    $$('.reveal').forEach((node) => observer.observe(node));
  }

  function setupCountdown() {
    const units = {
      days: $('[data-unit="days"]'),
      hours: $('[data-unit="hours"]'),
      minutes: $('[data-unit="minutes"]'),
      seconds: $('[data-unit="seconds"]')
    };
    const target = new Date(config.weddingDateISO).getTime();

    function tick() {
      const distance = Math.max(0, target - Date.now());
      units.days.textContent = String(Math.floor(distance / 86400000)).padStart(2, '0');
      units.hours.textContent = String(Math.floor((distance % 86400000) / 3600000)).padStart(2, '0');
      units.minutes.textContent = String(Math.floor((distance % 3600000) / 60000)).padStart(2, '0');
      units.seconds.textContent = String(Math.floor((distance % 60000) / 1000)).padStart(2, '0');
    }

    tick();
    setInterval(tick, 1000);
  }

  function setupScratchCard() {
    const card = $('#scratchCard');
    const canvas = $('#scratchCanvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let scratching = false;
    let revealed = false;
    let scratchMoves = 0;

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      const rect = card.getBoundingClientRect();
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      paintCover(rect.width, rect.height);
    }

    function paintCover(width, height) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#7a4d23');
      gradient.addColorStop(.42, '#f6d47c');
      gradient.addColorStop(1, '#3d2718');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255,255,255,.28)';
      for (let i = 0; i < 70; i += 1) {
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.8 + .7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function point(event) {
      const rect = canvas.getBoundingClientRect();
      const touch = event.touches && event.touches[0] ? event.touches[0] : event;
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }

    function scratch(event) {
      if (!scratching) return;
      event.preventDefault();
      const pos = point(event);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 34, 0, Math.PI * 2);
      ctx.fill();
      $('#scratchHint').style.opacity = '0';
      scratchMoves += 1;
      checkReveal();
    }

    function checkReveal() {
      if (revealed) return;
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0;
      for (let i = 3; i < pixels.length; i += 40) {
        if (pixels[i] < 20) clear += 1;
      }
      if (clear / (pixels.length / 40) > .18 || scratchMoves > 12) {
        revealed = true;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        burstPetals();
      }
    }

    ['mousedown', 'touchstart'].forEach((eventName) => {
      canvas.addEventListener(eventName, (event) => {
        scratching = true;
        scratch(event);
      }, { passive: false });
    });
    ['mousemove', 'touchmove'].forEach((eventName) => canvas.addEventListener(eventName, scratch, { passive: false }));
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((eventName) => {
      canvas.addEventListener(eventName, () => { scratching = false; });
    });

    window.addEventListener('resize', resize);
    resize();
  }

  function burstPetals() {
    const layer = $('#petalLayer');
    for (let i = 0; i < 34; i += 1) {
      const petal = document.createElement('span');
      petal.className = 'petal';
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.setProperty('--x', `${(Math.random() - .5) * 160}px`);
      petal.style.animationDelay = `${Math.random() * .55}s`;
      petal.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
      layer.appendChild(petal);
      setTimeout(() => petal.remove(), 5600);
    }
  }

  async function shareInvite() {
    const shareData = {
      title: `${config.couple} Wedding Invitation`,
      text: `${config.couple} invite you to their wedding on ${config.dateDisplay}, ${config.time} at ${config.venue}.`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        return;
      }
    }

    const text = encodeURIComponent(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
  }

  applyConfig();
  setupRevealAnimation();
  setupCountdown();
  setupScratchCard();
  $('#openInvite').addEventListener('click', openInvite);
  $('#cover').addEventListener('click', (event) => {
    if (event.target.id !== 'openInvite') openInvite();
  });
  $('#musicToggle').addEventListener('click', toggleMusic);
  $('#shareButton').addEventListener('click', shareInvite);
})();



