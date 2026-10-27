// Pedal Firme — demonstração. Negócio fictício.
(() => {
  const $ = (s) => document.querySelector(s);
  const SERVICOS = [
    { nome: 'Revisão completa', desc: 'Limpeza, lubrificação, regulagem de freios e marchas.', preco: 120 },
    { nome: 'Regulagem de freios', desc: 'Ajuste de freios a disco ou V-brake.', preco: 40 },
    { nome: 'Troca de câmara', desc: 'Mão de obra; a câmara é cobrada à parte.', preco: 20 },
    { nome: 'Montagem de bike nova', desc: 'Montagem e ajuste completo de bicicleta na caixa.', preco: 90 },
  ];
  // 0 = domingo
  const HORAS = { 0: null, 1: ['08:00', '18:00'], 2: ['08:00', '18:00'], 3: ['08:00', '18:00'], 4: ['08:00', '18:00'], 5: ['08:00', '18:00'], 6: ['08:00', '12:00'] };
  const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const toMin = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };

  $('#cards').innerHTML = SERVICOS.map((s) => `<article class="card"><h3>${s.nome}</h3><p>${s.desc}</p><span class="preco">a partir de ${brl.format(s.preco)}</span></article>`).join('');
  $('#servico').innerHTML = SERVICOS.map((s) => `<option>${s.nome}</option>`).join('');

  const agora = new Date(); const hoje = agora.getDay();
  $('#horas').innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => `<tr class="${d === hoje ? 'hoje' : ''}"><th scope="row">${DIAS[d]}${d === hoje ? ' (hoje)' : ''}</th><td>${HORAS[d] ? HORAS[d].join(' – ') : 'Fechado'}</td></tr>`).join('');

  function status() {
    const now = new Date(); const d = now.getDay(); const m = now.getHours() * 60 + now.getMinutes();
    const h = HORAS[d]; const el = $('#status');
    if (h && m >= toMin(h[0]) && m < toMin(h[1])) { el.className = 'status aberto'; el.textContent = `Aberto agora · fecha às ${h[1]}`; return; }
    // próximo horário de abertura
    for (let i = 0; i < 8; i++) {
      const dd = (d + i) % 7; const hh = HORAS[dd];
      if (!hh) continue;
      if (i === 0 && m >= toMin(hh[0])) continue;
      el.className = 'status fechado';
      el.textContent = `Fechado agora · abre ${i === 0 ? 'hoje' : i === 1 ? 'amanhã' : DIAS[dd].toLowerCase()} às ${hh[0]}`;
      return;
    }
  }
  status(); setInterval(status, 60000);

  // próximos 6 dias abertos
  const opts = []; for (let i = 0; opts.length < 6 && i < 14; i++) {
    const dt = new Date(); dt.setDate(dt.getDate() + i); if (!HORAS[dt.getDay()]) continue;
    opts.push(`${DIAS[dt.getDay()]}, ${dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`);
  }
  $('#dia').innerHTML = opts.map((o) => `<option>${o}</option>`).join('');

  function texto() {
    const nome = $('#nome').value.trim() || '[seu nome]';
    const det = $('#det').value.trim();
    return `Olá, Pedal Firme! Aqui é ${nome}.\nGostaria de agendar: ${$('#servico').value}.\nMelhor dia: ${$('#dia').value}.` + (det ? `\nDetalhes: ${det}` : '');
  }
  const atualizar = () => { $('#preview').value = texto(); };
  ['nome', 'servico', 'dia', 'det'].forEach((id) => $('#' + id).addEventListener('input', atualizar));
  atualizar();

  function valida() {
    const ok = $('#nome').value.trim().length >= 2;
    $('#nome').setAttribute('aria-invalid', String(!ok));
    if (!ok) { $('#msg').textContent = 'Informe seu nome para montar a mensagem.'; $('#nome').focus(); }
    return ok;
  }
  $('#copiar').addEventListener('click', async () => {
    if (!valida()) return;
    try { await navigator.clipboard.writeText(texto()); $('#msg').textContent = 'Mensagem copiada.'; }
    catch { $('#msg').textContent = 'Não foi possível copiar automaticamente. Selecione o texto da prévia e copie.'; }
  });
  $('#whats').addEventListener('click', () => {
    if (!valida()) return;
    $('#msg').textContent = 'Demonstração: este negócio é fictício, então não há WhatsApp de destino. No site real, este botão abre a conversa com a mensagem acima.';
  });
})();
