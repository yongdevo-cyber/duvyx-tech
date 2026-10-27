// Painel de Pedidos — demonstração. Dados fictícios em localStorage.
(() => {
  const KEY = 'painelpedidos:v1';
  const COLS = [['novo', 'Novos'], ['producao', 'Em produção'], ['pronto', 'Prontos'], ['entregue', 'Entregues']];
  const $ = (s) => document.querySelector(s);
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const local = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const iso = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return local(d); };
  const exemplo = () => [
    { id: uid(), cliente: 'Cliente A', item: 'Bolo de cenoura 1 kg', valor: 70, entrega: iso(1), etapa: 'novo' },
    { id: uid(), cliente: 'Cliente B', item: '50 brigadeiros', valor: 75, entrega: iso(2), etapa: 'novo' },
    { id: uid(), cliente: 'Cliente C', item: 'Torta de limão', valor: 85, entrega: iso(-1), etapa: 'producao' },
    { id: uid(), cliente: 'Cliente D', item: 'Bolo de aniversário 2 kg', valor: 180, entrega: iso(0), etapa: 'pronto' },
    { id: uid(), cliente: 'Cliente E', item: 'Cento de salgados', valor: 90, entrega: iso(-2), etapa: 'entregue' },
  ];
  let pedidos;
  try { pedidos = JSON.parse(localStorage.getItem(KEY)) || exemplo(); } catch { pedidos = exemplo(); }
  const salvar = () => { try { localStorage.setItem(KEY, JSON.stringify(pedidos)); } catch { msg('Armazenamento bloqueado: alterações não serão mantidas.'); } };
  const msg = (t) => { $('#msg').textContent = t; };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hojeISO = () => local(new Date());

  function render() {
    const q = $('#busca').value.trim().toLowerCase();
    const board = $('#board'); board.innerHTML = '';
    COLS.forEach(([id, nome], ci) => {
      const lista = pedidos.filter((p) => p.etapa === id && (p.cliente + ' ' + p.item).toLowerCase().includes(q))
        .sort((a, b) => a.entrega.localeCompare(b.entrega));
      const total = lista.reduce((s, p) => s + Number(p.valor || 0), 0);
      const col = document.createElement('section');
      col.className = 'col'; col.dataset.etapa = id; col.setAttribute('aria-label', `${nome}: ${lista.length} pedidos`);
      col.innerHTML = `<h2>${nome} <small>${lista.length} · ${brl.format(total)}</small></h2>`;
      if (!lista.length) col.insertAdjacentHTML('beforeend', `<p class="empty">${q ? 'Nada encontrado.' : 'Nenhum pedido aqui.'}</p>`);
      lista.forEach((p) => {
        const atrasado = p.etapa !== 'entregue' && p.entrega < hojeISO();
        const card = document.createElement('article');
        card.className = 'card' + (atrasado ? ' late' : ''); card.draggable = true; card.dataset.id = p.id;
        card.innerHTML = `<h3>${esc(p.item)}</h3><p>${esc(p.cliente)}</p>
          <div class="row"><strong>${brl.format(p.valor)}</strong><span class="${atrasado ? 'late-tag' : ''}">${atrasado ? 'Atrasado · ' : ''}${new Date(p.entrega + 'T12:00').toLocaleDateString('pt-BR')}</span></div>
          <div class="moves">${ci > 0 ? `<button type="button" data-m="-1" aria-label="Mover ${esc(p.item)} para ${COLS[ci - 1][1]}">←</button>` : ''}
          ${ci < COLS.length - 1 ? `<button type="button" data-m="1" aria-label="Mover ${esc(p.item)} para ${COLS[ci + 1][1]}">${COLS[ci + 1][1]} →</button>` : ''}
          <button type="button" class="del" aria-label="Excluir ${esc(p.item)}">Excluir</button></div>`;
        card.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => mover(p.id, COLS[ci + Number(b.dataset.m)][0])));
        card.querySelector('.del').addEventListener('click', () => {
          if (!confirm(`Excluir o pedido "${p.item}"?`)) return;
          pedidos = pedidos.filter((x) => x.id !== p.id); salvar(); render(); msg('Pedido excluído.');
        });
        card.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', p.id));
        col.appendChild(card);
      });
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', () => col.classList.remove('over'));
      col.addEventListener('drop', (e) => { e.preventDefault(); col.classList.remove('over'); mover(e.dataTransfer.getData('text/plain'), id); });
      board.appendChild(col);
    });
  }
  function mover(id, etapa) {
    const p = pedidos.find((x) => x.id === id); if (!p || p.etapa === etapa) return;
    p.etapa = etapa; salvar(); render(); msg(`"${p.item}" movido para ${COLS.find((c) => c[0] === etapa)[1]}.`);
  }

  // Novo pedido
  const form = $('#novo'); const abrir = $('#abrir-novo');
  const toggle = (show) => { form.hidden = !show; abrir.setAttribute('aria-expanded', String(show)); if (show) form.cliente.focus(); };
  abrir.addEventListener('click', () => toggle(form.hidden));
  $('#cancelar').addEventListener('click', () => { form.reset(); $('#erro').textContent = ''; toggle(false); abrir.focus(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const faltando = ['cliente', 'item', 'valor', 'entrega'].filter((k) => !String(d[k]).trim());
    if (faltando.length || Number(d.valor) < 0) { $('#erro').textContent = 'Preencha cliente, item, valor e data de entrega.'; form[faltando[0] || 'valor'].focus(); return; }
    pedidos.push({ id: uid(), cliente: d.cliente.trim(), item: d.item.trim(), valor: Number(d.valor), entrega: d.entrega, etapa: 'novo' });
    salvar(); form.reset(); $('#erro').textContent = ''; toggle(false); render(); msg('Pedido adicionado em "Novos".');
  });

  // CSV
  const CAMPOS = ['cliente', 'item', 'valor', 'entrega', 'etapa'];
  const csvCell = (v) => { const s = String(v ?? ''); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  $('#exportar').addEventListener('click', () => {
    const linhas = [CAMPOS.join(';'), ...pedidos.map((p) => CAMPOS.map((k) => csvCell(p[k])).join(';'))];
    const blob = new Blob(['﻿' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pedidos-${hojeISO()}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    msg(`${pedidos.length} pedidos exportados (CSV separado por ponto e vírgula, abre no Excel).`);
  });
  function parseCSV(txt) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < txt.length; i++) {
      const c = txt[i];
      if (q) { if (c === '"' && txt[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true; else if (c === ';') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((x) => x.trim()));
  }
  $('#importar').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const rows = parseCSV((await f.text()).replace(/^﻿/, ''));
    const head = rows.shift()?.map((h) => h.trim().toLowerCase()) || [];
    if (!CAMPOS.every((c) => head.includes(c))) { msg('Arquivo inválido: o cabeçalho precisa ter cliente;item;valor;entrega;etapa.'); e.target.value = ''; return; }
    const etapas = COLS.map((c) => c[0]);
    const novos = rows.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])))
      .filter((p) => p.cliente && p.item && /^\d{4}-\d{2}-\d{2}$/.test(p.entrega))
      .map((p) => ({ id: uid(), cliente: p.cliente, item: p.item, valor: Number(String(p.valor).replace(',', '.')) || 0, entrega: p.entrega, etapa: etapas.includes(p.etapa) ? p.etapa : 'novo' }));
    pedidos = pedidos.concat(novos); salvar(); render();
    msg(`${novos.length} pedido(s) importado(s)${rows.length - novos.length ? `, ${rows.length - novos.length} linha(s) ignorada(s) por dados incompletos` : ''}.`);
    e.target.value = '';
  });
  $('#exemplo').addEventListener('click', () => {
    if (!confirm('Substituir todos os pedidos pelos dados de exemplo?')) return;
    pedidos = exemplo(); salvar(); render(); msg('Dados de exemplo restaurados.');
  });
  $('#busca').addEventListener('input', render);
  render();
})();
