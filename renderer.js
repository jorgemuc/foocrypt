
let currentRows = [];
let headerKeys = [];
let chart;
let statusChart;
const { logPath, dataPath, importInfoPath, docsDir, ticketsPath } = window.paths;
let changeLog = [];
let lastImport = '';
let documents = [];
let tickets = [];
const csvUtils = window.csvUtils;

function ensureDocsDir() {
  try {
    if (!window.api.exists(docsDir)) {
      window.api.mkdir(docsDir);
    }
  } catch (err) {
    console.error('Failed to create uploads directory:', err);
  }
}

function loadDocuments() {
  try {
    documents = window.api.readdir(docsDir);
  } catch {
    documents = [];
  }
  updateDocList();
}

function updateDocList() {
  const ul = document.getElementById('docList');
  if (!ul) return;
  ul.innerHTML = '';
  documents.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    ul.appendChild(li);
  });
}

function loadTickets() {
  try {
    if (window.api.exists(ticketsPath)) {
      tickets = JSON.parse(window.api.readFile(ticketsPath));
    }
  } catch {
    tickets = [];
  }
  renderTickets();
}

function saveTickets() {
  try {
    window.api.writeFile(ticketsPath, JSON.stringify(tickets, null, 2));
  } catch {}
}

function renderTickets() {
  const ul = document.getElementById('ticketList');
  if (!ul) return;
  ul.innerHTML = '';
  tickets.forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${t.time.split('T')[0]}: ${t.subject} (${t.status})`;
    ul.appendChild(li);
  });
}

function addTicket() {
  const subject = prompt('Subject');
  if (!subject) return;
  const note = prompt('Note') || '';
  const ticket = { time: new Date().toISOString(), subject, note, status: 'open' };
  tickets.push(ticket);
  renderTickets();
  saveTickets();
  logChange(-1, 'ticket', '', JSON.stringify(ticket));
}

function normalizeKey(k) {
  return k ? k.toString().trim().toLowerCase().replace(/\s+/g, '') : '';
}

function hasPartnerColumn(row) {
  if (!row) return false;
  return Object.keys(row).some(k => normalizeKey(k).includes('partner'));
}

function hasSystemColumn(row) {
  if (!row) return false;
  return Object.keys(row).some(k => normalizeKey(k).includes('system'));
}

function validateColumns(row) {
  if (!hasPartnerColumn(row)) {
    console.error('Missing Partner column', Object.keys(row));
    showToast('CSV not compatible: Partner column missing');
    return false;
  }
  if (!hasSystemColumn(row)) {
    console.error('Missing System column', Object.keys(row));
    showToast('CSV not compatible: System column missing');
    return false;
  }
  return true;
}

function updateFilterOptions(rows) {
  const select = document.getElementById('filter');
  if (!select) return;
  const key = rows.length
    ? Object.keys(rows[0]).find(k => k.toLowerCase().includes('partner')) ||
      Object.keys(rows[0])[0]
    : null;
  select.dataset.key = key || '';
  select.innerHTML = '<option value="">All</option>';
  if (!key) return;
  const values = [...new Set(rows.map(r => r[key]))];
  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
}

function applyFilters() {
  let rows = currentRows.slice();
  const select = document.getElementById("filter");
  const searchEl = document.getElementById("search");
  const filterVal = select ? select.value : "";
  const term = searchEl ? searchEl.value.toLowerCase() : "";
  if (filterVal) {
    const key = select ? select.dataset.key : null;
    if (key) rows = rows.filter(r => r[key] === filterVal);
  }
  if (term) {
    rows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(term));
  }
  if (rows.length) {
    renderTableHeader(rows[0]);
  } else if (headerKeys.length) {
    const dummy = {};
    headerKeys.forEach(k => (dummy[k] = ''));
    renderTableHeader(dummy);
  }
  updateChart(rows);
  updateStatusChart(rows);
  renderCards(rows);
  renderTable(rows);
  updateSummary(rows);
  updateKPIs(rows);
  updateDeadlineList(rows);
}
function updateSummary(rows) {
  const el = document.getElementById('summary');
  if (el) {
    el.textContent = rows.length ? `${rows.length} records` : 'No data loaded';
  }
}

function updateKPIs(rows) {
  const totalEl = document.getElementById('recordCountKpi');
  if (totalEl) totalEl.textContent = `Records: ${rows.length}`;

  const deadlineEl = document.getElementById('deadlineKpi');
  if (!deadlineEl) return;
  const key = Object.keys(rows[0] || {}).find(k => k.toLowerCase().includes('deadline'));
  if (!key) {
    deadlineEl.textContent = '';
    return;
  }
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const count = rows.filter(r => {
    const d = new Date(r[key]);
    return !isNaN(d) && d >= now && d <= soon;
  }).length;
  deadlineEl.textContent = `Deadlines ≤7d: ${count}`;
}

function updateDeadlineList(rows) {
  const list = document.getElementById('deadlineList');
  const section = document.getElementById('deadlineSection');
  if (!list || !section) return;
  list.innerHTML = '';
  const key = Object.keys(rows[0] || {}).find(k => k.toLowerCase().includes('deadline'));
  const nameKey = Object.keys(rows[0] || {}).find(k => k.toLowerCase().includes('partner'));
  if (!key || !nameKey) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';
  const now = new Date();
  const upcoming = rows
    .map(r => ({ name: r[nameKey], date: new Date(r[key]) }))
    .filter(r => !isNaN(r.date) && r.date >= now)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);
  if (upcoming.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No upcoming deadlines';
    list.appendChild(li);
  } else {
    upcoming.forEach(u => {
      const li = document.createElement('li');
      li.textContent = `${u.name}: ${u.date.toISOString().split('T')[0]}`;
      list.appendChild(li);
    });
  }
}

function updateImportDisplay() {
  const el = document.getElementById('lastImport');
  if (el) {
    el.textContent = lastImport ? `Last import: ${lastImport}` : '';
  }
}

function saveImportTime(time) {
  lastImport = time;
  updateImportDisplay();
  try {
    window.api.writeFile(importInfoPath, JSON.stringify({ lastImport: time }, null, 2));
  } catch (err) {
    console.error('Failed to save import info:', err);
  }
}

function loadImportTime() {
  try {
    if (window.api.exists(importInfoPath)) {
      const raw = window.api.readFile(importInfoPath);
      const info = JSON.parse(raw);
      if (info.lastImport) {
        lastImport = info.lastImport;
        updateImportDisplay();
      }
    }
  } catch (err) {
    console.error('Failed to load import info:', err);
  }
}

function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => {
    el.style.display = 'none';
  }, 3000);
}

function saveData(rows) {
  try {
    window.api.writeFile(dataPath, JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Failed to save data:', err);
  }
}

function saveLog() {
  try {
    window.api.writeFile(logPath, JSON.stringify(changeLog, null, 2));
  } catch (err) {
    console.error('Failed to save change log:', err);
  }
}

function loadLog() {
  try {
    if (window.api.exists(logPath)) {
      const raw = window.api.readFile(logPath);
      const logs = JSON.parse(raw);
      if (Array.isArray(logs)) changeLog = logs;
    }
  } catch (err) {
    console.error('Failed to load change log:', err);
  }
}

function loadData() {
  try {
    if (window.api.exists(dataPath)) {
      const raw = window.api.readFile(dataPath);
      const rows = JSON.parse(raw);
      if (Array.isArray(rows) && rows.length) {
        currentRows = rows;
        updateChart(currentRows);
        renderTable(currentRows);
        renderTableHeader(currentRows[0]);
        updateFilterOptions(currentRows);
        document.getElementById('filter').value = '';
        document.getElementById('search').value = '';
        applyFilters();
      }
    }
    loadImportTime();
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

function afterParse() {
  if (!currentRows.length) {
    showToast('No valid rows found');
    return;
  }
  const missing = csvUtils.getMissingColumns(currentRows[0]);
  if (missing.length) {
    currentRows = [];
    updateSummary(currentRows);
    updateKPIs(currentRows);
    renderTable([]);
    renderCards([]);
    updateFilterOptions([]);
    showToast('Missing required columns: ' + missing.join(', '));
    return;
  }
  console.log(`Parsed ${currentRows.length} rows`);
  console.log('First row:', JSON.stringify(currentRows[0]));
  renderTableHeader(currentRows[0]);
  updateFilterOptions(currentRows);
  document.getElementById('filter').value = '';
  document.getElementById('search').value = '';
  applyFilters();
  updateKPIs(currentRows);
  saveData(currentRows);
  saveImportTime(new Date().toISOString());
  showToast('Import completed');
  document.getElementById('dataTable').scrollIntoView();
}

function parseUploadedFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        currentRows = XLSX.utils.sheet_to_json(ws);
        afterParse();
      } catch (err) {
        console.error('Parse error:', err);
        showToast('Failed to parse file: ' + err.message);
      }
    };
    reader.onerror = (err) => {
      console.error('Read error:', err);
      showToast('Failed to read file');
    };
    reader.readAsArrayBuffer(file);
  } else {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimitersToGuess: [',', ';', '\t', '|'],
      complete: (results) => {
        currentRows = results.data.filter(r => Object.keys(r).length);
        afterParse();
      },
      error: (err) => {
        console.error('Parse error:', err);
        showToast('Failed to parse file: ' + err.message);
      }
    });
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  parseUploadedFile(file);
}

function updateChart(rows) {
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const labelKey = keys[0];
  let valueKey = keys.find(k => rows.some(r => !isNaN(parseFloat(r[k]))));
  if (!valueKey || valueKey === labelKey) valueKey = keys[1] || keys[0];
  const labels = rows.map(r => r[labelKey]);
  const values = rows.map(r => parseFloat(r[valueKey]) || 0);
  const ctx = document.getElementById('chart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Values', data: values, backgroundColor: 'rgba(75,192,192,0.5)' }]
    },
    options: { responsive: true }
  });
}

function updateStatusChart(rows) {
  const key = Object.keys(rows[0] || {}).find(k => k.toLowerCase().includes('status'));
  if (!key) return;
  const counts = {};
  rows.forEach(r => {
    const val = r[key] || 'Unknown';
    counts[val] = (counts[val] || 0) + 1;
  });
  const labels = Object.keys(counts);
  const values = Object.values(counts);
  const ctx = document.getElementById('statusChart').getContext('2d');
  if (statusChart) statusChart.destroy();
  statusChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: ['#36a2eb', '#ff6384', '#ffcd56', '#4bc0c0'] }]
    },
    options: { responsive: true }
  });
}

function renderTableHeader(row) {
  const thead = document.querySelector('#dataTable thead');
  thead.innerHTML = '';
  headerKeys = Object.keys(row);
  const tr = document.createElement('tr');
  Object.keys(row).forEach(k => {
    const th = document.createElement('th');
    th.textContent = k;
    tr.appendChild(th);
  });
  const actionTh = document.createElement('th');
  actionTh.textContent = 'Actions';
  tr.appendChild(actionTh);
  thead.appendChild(tr);
}

function renderTable(rows) {
  const tbody = document.querySelector('#dataTable tbody');
  tbody.innerHTML = '';
  if (rows.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.textContent = 'No data loaded';
    td.colSpan = headerKeys.length + 1;
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    Object.values(row).forEach(val => {
      const td = document.createElement('td');
      td.textContent = val;
      tr.appendChild(td);
    });
    const actionTd = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editRow(index));
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.style.marginLeft = '4px';
    delBtn.addEventListener('click', () => deleteRow(index));
    actionTd.appendChild(editBtn);
    actionTd.appendChild(delBtn);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });
}

function renderCards(rows) {
  const container = document.getElementById('cardContainer');
  if (!container) return;
  container.innerHTML = '';
  rows.forEach(row => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = Object.entries(row)
      .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
      .join('<br>');
    container.appendChild(div);
  });
}

function renderChangeLog() {
  const table = document.getElementById('changelogTable');
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  thead.innerHTML = '';
  tbody.innerHTML = '';
  const headerRow = document.createElement('tr');
  ['time', 'index', 'field', 'oldVal', 'newVal'].forEach(k => {
    const th = document.createElement('th');
    th.textContent = k;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  changeLog.forEach(log => {
    const tr = document.createElement('tr');
    ['time', 'index', 'field', 'oldVal', 'newVal'].forEach(k => {
      const td = document.createElement('td');
      td.textContent = log[k];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function logChange(index, field, oldVal, newVal) {
  changeLog.push({
    time: new Date().toISOString(),
    index,
    field,
    oldVal,
    newVal
  });
  saveLog();
}

function editRow(index) {
  const row = currentRows[index];
  for (const key of Object.keys(row)) {
    const val = prompt(`Edit ${key}`, row[key]);
    if (val === null) continue;
    if (val.trim() === '') {
      showToast('Value cannot be empty');
      continue;
    }
    if (val !== row[key]) {
      logChange(index, key, row[key], val);
      row[key] = val;
    }
  }
  saveData(currentRows);
  updateFilterOptions(currentRows);
  applyFilters();
}

function deleteRow(index) {
  const row = currentRows[index];
  if (!row) return;
  if (!confirm('Delete this row?')) return;
  logChange(index, '__deleted__', JSON.stringify(row), '');
  currentRows.splice(index, 1);
  saveData(currentRows);
  updateFilterOptions(currentRows);
  applyFilters();
}

function handleSearch() {
  applyFilters();
}

function exportCSV() {
  if (currentRows.length === 0) return;
  const csv = Papa.unparse(currentRows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'export.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function exportXLSX() {
  if (currentRows.length === 0) return;
  const buf = csvUtils.createXLSXBuffer(currentRows);
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'export.xlsx';
  link.click();
  URL.revokeObjectURL(url);
  showToast('Exported to export.xlsx');
}

function exportChangeLog() {
  if (changeLog.length === 0) return;
  const csv = Papa.unparse(changeLog);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'changelog.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
}

document.getElementById('csvFileInput').addEventListener('change', handleFileSelect);
document.getElementById('search').addEventListener('input', applyFilters);
document.getElementById('filter').addEventListener('change', applyFilters);
document.getElementById('exportBtn').addEventListener('click', exportCSV);
document.getElementById('exportXlsxBtn').addEventListener('click', exportXLSX);
document.getElementById('exportLogBtn').addEventListener('click', exportChangeLog);
document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
document.getElementById('navDashboard').addEventListener('click', () => {
  document.getElementById('changelogContainer').style.display = 'none';
  document.getElementById('cardContainer').style.display = 'none';
  document.getElementById('ticketSection').style.display = 'none';
});
document.getElementById('navCards').addEventListener('click', () => {
  document.getElementById('changelogContainer').style.display = 'none';
  document.getElementById('ticketSection').style.display = 'none';
  document.getElementById('cardContainer').style.display = 'block';
});
document.getElementById('navTickets').addEventListener('click', () => {
  document.getElementById('cardContainer').style.display = 'none';
  document.getElementById('changelogContainer').style.display = 'none';
  document.getElementById('ticketSection').style.display = 'block';
  renderTickets();
});
document.getElementById('navLog').addEventListener('click', () => {
  renderChangeLog();
  document.getElementById('changelogContainer').style.display = 'block';
  document.getElementById('cardContainer').style.display = 'none';
  document.getElementById('ticketSection').style.display = 'none';
});
document.getElementById('newTicketBtn').addEventListener('click', addTicket);
document.getElementById('uploadDocBtn').addEventListener('click', () => {
  document.getElementById('docInput').click();
});
document.getElementById('calendarBtn').addEventListener('click', () => {
  window.api.openExternal('https://calendar.google.com');
});
document.getElementById('contactBtn').addEventListener('click', () => {
  const subject = encodeURIComponent('Anfrage zum Partner Cockpit Dashboard');
  const body = encodeURIComponent('Hallo Team, ich habe eine Frage zum Partner Cockpit Dashboard: [hier Anliegen eintragen]\n\nViele Grüße,');
  window.api.openExternal(`mailto:support@partnerdashboard.com?subject=${subject}&body=${body}`);
});
document.getElementById('addTicketBtn').addEventListener('click', addTicket);
document.getElementById('docInput').addEventListener('change', (e) => {
  if (e.target.files.length) {
    ensureDocsDir();
    const file = e.target.files[0];
    const dest = `${docsDir}/${file.name}`;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        window.api.writeFileBuffer(dest, new Uint8Array(ev.target.result));
        showToast('Document uploaded: ' + file.name);
        documents.push(file.name);
        updateDocList();
      } catch (err) {
        console.error('Upload failed:', err);
        showToast('Upload failed');
      }
    };
    reader.onerror = () => {
      showToast('Failed to read file');
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }
});

document.addEventListener('dragover', (e) => { e.preventDefault(); });
document.addEventListener('drop', (e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) parseUploadedFile(file); });

document.getElementById('userDisplay').textContent = `User: ${window.api.userName()}`;

loadData();
loadLog();
updateSummary(currentRows);
updateKPIs(currentRows);
updateDeadlineList(currentRows);
updateImportDisplay();
ensureDocsDir();
loadDocuments();
loadTickets();
