/* Duvyx Tech — interações do site (sem dependências) */
(() => {
  'use strict';
  const cfgEl = document.getElementById('duvyx-config');
  const CFG = cfgEl ? JSON.parse(cfgEl.textContent) : {};

  document.documentElement.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Cabeçalho ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); toggle.focus(); } });
    document.addEventListener('click', (e) => { if (nav.classList.contains('open') && !e.target.closest('.header-bar')) setOpen(false); });
    window.matchMedia('(min-width: 861px)').addEventListener('change', (m) => { if (m.matches) setOpen(false); });
  }

  /* ---------- Revelação ao rolar (conteúdo continua visível sem JS ou com movimento reduzido) ---------- */
  const reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el, i) => { el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`; io.observe(el); });
  } else reveals.forEach((el) => el.classList.add('in'));

  /* ---------- Barra fixa de contato no celular ---------- */
  // aparece depois que o botão principal da primeira dobra sai da tela; some quando a seção de contato ou o rodapé aparecem
  const dock = document.querySelector('[data-dock]');
  const heroCta = document.querySelector('.hero [data-cta], .hero .btn-primary, .page-hero .btn-row');
  if (dock && 'IntersectionObserver' in window) {
    dock.hidden = false; let pastHero = !heroCta; let nearEnd = false;
    const apply = () => {
      const show = pastHero && !nearEnd;
      dock.classList.toggle('show', show);
      dock.inert = !show; dock.setAttribute('aria-hidden', String(!show));
      document.body.style.setProperty('--dock-h', show && window.innerWidth <= 860 ? `${dock.offsetHeight}px` : '0px');
    };
    if (heroCta) new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; apply(); }).observe(heroCta);
    const ends = document.querySelectorAll('#contato, .site-footer'); const vis = new Set();
    const endIo = new IntersectionObserver((entries) => { entries.forEach((e) => (e.isIntersecting ? vis.add(e.target) : vis.delete(e.target))); nearEnd = vis.size > 0; apply(); });
    ends.forEach((el) => endIo.observe(el));
    window.addEventListener('resize', apply, { passive: true }); apply();
  }

  /* ---------- Profundidade das telas da primeira dobra (só mouse; nada em toque ou movimento reduzido) ---------- */
  const stage = document.querySelector('.stage'); const arc = stage && stage.querySelector('.arc');
  if (arc && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce.matches) {
    let raf = 0;
    stage.closest('.hero').addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0;
        const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
        arc.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`); arc.style.setProperty('--rx', `${(-y * 3).toFixed(2)}deg`); });
    });
    stage.closest('.hero').addEventListener('pointerleave', () => { arc.style.setProperty('--ry', '0deg'); arc.style.setProperty('--rx', '0deg'); });
  }

  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Formulário de orçamento ---------- */
  const form = document.getElementById('form-orcamento');
  if (!form) return;
  const status = document.getElementById('form-status');
  const btn = form.querySelector('[type=submit]');
  const f = (n) => form.elements[n];

  const rules = {
    nome: (v) => v.trim().length >= 2 || 'Informe seu nome.',
    email: (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Confira o e-mail digitado.',
    whatsapp: (v) => { const d = v.replace(/\D/g, ''); return !d || (d.length >= 10 && d.length <= 13) || 'Use DDD + número, ex.: (82) 99999-9999.'; },
    servico: (v) => !!v || 'Escolha o tipo de projeto.',
    mensagem: (v) => v.trim().length >= 20 || 'Conte um pouco mais sobre o projeto (mínimo de 20 caracteres).',
    consentimento: (_, el) => el.checked || 'É preciso concordar com o uso dos dados para responder ao contato.',
  };

  function setError(name, msg) {
    const el = f(name); const err = document.getElementById('err-' + name);
    if (!el || !err) return;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    err.textContent = msg || '';
  }
  const semContato = () => !f('email').value.trim() && !f('whatsapp').value.trim();
  function validateField(name) {
    const el = f(name); const r = rules[name](el.value || '', el);
    let msg = r === true ? '' : r;
    if (!msg && name === 'email' && semContato()) msg = 'Informe um e-mail ou um WhatsApp para resposta.';
    setError(name, msg);
    return !msg;
  }
  function validate() {
    let first = null;
    for (const name of Object.keys(rules)) if (!validateField(name) && !first) first = f(name);
    return first;
  }
  // Revalida só o campo editado (evita a página "pular" e desviar o próximo clique)
  for (const name of Object.keys(rules)) {
    const el = f(name);
    const again = () => {
      if (el.getAttribute('aria-invalid') === 'true') validateField(name);
      if ((name === 'whatsapp' || name === 'email') && f('email').getAttribute('aria-invalid') === 'true') validateField('email');
    };
    el.addEventListener('input', again);
    el.addEventListener('change', again);
  }

  function show(kind, html) { status.className = 'form-status full ' + kind; status.innerHTML = html; status.focus(); }

  function dados() {
    return {
      nome: f('nome').value.trim(),
      email: f('email').value.trim(),
      whatsapp: f('whatsapp').value.trim(),
      empresa: f('empresa').value.trim(),
      servico: f('servico').value,
      prazo: f('prazo').value,
      mensagem: f('mensagem').value.trim(),
      origem: location.href,
    };
  }
  function textoMensagem(d) {
    return `Olá! Sou ${d.nome}${d.empresa ? ` (${d.empresa})` : ''}.\nTipo de projeto: ${d.servico}${d.prazo ? `\nPrazo desejado: ${d.prazo}` : ''}\n\n${d.mensagem}` +
      `${d.email ? `\n\nE-mail: ${d.email}` : ''}${d.whatsapp ? `\nWhatsApp: ${d.whatsapp}` : ''}`;
  }
  function alternativas(d) {
    const c = CFG.contato || {}; const links = [];
    if (c.whatsapp) links.push(`<a href="https://wa.me/${c.whatsapp}?text=${encodeURIComponent(textoMensagem(d))}" target="_blank" rel="noopener">enviar esta mensagem pelo WhatsApp</a>`);
    if (c.email) links.push(`<a href="mailto:${c.email}?subject=${encodeURIComponent('Orçamento — ' + d.servico)}&body=${encodeURIComponent(textoMensagem(d))}">enviar por e-mail</a>`);
    return links;
  }

  async function enviar(d) {
    const fc = CFG.formulario || {};
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 15000);
    let url, body;
    if (fc.provedor === 'web3forms') {
      url = 'https://api.web3forms.com/submit';
      body = { access_key: fc.web3formsAccessKey, subject: `Novo pedido de orçamento — ${d.servico}`, from_name: 'Site Duvyx Tech', ...d };
    } else {
      url = fc.endpoint; body = { _subject: `Novo pedido de orçamento — ${d.servico}`, ...d };
    }
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
      let json = null; try { json = await res.json(); } catch { /* resposta sem JSON */ }
      if (!res.ok || (json && json.success === false)) throw new Error((json && (json.message || json.error)) || `HTTP ${res.status}`);
      return true;
    } finally { clearTimeout(t); }
  }

  const configurado = () => {
    const fc = CFG.formulario || {};
    if (fc.provedor === 'web3forms') return !!fc.web3formsAccessKey;
    if (fc.provedor === 'formspree' || fc.provedor === 'custom') return /^https?:\/\//.test(fc.endpoint || '');
    return false;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.elements.site_url && form.elements.site_url.value) return; // armadilha anti-spam
    const first = validate();
    if (first) { show('erro', 'Revise os campos destacados.'); first.focus(); return; }
    const d = dados();

    if (!configurado()) {
      const alt = alternativas(d);
      show('info', alt.length
        ? `O envio automático deste formulário ainda não foi ativado. Você pode ${alt.join(' ou ')} — a mensagem já vai preenchida.`
        : 'O envio deste formulário ainda não foi ativado e nenhum canal de contato foi configurado. Seus dados não foram enviados.');
      return;
    }
    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Enviando…';
    try {
      await enviar(d);
      form.reset();
      show('ok', 'Mensagem enviada. Obrigado! A resposta chega pelo contato que você informou.');
    } catch (err) {
      const alt = alternativas(d);
      show('erro', `Não foi possível enviar agora (${err.name === 'AbortError' ? 'tempo esgotado' : 'falha de conexão ou do serviço'}).` +
        (alt.length ? ` Tente de novo ou ${alt.join(' ou ')}.` : ' Tente novamente em alguns minutos.'));
    } finally { btn.disabled = false; btn.textContent = label; }
  });
})();
