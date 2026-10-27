/* Evolua — gestão de clínica de reabilitação (demonstração; dados salvos só no navegador) */
(() => {
  'use strict';
  const KEY = 'evolua-v1'; const DIA = 864e5;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const fmt = (t) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const PROF = ['Lívia R. · Fisioterapia', 'Caio M. · Terapia ocupacional', 'Bianca T. · Fonoaudiologia'];
  function exemplo() {
    const h = hoje();
    const pac = (id, nome, idade, quadro, objetivo, prof, dores) => ({ id, nome, idade, quadro, objetivo, prof,
      evolucoes: dores.map((d, i) => ({ data: h - (dores.length - i) * 3 * DIA, dor: d, nota: NOTAS[(id + i) % NOTAS.length] })) });
    const NOTAS = ['Boa tolerância aos exercícios de fortalecimento.', 'Relata menos rigidez ao acordar.', 'Aumento de amplitude na flexão.', 'Orientado sobre exercícios em casa.', 'Marcha mais estável sem apoio.', 'Fadiga no fim da sessão; reduzida a carga.'];
    const pacientes = [
      pac(1, 'Marta S.', 64, 'Pós-operatório de joelho (prótese)', 'Subir escadas sem apoio', 0, [7, 7, 6, 5, 5, 4, 3]),
      pac(2, 'Rogério A.', 52, 'Lombalgia crônica', 'Voltar a dirigir longas distâncias', 0, [8, 7, 7, 6, 6, 5]),
      pac(3, 'Helena C.', 71, 'Reabilitação pós-AVC', 'Autonomia para se vestir', 1, [5, 5, 4, 4, 3]),
      pac(4, 'Tiago N.', 29, 'Lesão de ombro (esporte)', 'Retorno ao treino de natação', 0, [6, 5, 4, 3, 3, 2]),
      pac(5, 'Sônia P.', 58, 'Disfagia leve', 'Alimentação segura sem engasgos', 2, [4, 4, 3, 3]),
      pac(6, 'Davi L.', 8, 'Atraso na coordenação motora', 'Escrever com mais firmeza', 1, [2, 2, 1, 1]),
    ];
    const s = (hr, pid, tipo) => ({ id: `${hr}-${pid}`, hora: hr, pid, tipo, status: 'pend' });
    const sessoes = [s('08:00', 4, 'Fortalecimento de ombro'), s('08:30', 1, 'Fisioterapia motora'), s('09:00', 3, 'Atividades de vida diária'), s('10:00', 2, 'Estabilização lombar'),
      s('10:30', 5, 'Terapia de deglutição'), s('13:30', 6, 'Coordenação motora fina'), s('14:30', 1, 'Treino de marcha em escada'), s('16:00', 4, 'Retorno ao esporte')];
    sessoes[0].status = 'presente'; sessoes[1].status = 'presente'; sessoes[3].status = 'falta';
    return { dia: h, pacientes, sessoes, sel: 1 };
  }
  let db; try { db = JSON.parse(localStorage.getItem(KEY)); } catch {} if (!db || db.dia !== hoje()) db = exemplo();
  const salvar = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };
  const P = (id) => db.pacientes.find((p) => p.id === id);
  $('#hoje').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  PROF.forEach((p, i) => $('#f-prof').insertAdjacentHTML('beforeend', `<option value="${i}">${esc(p)}</option>`));

  function agenda() {
    const fp = $('#f-prof').value; const lista = db.sessoes.filter((s) => fp === '' || P(s.pid).prof === +fp).sort((a, b) => a.hora.localeCompare(b.hora));
    const c = (st) => lista.filter((s) => s.status === st).length;
    $('#s-total').textContent = lista.length; $('#s-pres').textContent = c('presente'); $('#s-falta').textContent = c('falta'); $('#s-pend').textContent = c('pend');
    $('#agenda').innerHTML = lista.map((s) => { const p = P(s.pid); const st = { presente: 'Presente', falta: 'Faltou', pend: 'A confirmar' }[s.status];
      return `<li class="sess ${s.status}"><time>${s.hora}</time><div><h3>${esc(p.nome)} · ${esc(s.tipo)}</h3><p>${esc(PROF[p.prof])} · <span class="tag ${s.status}">${st}</span></p></div>
      <div class="acts">${s.status === 'pend' ? `<button type="button" class="b ok" data-s="${s.id}" data-st="presente">Presente</button><button type="button" class="b no" data-s="${s.id}" data-st="falta">Falta</button>` : `<button type="button" class="b" data-s="${s.id}" data-st="pend">Desfazer</button>`}
      <button type="button" class="b" data-ficha="${p.id}">Ficha</button></div></li>`; }).join('');
  }
  function grafico(ev) {
    if (!ev.length) return ''; const W = 600, H = 120, pad = 18; const xs = (i) => pad + (i * (W - 2 * pad)) / Math.max(1, ev.length - 1), ys = (d) => H - pad - (d / 10) * (H - 2 * pad);
    const pts = ev.map((e, i) => `${xs(i).toFixed(1)},${ys(e.dor).toFixed(1)}`).join(' ');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Escala de dor nas últimas ${ev.length} sessões: de ${ev[0].dor} para ${ev[ev.length - 1].dor}">
      <polyline points="${pts}" fill="none" stroke="#3A57E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      ${ev.map((e, i) => `<circle cx="${xs(i).toFixed(1)}" cy="${ys(e.dor).toFixed(1)}" r="4.5" fill="#fff" stroke="#3A57E8" stroke-width="2.5"/><text x="${xs(i).toFixed(1)}" y="${(ys(e.dor) - 10).toFixed(1)}" font-size="12" text-anchor="middle" fill="#5D6880">${e.dor}</text>`).join('')}</svg>`;
  }
  function pacientes() {
    const q = $('#busca').value.trim().toLowerCase();
    $('#pacs').innerHTML = db.pacientes.filter((p) => !q || p.nome.toLowerCase().includes(q)).map((p) =>
      `<li><button type="button" class="pac" data-p="${p.id}" aria-current="${p.id === db.sel}"><span>${esc(p.nome)}</span><small>${esc(p.quadro.split(' (')[0])}</small></button></li>`).join('');
    const p = P(db.sel); if (!p) { $('#ficha').innerHTML = '<p>Selecione um paciente.</p>'; return; }
    const ev = p.evolucoes; const ini = ev[0]?.dor, fim = ev[ev.length - 1]?.dor;
    $('#ficha').innerHTML = `<h2>${esc(p.nome)}</h2><p class="sub">${p.idade} anos · ${esc(p.quadro)}</p>
      <div class="dados"><div><span>Objetivo</span><strong>${esc(p.objetivo)}</strong></div><div><span>Profissional</span><strong>${esc(PROF[p.prof])}</strong></div><div><span>Sessões registradas</span><strong>${ev.length}</strong></div></div>
      <h3>Escala de dor (0 a 10)${ini != null ? ` · de ${ini} para ${fim}` : ''}</h3>${grafico(ev)}
      <h3>Evolução</h3><ul class="evol">${ev.slice().reverse().map((e) => `<li><span class="d">${fmt(e.data)} · dor ${e.dor}</span><p>${esc(e.nota)}</p></li>`).join('')}</ul>
      <form class="nova" id="nova" novalidate><strong>Registrar evolução de hoje</strong>
        <div class="row"><label>Dor (0 a 10)<input name="dor" type="number" min="0" max="10" inputmode="numeric" required></label><label>Data<input value="${fmt(Date.now())}" disabled></label></div>
        <label>Observações<textarea name="nota" rows="2" required placeholder="Como foi a sessão"></textarea></label>
        <p class="err" id="erro" role="alert"></p><div><button type="submit" class="b pri">Salvar evolução</button></div></form>`;
  }
  function abrirFicha(id) { db.sel = id; salvar(); trocar('pacientes'); }
  function trocar(t) { document.querySelectorAll('.tab').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.tab === t)));
    $('#v-agenda').hidden = t !== 'agenda'; $('#v-pacientes').hidden = t !== 'pacientes'; render(); }
  const render = () => { agenda(); pacientes(); };
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => trocar(t.dataset.tab)));
  $('#f-prof').addEventListener('input', agenda); $('#busca').addEventListener('input', pacientes);
  $('#agenda').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.ficha) return abrirFicha(+b.dataset.ficha);
    db.sessoes.find((s) => s.id === b.dataset.s).status = b.dataset.st; salvar(); agenda(); });
  $('#pacs').addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (b) { db.sel = +b.dataset.p; salvar(); pacientes(); } });
  $('#ficha').addEventListener('submit', (e) => { e.preventDefault(); const f = e.target; const dor = f.dor.value.trim();
    if (dor === '' || +dor < 0 || +dor > 10 || !f.nota.value.trim()) { $('#erro').textContent = 'Informe a dor de 0 a 10 e as observações.'; return; }
    P(db.sel).evolucoes.push({ data: Date.now(), dor: +dor, nota: f.nota.value.trim() }); salvar(); pacientes(); });
  render();
})();
