/* =========================================================================
   DASHBOARD.JS
   Live operations dashboard: stat cards + pie/bar charts built from real
   API data. Call Dashboard.markDirty() after any CRUD write elsewhere in
   the app; if the dashboard is the active view it refetches immediately,
   otherwise it refetches the next time the user opens it. A background
   poll also keeps it fresh while it's on screen.
   ========================================================================= */

const Dashboard = (() => {
  const content = document.getElementById('app-content');
  let isActive = false;
  let dirty = true;
  let pollTimer = null;
  const charts = {};

  const PALETTE = ['#B8873C', '#3B6E91', '#3F7A57', '#B3413B', '#8B5FA3', '#C08A28', '#5B7C99', '#9C6644'];

  function template() {
    return `
      <section class="dashboard">
        <div class="hero" id="hero-banner">
          <div class="hero__overlay"></div>
          <div class="hero__content">
            <p class="hero__eyebrow"><span class="pulse-dot" id="conn-dot"></span><span id="conn-label">Checking connection…</span></p>
            <h1>Grand Aurelia Operations Dashboard</h1>
            <p class="hero__sub">A live, real-time view across every hotel, branch, room, and reservation in the system.</p>
          </div>
        </div>

        <div class="stat-grid" id="stat-grid">
          ${statCardSkeleton('hotels', '🏨', 'Hotels')}
          ${statCardSkeleton('branches', '🏢', 'Branches')}
          ${statCardSkeleton('rooms', '🚪', 'Total Rooms')}
          ${statCardSkeleton('available', '✅', 'Available Rooms')}
          ${statCardSkeleton('guests', '🧳', 'Guests')}
          ${statCardSkeleton('reservation', '📅', 'Reservations')}
          ${statCardSkeleton('employees', '👔', 'Employees')}
          ${statCardSkeleton('revenue', '💰', 'Total Revenue')}
        </div>

        <div class="chart-grid">
          <div class="chart-card">
            <h3>Room Status Distribution</h3>
            <div class="chart-holder"><canvas id="chart-room-status"></canvas></div>
          </div>
          <div class="chart-card">
            <h3>Reservation Status</h3>
            <div class="chart-holder"><canvas id="chart-reservation-status"></canvas></div>
          </div>
          <div class="chart-card chart-card--wide">
            <h3>Payments Collected by Method</h3>
            <div class="chart-holder"><canvas id="chart-payment-method"></canvas></div>
          </div>
          <div class="chart-card chart-card--wide">
            <h3>Employees per Department</h3>
            <div class="chart-holder"><canvas id="chart-employees-dept"></canvas></div>
          </div>
        </div>

        <div class="recent-card">
          <div class="recent-card__header">
            <h3>Recent Reservations</h3>
            <button class="btn btn--ghost btn--sm" id="dash-refresh">⟳ Refresh Now</button>
          </div>
          <div class="table-wrap">
            <table class="data-table" id="recent-table">
              <thead><tr><th>ID</th><th>Guest</th><th>Room</th><th>Check-In</th><th>Check-Out</th><th>Status</th></tr></thead>
              <tbody><tr><td colspan="6" class="table-loading">Loading…</td></tr></tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  function statCardSkeleton(key, icon, label) {
    return `<div class="stat-card">
      <div class="stat-card__icon">${icon}</div>
      <div>
        <p class="stat-card__value" id="stat-${key}">—</p>
        <p class="stat-card__label">${label}</p>
      </div>
    </div>`;
  }

  async function show() {
    isActive = true;
    content.innerHTML = template();
    document.getElementById('dash-refresh').addEventListener('click', () => load(true));
    await checkConnection();
    await load(dirty);
    startPolling();
  }

  function hide() {
    isActive = false;
    stopPolling();
  }

  function markDirty() {
    dirty = true;
    if (isActive) load(true);
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(() => { if (isActive) load(true); }, 30000);
  }
  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  async function checkConnection() {
    const ok = await Api.checkConnection();
    const dot = document.getElementById('conn-dot');
    const label = document.getElementById('conn-label');
    if (!dot || !label) return;
    dot.classList.toggle('pulse-dot--online', ok);
    dot.classList.toggle('pulse-dot--offline', !ok);
    label.textContent = ok ? 'Live · connected to API' : `Offline · cannot reach ${API_BASE}`;
  }

  async function load(force = false) {
    if (!isActive) return;
    dirty = false;
    await checkConnection();

    const keys = ['hotels', 'branches', 'rooms', 'guests', 'reservation', 'employees', 'departments', 'payments'];
    const results = {};
    await Promise.all(keys.map(async k => {
      try { results[k] = await Api.list(k, { force }); }
      catch (_) { results[k] = []; }
    }));

    renderStats(results);
    safeRender(() => renderRoomStatusChart(results.rooms), 'chart-room-status');
    safeRender(() => renderReservationStatusChart(results.reservation), 'chart-reservation-status');
    safeRender(() => renderPaymentMethodChart(results.payments), 'chart-payment-method');
    safeRender(() => renderEmployeeDeptChart(results.employees), 'chart-employees-dept');
    renderRecentReservations(results.reservation);
  }

  // Runs a chart-render function in isolation: if Chart.js failed to load,
  // or any single dataset causes an error, we show a friendly message in
  // that one card instead of throwing and freezing the rest of the
  // dashboard (stats + recent reservations must always finish rendering).
  function safeRender(fn, canvasId) {
    try {
      if (typeof Chart === 'undefined') throw new Error('Chart.js did not load');
      fn();
    } catch (err) {
      console.error(`Dashboard chart error (${canvasId}):`, err);
      const canvas = document.getElementById(canvasId);
      const holder = canvas ? canvas.closest('.chart-holder') : null;
      if (holder) {
        holder.innerHTML = `<p class="chart-error">⚠ Couldn't render this chart (${err.message}).</p>`;
      }
    }
  }

  function setStat(key, value) {
    const el = document.getElementById(`stat-${key}`);
    if (el) el.textContent = value;
  }

  function renderStats(r) {
    setStat('hotels', r.hotels.length);
    setStat('branches', r.branches.length);
    setStat('rooms', r.rooms.length);
    setStat('available', r.rooms.filter(x => x.status === 'Available').length);
    setStat('guests', r.guests.length);
    setStat('reservation', r.reservation.length);
    setStat('employees', r.employees.length);
    const revenue = r.payments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
    setStat('revenue', UI.fmtMoney(revenue));
  }

  function groupCount(rows, field) {
    const map = {};
    rows.forEach(r => {
      const v = r[field] || 'Unknown';
      map[v] = (map[v] || 0) + 1;
    });
    return map;
  }

  function destroyChart(id) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
  }

  function renderRoomStatusChart(rooms) {
    const canvas = document.getElementById('chart-room-status');
    if (!canvas) return;
    const grouped = groupCount(rooms, 'status');
    destroyChart('room-status');
    charts['room-status'] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: Object.keys(grouped),
        datasets: [{ data: Object.values(grouped), backgroundColor: PALETTE, borderWidth: 0 }],
      },
      options: chartOptions('doughnut'),
    });
  }

  function renderReservationStatusChart(reservations) {
    const canvas = document.getElementById('chart-reservation-status');
    if (!canvas) return;
    const grouped = groupCount(reservations, 'reservation_status');
    destroyChart('reservation-status');
    charts['reservation-status'] = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: Object.keys(grouped),
        datasets: [{ data: Object.values(grouped), backgroundColor: PALETTE, borderWidth: 0 }],
      },
      options: chartOptions('pie'),
    });
  }

  function renderPaymentMethodChart(payments) {
    const canvas = document.getElementById('chart-payment-method');
    if (!canvas) return;
    const map = {};
    payments.forEach(p => {
      const method = p.payment_method || 'Unknown';
      map[method] = (map[method] || 0) + (Number(p.amount_paid) || 0);
    });
    destroyChart('payment-method');
    charts['payment-method'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: Object.keys(map),
        datasets: [{ label: 'Revenue ($)', data: Object.values(map), backgroundColor: '#B8873C', borderRadius: 6, maxBarThickness: 46 }],
      },
      options: barOptions(),
    });
  }

  function renderEmployeeDeptChart(employees) {
    const canvas = document.getElementById('chart-employees-dept');
    if (!canvas) return;
    const grouped = groupCount(employees, 'department_name');
    destroyChart('employees-dept');
    charts['employees-dept'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: Object.keys(grouped),
        datasets: [{ label: 'Employees', data: Object.values(grouped), backgroundColor: '#3B6E91', borderRadius: 6, maxBarThickness: 46 }],
      },
      options: barOptions(),
    });
  }

  function chartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#3A342C', font: { family: 'Inter', size: 12 }, padding: 14 } },
      },
    };
  }

  function barOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#6B6255' } },
        y: { beginAtZero: true, grid: { color: '#EDE7D9' }, ticks: { color: '#6B6255' } },
      },
    };
  }

  function renderRecentReservations(reservations) {
    const tbody = document.querySelector('#recent-table tbody');
    if (!tbody) return;
    const recent = [...reservations].sort((a, b) => b.reservation_id - a.reservation_id).slice(0, 8);
    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No reservations yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = recent.map(r => `
      <tr>
        <td class="cell-mono">${r.reservation_id}</td>
        <td>${UI.escapeHtml(`${r.first_name} ${r.last_name}`)}</td>
        <td class="cell-mono">${UI.escapeHtml(r.room_number)}</td>
        <td>${UI.fmtDate(r.check_in)}</td>
        <td>${UI.fmtDate(r.check_out)}</td>
        <td><span class="badge">${UI.escapeHtml(r.reservation_status || '—')}</span></td>
      </tr>
    `).join('');
  }

  return { show, hide, markDirty };
})();
