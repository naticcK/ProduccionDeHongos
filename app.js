// Simple SPA: store entries in localStorage, calculate totals and averages
const KEY = "produccion_hongos_entries";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function loadEntries() {
  const raw = localStorage.getItem(KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

function format(n) {
  return Number(n || 0).toFixed(2);
}

function recalc(entries) {
  const totalEntradas = entries.length;
  const totalPeso = entries.reduce((s,e)=>s + Number(e.peso||0),0);
  const totalBandejas = entries.reduce((s,e)=>s + Number(e.bandejas||0),0);
  const pesoPromedioPorBandeja = totalBandejas ? totalPeso / totalBandejas : 0;

  document.getElementById('totalEntradas').textContent = `Entradas: ${totalEntradas}`;
  document.getElementById('totalPeso').textContent = `Peso total: ${format(totalPeso)} kg`;
  document.getElementById('pesoPromedio').textContent = `Peso promedio por bandeja: ${format(pesoPromedioPorBandeja)} kg`;
}

function renderTable(entries) {
  const tbody = document.querySelector('#entriesTable tbody');
  tbody.innerHTML = '';
  entries.slice().reverse().forEach(entry => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${entry.fecha||''}</td>
      <td>${entry.lote||''}</td>
      <td>${entry.bandejas||''}</td>
      <td>${format(entry.peso)}</td>
      <td>${entry.humedad||''}</td>
      <td>${(entry.obs||'').slice(0,80)}</td>
      <td>
        <button class="action-btn" data-id="${entry.id}" data-action="edit">Editar</button>
        <button class="action-btn" data-id="${entry.id}" data-action="delete">Borrar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function populateForm(entry) {
  document.getElementById('fecha').value = entry.fecha || '';
  document.getElementById('lote').value = entry.lote || '';
  document.getElementById('bandejas').value = entry.bandejas || '';
  document.getElementById('peso').value = entry.peso || '';
  document.getElementById('humedad').value = entry.humedad || '';
  document.getElementById('obs').value = entry.obs || '';
  // store editing id
  document.getElementById('entryForm').dataset.editId = entry.id;
  document.getElementById('saveBtn').textContent = 'Actualizar';
}

function clearForm() {
  document.getElementById('entryForm').reset();
  delete document.getElementById('entryForm').dataset.editId;
  document.getElementById('saveBtn').textContent = 'Guardar entrada';
}

function exportCSV(entries) {
  if (!entries.length) return alert('No hay datos para exportar');
  const header = ['id','fecha','lote','bandejas','peso','humedad','obs'];
  const rows = entries.map(e => header.map(h => `"${String(e[h] || '').replace(/"/g,'""')}"`).join(','));
  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `produccion_hongos_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded',()=>{
  let entries = loadEntries();
  recalc(entries);
  renderTable(entries);

  const form = document.getElementById('entryForm');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      fecha: document.getElementById('fecha').value,
      lote: document.getElementById('lote').value,
      bandejas: Number(document.getElementById('bandejas').value || 0),
      peso: Number(document.getElementById('peso').value || 0),
      humedad: document.getElementById('humedad').value,
      obs: document.getElementById('obs').value,
    };
    const editId = form.dataset.editId;
    if (editId) {
      entries = entries.map(en => en.id === editId ? {...en, ...data} : en);
      delete form.dataset.editId;
      document.getElementById('saveBtn').textContent = 'Guardar entrada';
    } else {
      entries.push({...data, id: uid()});
    }
    saveEntries(entries);
    renderTable(entries);
    recalc(entries);
    form.reset();
  });

  document.getElementById('clearBtn').addEventListener('click', ()=>{
    clearForm();
  });

  document.querySelector('#entriesTable tbody').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === 'delete') {
      if (!confirm('¿Borrar esta entrada?')) return;
      entries = entries.filter(en => en.id !== id);
      saveEntries(entries);
      renderTable(entries);
      recalc(entries);
    } else if (action === 'edit') {
      const entry = entries.find(en => en.id === id);
      if (entry) populateForm(entry);
      window.scrollTo({top:0, behavior:'smooth'});
    }
  });

  document.getElementById('exportBtn').addEventListener('click', () => exportCSV(entries));
});