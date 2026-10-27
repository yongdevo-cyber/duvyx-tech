// Orça Fácil — demonstração. Dados salvos em localStorage (somente neste navegador).
(() => {
  const KEY = 'orcafacil:v1';
  const $ = (s) => document.querySelector(s);
  const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const store = {
    load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } },
    save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch { return false; } },
  };
  let lista = store.load();
  let atual = novo();

  function proxNumero() {
    const max = lista.reduce((m, o) => Math.max(m, o.numero || 0), 0);
    return max + 1;
  }
  function novo() {
    const d = new Date(); d.setDate(d.getDate() + 15);
    return { id: null, numero: null, cliente: '', contato: '', validade: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, status: 'rascunho',
             itens: [{ desc: '', qtd: 1, valor: 0 }], desconto: 0, obs: '' };
  }
  const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : 0; };
  function calc(o) {
    const sub = o.itens.reduce((s, i) => s + num(i.qtd) * num(i.valor), 0);
    const desc = sub * Math.min(num(o.desconto), 100) / 100;
    return { sub, desc, total: sub - desc };
  }

  function renderItens() {
    const tb = $('#itens'); tb.innerHTML = '';
    atual.itens.forEach((it, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><label class="sr" for="d${idx}">Descrição do item ${idx + 1}</label><input id="d${idx}" data-k="desc" value="${esc(it.desc)}" placeholder="Ex.: Instalação"></td>
        <td class="n"><label class="sr" for="q${idx}">Quantidade</label><input id="q${idx}" data-k="qtd" type="number" min="0" step="1" value="${it.qtd}" style="width:70px;text-align:right"></td>
        <td class="n"><label class="sr" for="v${idx}">Valor unitário</label><input id="v${idx}" data-k="valor" type="number" min="0" step="0.01" value="${it.valor}" style="width:120px;text-align:right"></td>
        <td class="n" data-sub>${brl.format(num(it.qtd) * num(it.valor))}</td>
        <td><button type="button" class="icon-btn" aria-label="Remover item ${idx + 1}">✕</button></td>`;
      tr.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => {
        it[inp.dataset.k] = inp.dataset.k === 'desc' ? inp.value : inp.value;
        tr.querySelector('[data-sub]').textContent = brl.format(num(it.qtd) * num(it.valor));
        renderTotais();
      }));
      tr.querySelector('button').addEventListener('click', () => {
        atual.itens.splice(idx, 1);
        if (!atual.itens.length) atual.itens.push({ desc: '', qtd: 1, valor: 0 });
        renderItens(); renderTotais();
      });
      tb.appendChild(tr);
    });
  }
  function renderTotais() {
    const t = calc(atual);
    $('#t-sub').textContent = brl.format(t.sub);
    $('#t-desc').textContent = '− ' + brl.format(t.desc);
    $('#t-total').textContent = brl.format(t.total);
  }
  function renderForm() {
    $('#numero').textContent = atual.numero ? `nº ${String(atual.numero).padStart(4, '0')}` : '(novo)';
    for (const k of ['cliente', 'contato', 'validade', 'status', 'obs', 'desconto']) $('#' + k).value = atual[k];
    renderItens(); renderTotais();
  }
  function renderLista() {
    const q = $('#busca').value.trim().toLowerCase();
    const ul = $('#salvos'); ul.innerHTML = '';
    const itens = lista.filter((o) => o.cliente.toLowerCase().includes(q)).sort((a, b) => b.numero - a.numero);
    itens.forEach((o) => {
      const li = document.createElement('li');
      if (o.id === atual.id) li.className = 'ativo';
      li.innerHTML = `<div class="li-top"><button type="button">#${String(o.numero).padStart(4, '0')} · ${esc(o.cliente)}</button><span class="tag ${o.status}">${o.status}</span></div>
        <div class="li-meta"><span>Validade ${o.validade ? new Date(o.validade + 'T12:00').toLocaleDateString('pt-BR') : '—'}</span><strong>${brl.format(calc(o).total)}</strong></div>
        <div class="li-actions"><button type="button" data-a="dup">Duplicar</button><button type="button" class="del" data-a="del">Excluir</button></div>`;
      li.querySelector('.li-top button').addEventListener('click', () => { atual = structuredClone(o); renderForm(); renderLista(); });
      li.querySelector('[data-a=dup]').addEventListener('click', () => {
        const c = structuredClone(o); c.id = uid(); c.numero = proxNumero(); c.status = 'rascunho';
        lista.push(c); store.save(lista); atual = structuredClone(c); renderForm(); renderLista(); aviso('Orçamento duplicado.');
      });
      li.querySelector('[data-a=del]').addEventListener('click', () => {
        if (!confirm(`Excluir o orçamento #${o.numero} de ${o.cliente}?`)) return;
        lista = lista.filter((x) => x.id !== o.id); store.save(lista);
        if (atual.id === o.id) atual = novo();
        renderForm(); renderLista(); aviso('Orçamento excluído.');
      });
      ul.appendChild(li);
    });
    $('#contagem').textContent = lista.length ? `${lista.length}` : '';
    $('#vazio').hidden = itens.length > 0;
    if (!itens.length && lista.length) $('#vazio').textContent = 'Nenhum orçamento encontrado para essa busca.';
    else $('#vazio').textContent = 'Nenhum orçamento salvo ainda. Preencha ao lado e clique em “Salvar orçamento”.';
  }
  function aviso(t, err) { const m = $('#msg'); m.textContent = t; m.className = err ? 'err' : ''; }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  for (const k of ['cliente', 'contato', 'validade', 'status', 'obs', 'desconto'])
    $('#' + k).addEventListener('input', (e) => { atual[k] = e.target.value; if (k === 'desconto') renderTotais(); });
  $('#add-item').addEventListener('click', () => { atual.itens.push({ desc: '', qtd: 1, valor: 0 }); renderItens(); $('#itens tr:last-child input').focus(); });
  $('#busca').addEventListener('input', renderLista);
  $('#novo').addEventListener('click', () => { atual = novo(); renderForm(); renderLista(); aviso(''); $('#cliente').focus(); });
  $('#imprimir').addEventListener('click', () => window.print());
  $('#salvar').addEventListener('click', () => {
    if (!atual.cliente.trim()) { aviso('Informe o nome do cliente.', true); $('#cliente').focus(); return; }
    const validos = atual.itens.filter((i) => i.desc.trim() && num(i.qtd) > 0);
    if (!validos.length) { aviso('Adicione pelo menos um item com descrição e quantidade.', true); return; }
    atual.itens = validos;
    if (!atual.id) { atual.id = uid(); atual.numero = proxNumero(); lista.push(structuredClone(atual)); }
    else lista = lista.map((o) => (o.id === atual.id ? structuredClone(atual) : o));
    if (!store.save(lista)) { aviso('Não foi possível salvar neste navegador (armazenamento bloqueado).', true); return; }
    renderForm(); renderLista(); aviso(`Orçamento #${String(atual.numero).padStart(4, '0')} salvo.`);
  });

  renderForm(); renderLista();
})();
