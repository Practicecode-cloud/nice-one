/* =========================================================================
   APP.JS
   Boots the app: builds the horizontal nav from MODULES/NAV_GROUPS,
   wires up routing between the Dashboard, every CRUD module, and the
   Gallery page, and powers the global quick-search box in the navbar.
   ========================================================================= */

(function () {
  const navGroupsEl = document.getElementById('nav-groups');
  const mobileToggle = document.getElementById('nav-mobile-toggle');
  const navGroupsWrap = document.getElementById('nav-groups-wrap');

  /* ---------------------------------------------------- build nav bar -- */

  function buildNav() {
    const byGroup = {};
    Object.entries(MODULES).forEach(([key, cfg]) => {
      byGroup[cfg.group] = byGroup[cfg.group] || [];
      byGroup[cfg.group].push({ key, ...cfg });
    });
    Object.values(byGroup).forEach(list => list.sort((a, b) => a.order - b.order));

    navGroupsEl.innerHTML = NAV_GROUPS.map(group => {
      const items = (byGroup[group.key] || []);
      return `
        <div class="nav-dropdown">
          <button class="nav-link nav-link--dropdown" data-group="${group.key}">
            <span>${group.icon}</span> ${group.label} <span class="caret">▾</span>
          </button>
          <div class="nav-dropdown__menu">
            ${items.map(it => `<a href="#" class="nav-dropdown__item" data-route="${it.key}"><span>${it.icon}</span>${it.label}</a>`).join('')}
          </div>
        </div>
      `;
    }).join('') + `
      <a href="#" class="nav-link" data-route="gallery"><span>🖼️</span> Gallery</a>
    `;

    navGroupsEl.querySelectorAll('[data-route]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(el.dataset.route);
        closeMobileNav();
      });
    });

    // toggle dropdown open/close on click (works for touch + desktop)
    navGroupsEl.querySelectorAll('.nav-link--dropdown').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = btn.closest('.nav-dropdown');
        const wasOpen = dropdown.classList.contains('is-open');
        document.querySelectorAll('.nav-dropdown.is-open').forEach(d => d.classList.remove('is-open'));
        if (!wasOpen) dropdown.classList.add('is-open');
      });
    });
    document.addEventListener('click', () => {
      document.querySelectorAll('.nav-dropdown.is-open').forEach(d => d.classList.remove('is-open'));
    });
  }

  mobileToggle.addEventListener('click', () => {
    navGroupsWrap.classList.toggle('is-open');
  });
  function closeMobileNav() { navGroupsWrap.classList.remove('is-open'); }

  /* --------------------------------------------------------- routing -- */

  function setActiveNav(route) {
    document.querySelectorAll('.nav-link[data-route], .nav-dropdown__item[data-route]').forEach(el => {
      el.classList.toggle('is-active', el.dataset.route === route);
    });
    const dashLink = document.getElementById('nav-dashboard');
    dashLink.classList.toggle('is-active', route === 'dashboard');
  }

  async function navigate(route) {
    setActiveNav(route);
    window.location.hash = route;

    if (route === 'dashboard') {
      Dashboard.hide();
      await Dashboard.show();
    } else if (route === 'gallery') {
      Dashboard.hide();
      showGallery();
    } else if (MODULES[route]) {
      Dashboard.hide();
      await UI.showModule(route);
    } else {
      Dashboard.hide();
      await Dashboard.show();
    }
  }

  document.getElementById('nav-dashboard').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('dashboard');
  });
  document.getElementById('brand-link').addEventListener('click', (e) => {
    e.preventDefault();
    navigate('dashboard');
  });

  /* ------------------------------------------------------ gallery page -- */

  function showGallery() {
    const content = document.getElementById('app-content');
    const images = [
      { seed: 'aurelia-lobby', title: 'Grand Lobby', desc: 'The marble atrium welcomes every guest at check-in.' },
      { seed: 'aurelia-exterior', title: 'Hotel Exterior', desc: 'Aurelia\u2019s flagship tower at dusk.' },
      { seed: 'aurelia-suite', title: 'Deluxe Suite', desc: 'King bed suites with skyline views.' },
      { seed: 'aurelia-room2', title: 'Executive Room', desc: 'Comfortable stays for the modern traveller.' },
      { seed: 'aurelia-restaurant', title: 'Restaurant & Menu', desc: 'Seasonal tasting menus from our executive chef.' },
      { seed: 'aurelia-bar', title: 'Rooftop Bar', desc: 'Handcrafted cocktails above the skyline.' },
      { seed: 'aurelia-pool', title: 'Infinity Pool', desc: 'Open year-round for all registered guests.' },
      { seed: 'aurelia-spa', title: 'Spa & Wellness', desc: 'Book treatments directly under Guest Services.' },
      { seed: 'aurelia-gym', title: 'Fitness Studio', desc: '24-hour access with personal trainers on call.' },
    ];

    content.innerHTML = `
      <section class="module">
        <header class="module__header">
          <div class="module__title">
            <span class="module__icon">🖼️</span>
            <div>
              <h1>Property Gallery</h1>
              <p class="module__count">A look at the spaces behind the data.</p>
            </div>
          </div>
        </header>
        <div class="gallery-grid">
          ${images.map(img => `
            <figure class="gallery-card">
              <img src="https://picsum.photos/seed/${img.seed}/640/440" alt="${img.title}" loading="lazy" />
              <figcaption>
                <h4>${img.title}</h4>
                <p>${img.desc}</p>
              </figcaption>
            </figure>
          `).join('')}
        </div>
      </section>
    `;
  }

  /* ------------------------------------------------------ global search -- */

  const globalSearchInput = document.getElementById('global-search');
  const globalSearchResults = document.getElementById('global-search-results');
  let searchDebounce = null;

  globalSearchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    const q = globalSearchInput.value.trim();
    if (q.length < 2) { globalSearchResults.classList.remove('is-open'); return; }
    searchDebounce = setTimeout(() => runGlobalSearch(q), 250);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.global-search')) globalSearchResults.classList.remove('is-open');
  });

  async function runGlobalSearch(query) {
    const q = query.toLowerCase();
    const [guests, rooms, reservations] = await Promise.all([
      Api.list('guests').catch(() => []),
      Api.list('rooms').catch(() => []),
      Api.list('reservation').catch(() => []),
    ]);

    const results = [];

    guests.filter(g => `${g.first_name} ${g.last_name} ${g.email || ''} ${g.phone || ''}`.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(g => results.push({ icon: '🧳', label: `${g.first_name} ${g.last_name}`, sub: 'Guest', route: 'guests', search: `${g.first_name} ${g.last_name}` }));

    rooms.filter(r => `${r.room_number} ${r.type_name}`.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(r => results.push({ icon: '🚪', label: `Room ${r.room_number}`, sub: r.type_name, route: 'rooms', search: r.room_number }));

    reservations.filter(r => `${r.first_name} ${r.last_name} ${r.room_number} ${r.reservation_id}`.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(r => results.push({ icon: '📅', label: `Reservation #${r.reservation_id}`, sub: `${r.first_name} ${r.last_name} · Room ${r.room_number}`, route: 'reservation', search: String(r.reservation_id) }));

    if (results.length === 0) {
      globalSearchResults.innerHTML = `<div class="search-result search-result--empty">No matches found.</div>`;
    } else {
      globalSearchResults.innerHTML = results.map(r => `
        <button class="search-result" data-route="${r.route}" data-search="${UI.escapeHtml(r.search)}">
          <span>${r.icon}</span>
          <span class="search-result__text"><strong>${UI.escapeHtml(r.label)}</strong><small>${UI.escapeHtml(r.sub)}</small></span>
        </button>
      `).join('');
      globalSearchResults.querySelectorAll('.search-result[data-route]').forEach(btn => {
        btn.addEventListener('click', async () => {
          globalSearchResults.classList.remove('is-open');
          globalSearchInput.value = '';
          await navigate(btn.dataset.route);
          const searchBox = document.getElementById('module-search');
          if (searchBox) {
            searchBox.value = btn.dataset.search;
            searchBox.dispatchEvent(new Event('input'));
          }
        });
      });
    }
    globalSearchResults.classList.add('is-open');
  }

  /* ------------------------------------------------------------ boot -- */

  buildNav();
  const initialRoute = window.location.hash ? window.location.hash.slice(1) : 'dashboard';
  navigate(initialRoute);
})();
