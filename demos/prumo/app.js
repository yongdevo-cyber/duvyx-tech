/* Prumo — gestão de manutenção e ocorrências (demonstração; dados salvos só no navegador) */
(() => {
  'use strict';
  const KEY = 'prumo-v1'; const DIA = 864e5;
  const $ = (s) => document.querySelector(s);
  const hoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const PRAZO = { alta: 1, media: 3, baixa: 7 }; const NOMES = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
  const ST = { aberta: 'Aberta', andamento: 'Em andamento', concluida: 'Concluída' };
  const fmt = (t) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function exemplo() {
    const h = hoje().getTime(); let n = 140;
    const oc = (dias, equip, setor, prio, desc, resp, status, concl) => ({ id: ++n, aberta: h - dias * DIA + 9 * 36e5, equip, setor, prio, desc, resp, status, concl: concl != null ? h - concl * DIA : null });
    return {
      seq: 160,
      ocorrencias: [
        oc(0, 'Compressor 2', 'Utilidades', 'alta', 'Pressão abaixo de 6 bar e ruído no cabeçote.', 'Equipe mecânica', 'aberta'),
        oc(2, 'Esteira de expedição', 'Expedição', 'alta', 'Correia patinando no rolo de tração.', 'Equipe mecânica', 'andamento'),
        oc(1, 'Quadro elétrico QD-04', 'Produção', 'media', 'Disjuntor do circuito 3 desarmando no fim do turno.', 'Equipe elétrica', 'andamento'),
        oc(5, 'Iluminação do galpão B', 'Predial', 'baixa', 'Quatro luminárias apagadas no corredor central.', 'Equipe predial', 'aberta'),
        oc(4, 'Ar-condicionado sala de reuniões', 'Administrativo', 'media', 'Não resfria; possível falta de gás.', 'Terceirizado', 'aberta'),
        oc(9, 'Bomba de recalque', 'Utilidades', 'alta', 'Vazamento no selo mecânico.', 'Equipe mecânica', 'concluida', 8),
        oc(12, 'Porta rápida da doca 2', 'Expedição', 'media', 'Sensor de presença sem resposta.', 'Equipe elétrica', 'concluida', 10),
        oc(16, 'Prensa 3', 'Produção', 'alta', 'Óleo hidráulico abaixo do nível mínimo.', 'Equipe mecânica', 'concluida', 15),
      ],
      preventivas: [
        { id: 1, equip: 'Compressor 1 e 2', setor: 'Utilidades', freq: 30, prox: h + 4 * DIA },
        { id: 2, equip: 'Empilhadeira E-01', setor: 'Expedição', freq: 90, prox: h - 2 * DIA },
        { id: 3, equip: 'Prensas 1 a 4', setor: 'Produção', freq: 15, prox: h + 1 * DIA },
        { id: 4, equip: 'Gerador de emergência', setor: 'Predial', freq: 60, prox: h + 21 * DIA },
        { id: 5, equip: 'Quadros elétricos (termografia)', setor: 'Produção', freq: 180, prox: h + 47 * DIA },
      ],
    };
  }
  let db; try { db = JSON.parse(localStorage.getItem(KEY)) || exemplo(); } catch { db = exemplo(); }
  const salvar = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };
  const prazo = (o) => o.aberta + PRAZO[o.prio] * DIA;
  const atrasada = (o) => o.status !== 'concluida' && Date.now() > prazo(o);

  $('#hoje').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  function kpis() {
    const lim = hoje().getTime() - 30 * DIA;
    $('#k-abertas').textContent = db.ocorrencias.filter((o) => o.status === 'aberta').length;
    $('#k-andamento').textContent = db.ocorrencias.filter((o) => o.status === 'andamento').length;
    $('#k-atrasadas').textContent = db.ocorrencias.filter(atrasada).length;
    $('#k-concluidas').textContent = db.ocorrencias.filter((o) => o.status === 'concluida' && o.concl >= lim).length;
  }
  function lista() {
    const q = $('#busca').value.trim().toLowerCase(), fs = $('#f-status').value, fp = $('#f-prio').value;
    const ordem = { aberta: 0, andamento: 1, concluida: 2 }, po = { alta: 0, media: 1, baixa: 2 };
    const itens = db.ocorrencias.filter((o) => (!fs || o.status === fs) && (!fp || o.prio === fp) && (!q || `${o.equip} ${o.setor} ${o.desc}`.toLowerCase().includes(q)))
      .sort((a, b) => ordem[a.status] - ordem[b.status] || (atrasada(b) - atrasada(a)) || po[a.prio] - po[b.prio] || b.aberta - a.aberta);
    $('#lista').innerHTML = itens.map((o) => {
      const late = atrasada(o); const prox = o.status === 'aberta' ? ['andamento', 'Iniciar'] : o.status === 'andamento' ? ['concluida', 'Concluir'] : null;
      return `<li class="item${late ? ' late' : ''}"><div>
        <h3>#${o.id} · ${esc(o.equip)}</h3><p>${esc(o.desc)}</p>
        <div class="meta"><span class="pill st-${o.status}">${ST[o.status]}</span><span class="pill ${o.prio}">${NOMES[o.prio]}</span><span class="pill">${esc(o.setor)}</span><span class="pill">${esc(o.resp)}</span>
        ${o.status === 'concluida' ? `<span class="pill">Concluída em ${fmt(o.concl)}</span>` : `<span class="pill${late ? ' late' : ''}">${late ? 'Fora do prazo · ' : ''}prazo ${fmt(prazo(o))}</span>`}</div></div>
        <div class="acts">${prox ? `<button type="button" class="btn sm" data-id="${o.id}" data-st="${prox[0]}">${prox[1]}</button>` : ''}
        ${o.status !== 'concluida' ? `<button type="button" class="btn sm ghost" data-id="${o.id}" data-st="${o.status === 'aberta' ? 'concluida' : 'aberta'}">${o.status === 'aberta' ? 'Concluir direto' : 'Voltar a aberta'}</button>` : ''}</div></li>`;
    }).join('');
    $('#vazio').hidden = itens.length > 0;
  }
  function preventivas() {
    const h = hoje().getTime();
    $('#prev-body').innerHTML = db.preventivas.slice().sort((a, b) => a.prox - b.prox).map((p) => {
      const d = Math.round((p.prox - h) / DIA); const cls = d < 0 ? 'due-late' : d <= 3 ? 'due-soon' : '';
      const txt = d < 0 ? `${fmt(p.prox)} · atrasada ${-d} dia${d === -1 ? '' : 's'}` : d === 0 ? 'Hoje' : `${fmt(p.prox)} · em ${d} dia${d === 1 ? '' : 's'}`;
      return `<tr><td>${esc(p.equip)}</td><td>${esc(p.setor)}</td><td>A cada ${p.freq} dias</td><td class="${cls}">${txt}</td><td><button type="button" class="btn sm ghost" data-prev="${p.id}">Registrar execução</button></td></tr>`;
    }).join('');
  }
  const render = () => { kpis(); lista(); preventivas(); };
  ['#busca', '#f-status', '#f-prio'].forEach((s) => $(s).addEventListener('input', lista));
  $('#lista').addEventListener('click', (e) => { const b = e.target.closest('[data-st]'); if (!b) return;
    const o = db.ocorrencias.find((x) => x.id === +b.dataset.id); o.status = b.dataset.st; o.concl = o.status === 'concluida' ? Date.now() : null; salvar(); render(); });
  $('#prev-body').addEventListener('click', (e) => { const b = e.target.closest('[data-prev]'); if (!b) return;
    const p = db.preventivas.find((x) => x.id === +b.dataset.prev); p.prox = hoje().getTime() + p.freq * DIA; salvar(); render(); });
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
    const prev = t.dataset.tab === 'preventivas'; $('#painel-ocorrencias').hidden = prev; $('#painel-preventivas').hidden = !prev;
    $('#titulo').textContent = prev ? 'Preventivas' : 'Ocorrências'; }));
  const dlg = $('#dlg'), form = $('#form');
  $('#nova').addEventListener('click', () => { form.reset(); $('#erro').textContent = ''; dlg.showModal(); form.equip.focus(); });
  $('#cancelar').addEventListener('click', () => dlg.close());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.equip.value.trim() || !form.desc.value.trim()) { $('#erro').textContent = 'Informe o equipamento e o que aconteceu.'; (form.equip.value.trim() ? form.desc : form.equip).focus(); return; }
    db.ocorrencias.push({ id: ++db.seq, aberta: Date.now(), equip: form.equip.value.trim(), setor: form.setor.value, prio: form.prio.value, desc: form.desc.value.trim(), resp: form.resp.value, status: 'aberta', concl: null });
    salvar(); dlg.close(); $('#f-status').value = ''; $('#f-prio').value = ''; $('#busca').value = ''; render();
  });
  $('#reset').addEventListener('click', () => { db = exemplo(); salvar(); render(); });
  render();
})();
