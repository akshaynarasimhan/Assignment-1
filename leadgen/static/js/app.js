/* ============================================================
   Lead Generation Engine — Frontend JS
   Pure vanilla JS, no framework dependencies.
   ============================================================ */

'use strict';

// ── Utilities ──────────────────────────────────────────────────────────────

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function seniority_badge(seniority) {
  const map = {
    'C-Suite':     ['badge-csuite',  'C-Suite'],
    'President/MD':['badge-pmd',     'President/MD'],
    'SVP/EVP':     ['badge-svp',     'SVP/EVP'],
    'Head-Level':  ['badge-head',    'Head-Level'],
    'Founder':     ['badge-founder', 'Founder'],
  };
  const [cls, label] = map[seniority] || ['badge-fn', seniority || '—'];
  return `<span class="badge ${cls}">${escHtml(label)}</span>`;
}

function fn_badge(fn) {
  return `<span class="badge badge-fn" title="${escHtml(fn)}">${escHtml(fn?.split(' & ')[0] || '—')}</span>`;
}

function li_link(url) {
  if (!url) return '—';
  return `<a href="${escHtml(url)}" target="_blank" rel="noopener" class="li-link">🔗 LinkedIn</a>`;
}

function build_table_row(lead) {
  return `
    <tr>
      <td title="${escHtml(lead.name)}">${escHtml(lead.name)}</td>
      <td title="${escHtml(lead.title)}">${escHtml(lead.title)}</td>
      <td title="${escHtml(lead.company)}">${escHtml(lead.company)}</td>
      <td>${escHtml(lead.country || 'India')}</td>
      <td>${seniority_badge(lead.seniority)}</td>
      <td>${fn_badge(lead.function)}</td>
      <td>${li_link(lead.linkedin_url)}</td>
      <td>${escHtml(lead.email || '—')}</td>
    </tr>`;
}

const TABLE_HEADER = `
  <thead>
    <tr>
      <th>Name</th><th>Title</th><th>Company</th><th>Country</th>
      <th>Seniority</th><th>Function</th><th>LinkedIn</th><th>Email</th>
    </tr>
  </thead>`;


// ── Tab switching ──────────────────────────────────────────────────────────

$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    $$('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $(`#panel-${btn.dataset.tab}`).classList.add('active');
  });
});


// ── Generic SSE runner ────────────────────────────────────────────────────

function runSse(url, method, body, callbacks) {
  /*
   * FastAPI SSE with POST:  we use fetch + ReadableStream manually,
   * because EventSource only supports GET.
   */
  const { onProgress, onResult, onError, onDone } = callbacks;

  const opts = { method, headers: {} };
  if (body instanceof FormData) {
    opts.body = body;
  } else if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  fetch(url, opts).then(async resp => {
    if (!resp.ok) {
      const msg = await resp.text().catch(() => resp.statusText);
      let detail = msg;
      try { detail = JSON.parse(msg).detail || msg; } catch (_) {}
      onError(`HTTP ${resp.status}: ${detail}`);
      onDone();
      return;
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) { onDone(); break; }
      buf += decoder.decode(value, { stream: true });

      const lines = buf.split('\n\n');
      buf = lines.pop();  // last fragment (may be incomplete)

      for (const block of lines) {
        let eventType = 'message', dataStr = '';
        for (const line of block.split('\n')) {
          if (line.startsWith('event: '))  eventType = line.slice(7).trim();
          if (line.startsWith('data: '))   dataStr   = line.slice(6).trim();
        }
        if (!dataStr) continue;
        let payload;
        try { payload = JSON.parse(dataStr); } catch (_) { continue; }

        if (payload.type === 'progress') onProgress(payload);
        else if (payload.type === 'result') onResult(payload);
        else if (payload.type === 'error') onError(payload.message || 'Unknown error');
        else if (payload.type === 'done') { onDone(payload); break; }
      }
    }
  }).catch(err => {
    onError(String(err));
    onDone();
  });
}


// ── Progress UI helpers ───────────────────────────────────────────────────

function ProgressUi(progressSection, progressBar, logEl, errorBanner) {
  return {
    reset() {
      progressSection.classList.remove('visible');
      logEl.innerHTML = '';
      errorBanner.classList.remove('visible');
      errorBanner.textContent = '';
      progressBar.style.width = '0%';
    },
    start() { progressSection.classList.add('visible'); },
    log(msg, cls = '') {
      const line = document.createElement('div');
      line.className = `log-line ${cls}`;
      line.textContent = msg;
      logEl.appendChild(line);
      logEl.scrollTop = logEl.scrollHeight;
    },
    setPercent(pct) { progressBar.style.width = `${Math.min(pct ?? 0, 100)}%`; },
    error(msg) {
      errorBanner.textContent = `Error: ${msg}`;
      errorBanner.classList.add('visible');
      this.log(`ERROR: ${msg}`, 'log-error');
    },
    done(msg) { this.log(msg || 'Done.', 'log-done'); },
  };
}


// ── Results UI helpers ────────────────────────────────────────────────────

function ResultsUi(section, countEl, tbodyEl, exportState) {
  let leads = [];

  return {
    reset() {
      leads = [];
      section.classList.remove('visible');
      tbodyEl.innerHTML = '';
      countEl.innerHTML = 'Found <span>0</span> leaders';
      exportState.leads = [];
    },
    show() { section.classList.add('visible'); },
    add(lead) {
      leads.push(lead);
      exportState.leads.push(lead);
      tbodyEl.insertAdjacentHTML('beforeend', build_table_row(lead));
      countEl.innerHTML = `Found <span>${leads.length}</span> leader${leads.length !== 1 ? 's' : ''}`;
      this.show();
    },
    count() { return leads.length; },
  };
}


// ─────────────────────────────────────────────────────────────────────────────
//  TAB 1 — OPEN SEARCH
// ─────────────────────────────────────────────────────────────────────────────

(function initOpenSearch() {
  const form        = $('#open-search-form');
  const btn         = $('#open-search-btn');
  const progressSec = $('#open-progress-section');
  const progressBar = $('#open-progress-bar');
  const logEl       = $('#open-log');
  const errorBanner = $('#open-error');
  const resultsSec  = $('#open-results-section');
  const countEl     = $('#open-count');
  const tbodyEl     = $('#open-tbody');

  const exportState = { leads: [] };
  const progress = ProgressUi(progressSec, progressBar, logEl, errorBanner);
  const results  = ResultsUi(resultsSec, countEl, tbodyEl, exportState);

  // Build table
  tbodyEl.closest('.table-wrap').querySelector('table').insertAdjacentHTML('afterbegin', TABLE_HEADER);

  form.addEventListener('submit', e => {
    e.preventDefault();
    progress.reset();
    results.reset();
    btn.disabled = true;
    progress.start();

    const country  = $('#open-country').value;
    const seniority = $('#open-seniority').value || '';
    const fn       = $('#open-function').value || '';
    const maxR     = $('#open-max').value || 50;

    const params = new URLSearchParams({ country, max_results: maxR });
    if (seniority) params.append('seniority', seniority);
    if (fn)        params.append('function', fn);

    runSse(`/api/search/open?${params}`, 'GET', null, {
      onProgress(p) {
        progress.log(p.message);
        progress.setPercent(p.percent);
      },
      onResult(p) {
        if (p.data) results.add(p.data);
      },
      onError(msg) { progress.error(msg); },
      onDone(p) {
        btn.disabled = false;
        progress.done(p?.message || `Complete — ${results.count()} leaders found.`);
        progress.setPercent(100);
      },
    });
  });

  // Export buttons
  $('#open-export-csv').addEventListener('click', () => exportLeads(exportState.leads, 'csv'));
  $('#open-export-xlsx').addEventListener('click', () => exportLeads(exportState.leads, 'xlsx'));
})();


// ─────────────────────────────────────────────────────────────────────────────
//  TAB 2 — COMPANY SEARCH
// ─────────────────────────────────────────────────────────────────────────────

(function initCompanySearch() {
  const form        = $('#company-search-form');
  const btn         = $('#company-search-btn');
  const progressSec = $('#company-progress-section');
  const progressBar = $('#company-progress-bar');
  const logEl       = $('#company-log');
  const errorBanner = $('#company-error');
  const resultsSec  = $('#company-results-section');
  const countEl     = $('#company-count');
  const tbodyEl     = $('#company-tbody');

  const exportState = { leads: [] };
  const progress = ProgressUi(progressSec, progressBar, logEl, errorBanner);
  const results  = ResultsUi(resultsSec, countEl, tbodyEl, exportState);

  tbodyEl.closest('.table-wrap').querySelector('table').insertAdjacentHTML('afterbegin', TABLE_HEADER);

  form.addEventListener('submit', e => {
    e.preventDefault();
    progress.reset();
    results.reset();
    btn.disabled = true;
    progress.start();

    const payload = {
      company_name: $('#company-name').value.trim(),
      domain: $('#company-domain').value.trim() || null,
      leadership_url: $('#company-leadership-url').value.trim() || null,
      max_results: parseInt($('#company-max').value) || 100,
    };

    runSse('/api/search/company', 'POST', payload, {
      onProgress(p) {
        progress.log(p.message);
        progress.setPercent(p.percent);
      },
      onResult(p) {
        if (p.data) results.add(p.data);
      },
      onError(msg) { progress.error(msg); },
      onDone(p) {
        btn.disabled = false;
        progress.done(p?.message || `Complete — ${results.count()} leaders found.`);
        progress.setPercent(100);
      },
    });
  });

  $('#company-export-csv').addEventListener('click', () => exportLeads(exportState.leads, 'csv'));
  $('#company-export-xlsx').addEventListener('click', () => exportLeads(exportState.leads, 'xlsx'));
})();


// ─────────────────────────────────────────────────────────────────────────────
//  TAB 3 — BULK UPLOAD
// ─────────────────────────────────────────────────────────────────────────────

(function initBulkUpload() {
  const uploadArea  = $('#upload-area');
  const fileInput   = $('#file-input');
  const uploadedName = $('#uploaded-filename');
  const btn         = $('#bulk-search-btn');
  const progressSec = $('#bulk-progress-section');
  const progressBar = $('#bulk-progress-bar');
  const logEl       = $('#bulk-log');
  const errorBanner = $('#bulk-error');
  const resultsSec  = $('#bulk-results-section');
  const countEl     = $('#bulk-count');
  const tbodyEl     = $('#bulk-tbody');
  const statusTbody = $('#bulk-status-tbody');

  const exportState = { leads: [] };
  const progress = ProgressUi(progressSec, progressBar, logEl, errorBanner);
  const results  = ResultsUi(resultsSec, countEl, tbodyEl, exportState);

  tbodyEl.closest('.table-wrap').querySelector('table').insertAdjacentHTML('afterbegin', TABLE_HEADER);

  let uploadedFile = null;

  uploadArea.addEventListener('click', () => fileInput.click());
  uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) setFile(fileInput.files[0]);
  });

  function setFile(f) {
    uploadedFile = f;
    uploadedName.textContent = f.name;
    btn.disabled = false;
  }

  btn.addEventListener('click', () => {
    if (!uploadedFile) return;
    progress.reset();
    results.reset();
    statusTbody.innerHTML = '';
    btn.disabled = true;
    progress.start();
    progressSec.classList.add('visible');

    const fd = new FormData();
    fd.append('file', uploadedFile);

    runSse('/api/search/bulk', 'POST', fd, {
      onProgress(p) {
        progress.log(p.message);
        progress.setPercent(p.percent);
        if (p.data && 'row_index' in p.data) {
          updateBulkStatusRow(p.data);
        }
      },
      onResult(p) {
        if (p.data) results.add(p.data);
      },
      onError(msg) { progress.error(msg); },
      onDone(p) {
        btn.disabled = false;
        progress.done(p?.message || `Done — ${results.count()} leaders found.`);
        progress.setPercent(100);
      },
    });
  });

  function updateBulkStatusRow(data) {
    const { row_index, company, status, count } = data;
    let row = $(`#bulk-row-${row_index}`, statusTbody);
    if (!row) {
      row = document.createElement('tr');
      row.id = `bulk-row-${row_index}`;
      row.innerHTML = `<td>${escHtml(company)}</td><td class="status-cell"></td><td class="count-cell">—</td>`;
      statusTbody.appendChild(row);
    }
    const statusCell = $('.status-cell', row);
    const countCell = $('.count-cell', row);
    const classes = { pending: 'status-pending', processing: 'status-processing', done: 'status-done', error: 'status-error' };
    statusCell.innerHTML = `<span class="status-pill ${classes[status] || ''}">${status}</span>`;
    if (count != null) countCell.textContent = count;
  }

  $('#bulk-export-csv').addEventListener('click', () => exportLeads(exportState.leads, 'csv'));
  $('#bulk-export-xlsx').addEventListener('click', () => exportLeads(exportState.leads, 'xlsx'));
})();


// ─────────────────────────────────────────────────────────────────────────────
//  EXPORT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function exportLeads(leads, format) {
  if (!leads || leads.length === 0) {
    alert('No leads to export yet. Run a search first.');
    return;
  }
  if (format === 'csv') {
    downloadCsv(leads);
  } else {
    // Trigger server-side Excel export using current DB state
    window.location.href = '/api/export/excel';
  }
}

function downloadCsv(leads) {
  const fields = ['name', 'title', 'company', 'country', 'seniority', 'function', 'linkedin_url', 'email', 'source', 'confidence'];
  const header = fields.join(',');
  const rows = leads.map(l =>
    fields.map(f => {
      const v = String(l[f] ?? '');
      return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(',')
  );
  const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leads.csv';
  a.click();
}


// ─────────────────────────────────────────────────────────────────────────────
//  HEALTH CHECK & SOURCE STATUS
// ─────────────────────────────────────────────────────────────────────────────

async function loadHealth() {
  try {
    const resp = await fetch('/api/health');
    if (!resp.ok) return;
    const data = await resp.json();
    const grid = $('#source-status-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const [name, status] of Object.entries(data.sources || {})) {
      const active = status === 'active' || status === 'enabled';
      grid.insertAdjacentHTML('beforeend', `
        <div class="config-item">
          <div class="ci-dot ${active ? 'active' : 'inactive'}"></div>
          <div class="ci-name">${escHtml(name.replace(/_/g,' '))}</div>
          <div class="ci-status">${escHtml(status)}</div>
        </div>`);
    }
  } catch (_) {}
}

document.addEventListener('DOMContentLoaded', loadHealth);
