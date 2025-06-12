const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { Chart } = require('chart.js');
const os = require('os');

let currentRows = [];
let chart;
let statusChart;

const logPath = path.join(__dirname, 'changelog.json');
let changeLog = [];

const dataPath = path.join(__dirname, 'data.json');
const importInfoPath = path.join(__dirname, 'import-info.json');
let lastImport = '';

function updateFilterOptions(rows) {
  const select = document.getElementById('filter');
  if (!select) return;
  const key = rows.length ? Object.keys(rows[0])[0] : null;
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
  const select = document.getElementById('filter');
  const searchEl = document.getElementById('search');
  const filterVal = select ? select.value : '';
  const term = searchEl ? searchEl.value.toLowerCase() : '';
  if (filterVal) {
    const key = currentRows.length ? Object.keys(currentRows[0])[0] : null;
    if (key) rows = rows.filter(r => r[key] === filterVal);
  }
  if (term) {
    rows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(term));
  }
  updateChart(rows);
  updateStatusChart(rows);
  renderTable(rows);
  updateSummary(rows);
  updateKPIs(rows);
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
    fs.writeFileSync(importInfoPath, JSON.stringify({ lastImport: time }, null, 2));
  } catch (err) {
    console.error('Failed to save import info:', err);
  }
}

function loadImportTime() {
  try {
    if (fs.existsSync(importInfoPath)) {
      const raw = fs.readFileSync(importInfoPath, 'utf8');
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
    fs.writeFileSync(dataPath, JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Failed to save data:', err);
  }
}

function saveLog() {
  try {
    fs.writeFileSync(logPath, JSON.stringify(changeLog, null, 2));
  } catch (err) {
    console.error('Failed to save change log:', err);
  }
}

function loadLog() {
  try {
    if (fs.existsSync(logPath)) {
      const raw = fs.readFileSync(logPath, 'utf8');
      const logs = JSON.parse(raw);
      if (Array.isArray(logs)) changeLog = logs;
    }
  } catch (err) {
    console.error('Failed to load change log:', err);
  }
}

function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf8');
      const rows = JSON.parse(raw);
      if (Array.isArray(rows) && rows.length) {
        currentRows = rows;
        updateChart(currentRows);
        renderTable(currentRows);
        renderTableHeader(currentRows[0]);
        updateFilterOptions(currentRows);
        applyFilters();
      }
    }
    loadImportTime();
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

function parseFile(file) {
  if (!file) return;
  Papa.parse(file, {
    header: true,
    complete: (results) => {
      currentRows = results.data.filter(r => Object.keys(r).length);
      if (currentRows.length === 0) return;
      renderTableHeader(currentRows[0]);
      updateFilterOptions(currentRows);
      applyFilters();
      updateKPIs(currentRows);
      saveData(currentRows);
      saveImportTime(new Date().toISOString());
      showToast('Import completed');
    }
  });
}

function handleFileSelect(event) {
  parseFile(event.target.files[0]);
}

function updateChart(rows) {
  const labels = rows.map(r => r[Object.keys(r)[0]]);
  const values = rows.map(r => parseFloat(r[Object.keys(r)[1]]) || 0);
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

document.getElementById('csvFileInput').addEventListener('change', handleFileSelect);
document.getElementById('search').addEventListener('input', applyFilters);
document.getElementById('filter').addEventListener('change', applyFilters);
document.getElementById('exportBtn').addEventListener('click', exportCSV);
document.getElementById('navDashboard').addEventListener('click', () => {
  document.getElementById('changelogContainer').style.display = 'none';
});
document.getElementById('navLog').addEventListener('click', () => {
  renderChangeLog();
  document.getElementById('changelogContainer').style.display = 'block';
});
document.getElementById('newTicketBtn').addEventListener('click', () => {
  alert('New ticket action triggered');
});

document.getElementById('uploadDocBtn').addEventListener('click', () => {
  document.getElementById('docInput').click();
});

document.getElementById('docInput').addEventListener('change', (e) => {
  if (e.target.files.length) {
    showToast('Document selected: ' + e.target.files[0].name);
    e.target.value = '';
  }
});

document.addEventListener('dragover', (e) => {
  e.preventDefault();
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  parseFile(file);
});

// Show current username
document.getElementById('userDisplay').textContent = `User: ${os.userInfo().username}`;

// Load persisted data on startup
loadData();
loadLog();
updateSummary(currentRows);
updateKPIs(currentRows);
updateImportDisplay();
