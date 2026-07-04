/* =========================================================================
   RENDER.JS
   Generic engine that turns a MODULES[key] config into:
     - a searchable / filterable data table
     - an Add / Edit modal form (with FK dropdowns resolved live)
     - delete confirmation + toast feedback
   Every table CRUD action calls back into Dashboard.markDirty() so the
   live dashboard reflects the change immediately.
   ========================================================================= */

const UI = (() => {
  const content = document.getElementById('app-content');
  let currentModule = null;
  let currentRows = [];
  let editingId = null;

  /* ---------------------------------------------------------- helpers -- */

  function fmtMoney(v) {
    if (v === null || v === undefined || v === '') return '—';
    const n = Number(v);
    return isNaN(n) ? v : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function fmtDate(v) {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d)) return v;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function fmtDateTime(v) {
    if (!v) return '—';
    const d = new Date(v);
    if (isNaN(d)) return v;
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function cellValue(col, row) {
    let val = row[col.key];
    if (col.combineWith) {
      val = `${row[col.key] ?? ''} ${row[col.combineWith] ?? ''}`.trim();
    }
    if (val === null || val === undefined || val === '') return '—';
    if (col.format === 'currency') return fmtMoney(row[col.key]);
    if (col.format === 'date') return fmtDate(row[col.key]);
    if (col.format === 'datetime') return fmtDateTime(row[col.key]);
    return String(val);
  }

  function badgeClass(value) {
    const v = String(value).toLowerCase();
    if (['available', 'confirmed', 'completed', 'paid', 'active', 'resolved'].includes(v)) return 'badge badge--good';
    if (['occupied', 'in progress', 'pending'].includes(v)) return 'badge badge--warn';
    if (['maintenance', 'cancelled', 'failed', 'inactive', 'reported', 'cleaning'].includes(v)) return 'badge badge--bad';
    return 'badge';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.innerHTML = `<span>${escapeHtml(message)}</span>`;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast--show'));
    setTimeout(() => {
      el.classList.remove('toast--show');
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  /* ------------------------------------------------------- module view -- */

  async function showModule(moduleKey) {
    currentModule = moduleKey;
    const cfg = MODULES[moduleKey];

    content.innerHTML = `
      <section class="module">
        <header class="module__header">
          <div class="module__title">
            <span class="module__icon">${cfg.icon}</span>
            <div>
              <h1>${cfg.label}</h1>
              <p class="module__count" id="module-count">Loading…</p>
            </div>
          </div>
          <button class="btn btn--primary" id="btn-add">+ Add ${singular(cfg.label)}</button>
        </header>

        <div class="module__toolbar">
          <div class="search-box">
            <span class="search-box__icon">⌕</span>
            <input type="text" id="module-search" placeholder="Search ${cfg.label.toLowerCase()}…" />
          </div>
          ${cfg.filterField ? `<select id="module-filter"><option value="">All statuses</option></select>` : ''}
          <button class="btn btn--ghost" id="btn-refresh" title="Refresh data">⟳ Refresh</button>
        </div>

        <div class="table-wrap">
          <table class="data-table" id="data-table">
            <thead>
              <tr>${cfg.columns.map(c => `<th>${c.label}</th>`).join('')}<th class="col-actions">Actions</th></tr>
            </thead>
            <tbody id="table-body">
              <tr><td colspan="${cfg.columns.length + 1}" class="table-loading">Loading data from API…</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    `;

    document.getElementById('btn-add').addEventListener('click', () => openForm(moduleKey, null));
    document.getElementById('btn-refresh').addEventListener('click', () => loadAndRender(moduleKey, true));
    document.getElementById('module-search').addEventListener('input', (e) => renderTable(filterRows(e.target.value, getFilterValue())));
    if (cfg.filterField) {
      document.getElementById('module-filter').addEventListener('change', () => renderTable(filterRows(getSearchValue(), getFilterValue())));
    }

    await loadAndRender(moduleKey);
  }

  function singular(label) {
    if (label.endsWith('ies')) return label.slice(0, -3) + 'y';
    if (label.endsWith('s')) return label.slice(0, -1);
    return label;
  }

  function getSearchValue() {
    const el = document.getElementById('module-search');
    return el ? el.value : '';
  }
  function getFilterValue() {
    const el = document.getElementById('module-filter');
    return el ? el.value : '';
  }

  async function loadAndRender(moduleKey, force = false) {
    const cfg = MODULES[moduleKey];
    try {
      currentRows = await Api.list(moduleKey, { force });
      populateFilterOptions(cfg);
      renderTable(filterRows(getSearchValue(), getFilterValue()));
      document.getElementById('module-count').textContent = `${currentRows.length} record${currentRows.length === 1 ? '' : 's'}`;
    } catch (err) {
      document.getElementById('table-body').innerHTML =
        `<tr><td colspan="${cfg.columns.length + 1}" class="table-error">⚠ Could not load data — ${escapeHtml(err.message)}. Is the backend running on ${API_BASE}?</td></tr>`;
      document.getElementById('module-count').textContent = 'Connection error';
    }
  }

  function populateFilterOptions(cfg) {
    if (!cfg.filterField) return;
    const select = document.getElementById('module-filter');
    const current = select.value;
    const values = [...new Set(currentRows.map(r => r[cfg.filterField]).filter(Boolean))].sort();
    select.innerHTML = `<option value="">All statuses</option>` + values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
    select.value = current;
  }

  function filterRows(search, filterVal) {
    const cfg = MODULES[currentModule];
    let rows = currentRows;
    if (filterVal && cfg.filterField) {
      rows = rows.filter(r => r[cfg.filterField] === filterVal);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r => cfg.columns.some(c => {
        const v = cellValue(c, r);
        return String(v).toLowerCase().includes(q);
      }));
    }
    return rows;
  }

  function renderTable(rows) {
    const cfg = MODULES[currentModule];
    const tbody = document.getElementById('table-body');
    if (!tbody) return;

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${cfg.columns.length + 1}" class="table-empty">No records match. Try clearing your search or add a new ${singular(cfg.label).toLowerCase()}.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map(row => {
      const cells = cfg.columns.map(c => {
        const val = cellValue(c, row);
        const cls = c.mono ? 'cell-mono' : '';
        if (c.badge && val !== '—') {
          return `<td class="${cls}"><span class="${badgeClass(val)}">${escapeHtml(val)}</span></td>`;
        }
        return `<td class="${cls}">${escapeHtml(val)}</td>`;
      }).join('');
      const id = row[cfg.idKey];
      return `<tr>
        ${cells}
        <td class="col-actions">
          <button class="icon-btn" data-action="edit" data-id="${id}" title="Edit">✎</button>
          <button class="icon-btn icon-btn--danger" data-action="delete" data-id="${id}" title="Delete">🗑</button>
        </td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => openForm(currentModule, findRow(btn.dataset.id)));
    });
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => confirmDelete(currentModule, btn.dataset.id));
    });
  }

  function findRow(id) {
    const cfg = MODULES[currentModule];
    return currentRows.find(r => String(r[cfg.idKey]) === String(id));
  }

  /* ------------------------------------------------------ delete flow -- */

  async function confirmDelete(moduleKey, id) {
    const cfg = MODULES[moduleKey];
    if (!confirm(`Delete this ${singular(cfg.label).toLowerCase()} (ID ${id})? This cannot be undone.`)) return;
    try {
      await Api.remove(moduleKey, id);
      toast(`${singular(cfg.label)} deleted successfully.`, 'success');
      await loadAndRender(moduleKey, true);
      Dashboard.markDirty();
    } catch (err) {
      toast(`Delete failed: ${err.message}`, 'error');
    }
  }

  /* -------------------------------------------------------- form modal -- */

  async function openForm(moduleKey, existingRow) {
    const cfg = MODULES[moduleKey];
    editingId = existingRow ? existingRow[cfg.idKey] : null;

    const backdrop = document.getElementById('modal-backdrop');
    const modal = document.getElementById('modal');
    modal.innerHTML = `
      <div class="modal__header">
        <h2>${editingId ? 'Edit' : 'Add'} ${singular(cfg.label)}</h2>
        <button class="modal__close" id="modal-close">✕</button>
      </div>
      <form class="modal__body" id="entity-form"></form>
      <div class="modal__footer">
        <button type="button" class="btn btn--ghost" id="modal-cancel">Cancel</button>
        <button type="submit" form="entity-form" class="btn btn--primary" id="modal-save">${editingId ? 'Save Changes' : 'Create'}</button>
      </div>
    `;
    backdrop.classList.add('is-open');
    document.getElementById('modal-close').addEventListener('click', closeForm);
    document.getElementById('modal-cancel').addEventListener('click', closeForm);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeForm(); }, { once: true });

    const formEl = document.getElementById('entity-form');
    formEl.innerHTML = `<p class="form-loading">Loading form fields…</p>`;

    // Preload any reference module data needed for select dropdowns
    const refData = {};
    for (const field of cfg.fields) {
      if (field.type === 'select' && field.ref) {
        try {
          refData[field.name] = await Api.list(field.ref);
        } catch (_) {
          refData[field.name] = [];
        }
      }
    }

    formEl.innerHTML = cfg.fields.map(field => buildField(field, existingRow, refData)).join('');

    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitForm(moduleKey, cfg, formEl);
    });
  }

  function buildField(field, existingRow, refData) {
    const value = existingRow ? (existingRow[field.name] ?? '') : '';
    const req = field.required ? 'required' : '';
    const id = `f-${field.name}`;

    if (field.type === 'textarea') {
      return `<div class="field field--wide">
        <label for="${id}">${field.label}${field.required ? ' *' : ''}</label>
        <textarea id="${id}" name="${field.name}" ${req} rows="3" placeholder="${escapeHtml(field.placeholder || '')}">${escapeHtml(value)}</textarea>
      </div>`;
    }

    if (field.type === 'select') {
      let options = '';
      if (field.ref) {
        const rows = refData[field.name] || [];
        const refModule = MODULES[field.ref];
        options = rows.map(r => {
          const optId = r[refModule.idKey];
          const label = field.refLabel(r);
          const selected = String(optId) === String(value) ? 'selected' : '';
          return `<option value="${optId}" ${selected}>${escapeHtml(label)}</option>`;
        }).join('');
      } else if (field.options) {
        options = field.options.map(opt => {
          const selected = opt === value ? 'selected' : '';
          return `<option value="${opt}" ${selected}>${opt}</option>`;
        }).join('');
      }
      return `<div class="field">
        <label for="${id}">${field.label}${field.required ? ' *' : ''}</label>
        <select id="${id}" name="${field.name}" ${req}>
          <option value="">${field.required ? 'Select…' : '— None —'}</option>
          ${options}
        </select>
      </div>`;
    }

    let inputValue = value;
    if (field.type === 'datetime-local') inputValue = toDatetimeLocal(value);
    else if (field.type === 'date') inputValue = toDateOnly(value);

    return `<div class="field">
      <label for="${id}">${field.label}${field.required ? ' *' : ''}</label>
      <input type="${field.type}" id="${id}" name="${field.name}" ${req}
        ${field.step ? `step="${field.step}"` : ''}
        placeholder="${escapeHtml(field.placeholder || '')}"
        value="${escapeHtml(inputValue)}" />
    </div>`;
  }

  // Postgres DATE/TIMESTAMP columns come back as full ISO strings
  // (e.g. "2026-01-15T00:00:00.000Z"); native date/datetime-local inputs
  // need them trimmed to their exact expected format.
  function toDatetimeLocal(value) {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d)) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function toDateOnly(value) {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    const d = new Date(value);
    if (isNaN(d)) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function closeForm() {
    document.getElementById('modal-backdrop').classList.remove('is-open');
    editingId = null;
  }

  async function submitForm(moduleKey, cfg, formEl) {
    const saveBtn = document.getElementById('modal-save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    const payload = {};
    cfg.fields.forEach(field => {
      const raw = formEl.elements[field.name].value;
      if (field.type === 'number') {
        payload[field.name] = raw === '' ? null : Number(raw);
      } else {
        payload[field.name] = raw === '' ? null : raw;
      }
    });

    try {
      if (editingId) {
        await Api.update(moduleKey, editingId, payload);
        toast(`${singular(cfg.label)} updated successfully.`, 'success');
      } else {
        await Api.create(moduleKey, payload);
        toast(`${singular(cfg.label)} created successfully.`, 'success');
      }
      closeForm();
      await loadAndRender(moduleKey, true);
      Dashboard.markDirty();
    } catch (err) {
      toast(`Save failed: ${err.message}`, 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = editingId ? 'Save Changes' : 'Create';
    }
  }

  return { showModule, toast, fmtMoney, fmtDate, fmtDateTime, escapeHtml };
})();
