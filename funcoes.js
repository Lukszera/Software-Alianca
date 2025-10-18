// Tenta obter ipcRenderer (quando rodando no Electron com nodeIntegration)
let ipcRenderer = null;
try {
    // Em páginas estáticas no Electron, require pode existir
    const electron = require('electron');
    ipcRenderer = electron && electron.ipcRenderer ? electron.ipcRenderer : null;
} catch (_) {
    // Não está em Electron ou require desabilitado
    ipcRenderer = null;
}

// Handler unificado e único para exclusão em detalhes-material
document.addEventListener('DOMContentLoaded', function() {
  if (!window.location.pathname.endsWith('detalhes-material.html')) return;
  const btnExcluirIcone = document.querySelector('.icone-formulario[alt="Excluir"]');
  const modalExcluir = document.getElementById('modal-excluir');
  if (!modalExcluir) return;
  const btnCancelar = modalExcluir.querySelector('.btn-cancelar');
  const btnExcluir = modalExcluir.querySelector('.btn-excluir');
  if (btnExcluirIcone) btnExcluirIcone.onclick = () => modalExcluir.classList.add('ativo');
  if (btnCancelar) btnCancelar.onclick = () => modalExcluir.classList.remove('ativo');
  if (!btnExcluir) return;

  btnExcluir.onclick = async function() {
    modalExcluir.classList.remove('ativo');
    const id = getParametroUrl('id');
    if (!id) return;
    const notificacao = document.getElementById('notificacao');
    if (!ipcRenderer) {
      const msg = "Operação só disponível no Electron.";
      if (notificacao) { notificacao.textContent = msg; notificacao.className = "erro"; notificacao.style.display = "block"; setTimeout(()=>{ notificacao.style.display = "none"; }, 3000); }
      else alert(msg);
      return;
    }
    try {
      const res = await ipcRenderer.invoke('excluir-material', id);
      if (res && res.ok) {
        if (notificacao) { notificacao.textContent = "Material excluído com sucesso!"; notificacao.className = "sucesso"; notificacao.style.display = "block"; }
        setTimeout(() => {
          if (notificacao) notificacao.style.display = "none";
          // garante redirecionamento CORRETO para o menu após excluir material
          window.location.href = 'menu.html';
        }, 900);
      } else {
        const msg = (res && res.error) ? res.error : "Erro ao excluir material!";
        if (notificacao) { notificacao.textContent = msg; notificacao.className = "erro"; notificacao.style.display = "block"; setTimeout(()=>{ notificacao.style.display = "none"; }, 3000); }
        else alert(msg);
      }
    } catch (err) {
      console.error('Erro ao excluir material via IPC:', err);
      const msg = (err && err.message) ? err.message : 'Erro ao excluir material!';
      if (notificacao) { notificacao.textContent = msg; notificacao.className = "erro"; notificacao.style.display = "block"; setTimeout(()=>{ notificacao.style.display = "none"; }, 3000); }
      else alert(msg);
    }
  };
});

// Função para obter parâmetro da URL
function getParametroUrl(nome) {
    try {
        const url = new URL(window.location.href);
        return url.searchParams.get(nome);
    } catch (_) {
        // fallback simples para ambientes sem URL (ou se window.location.href for estranho)
        const qs = window.location.search || (window.location.href.split('?')[1] || '');
        const match = qs.match(new RegExp('[?&]' + nome + '=([^&]*)'));
        return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
    }
}

// Carregar detalhes do material na página de detalhes (somente IPC - Electron)
document.addEventListener('DOMContentLoaded', async function() {
    if (!window.location.pathname.endsWith('detalhes-material.html')) return;
    const id = getParametroUrl('id');
    if (!id) return;

    // Feedback imediato
    const camposLoad = [
        'descricao-breve','descricao-completa','fabricante','codigo-fabricante',
        'valor-custo','valor','quantidade','und-medida','quantidade-segura','fornecedor'
    ];
    camposLoad.forEach(cid => {
        const el = document.getElementById(cid);
        if (el) {
            // usa value para inputs, textContent para spans se necessário
            if ('value' in el) el.value = 'Carregando...';
            else el.textContent = 'Carregando...';
        }
    });
    const spanCodigoInterno = document.querySelector('.codigo-interno');
    if (spanCodigoInterno) spanCodigoInterno.textContent = 'CARREGANDO...';

    if (!ipcRenderer) {
        alert('IPC não disponível. Esta tela requer execução dentro do Electron.');
        return;
    }

    try {
        // busca material e fornecedores em paralelo via IPC — rápido e determinístico
        const [mat, fornecedores] = await Promise.all([
            ipcRenderer.invoke('buscar-material', id),
            ipcRenderer.invoke('listar-fornecedores')
        ]);

        if (!mat) {
            alert('Item não encontrado!');
            window.location.href = 'menu.html';
            return;
        }

        // Preenche campos
        document.getElementById('descricao-breve').value = mat.descricao_breve || mat.descricaoBreve || '';
        document.getElementById('descricao-completa').value = mat.descricao_completa || mat.descricaoCompleta || '';
        document.getElementById('fabricante').value = mat.fabricante || '';
        document.getElementById('codigo-fabricante').value = mat.codigo_fabricante || mat.codigoFabricante || '';
        document.getElementById('valor-custo').value = (mat.valor_custo !== undefined && mat.valor_custo !== null) ? mat.valor_custo : '';
        document.getElementById('valor').value = (mat.valor !== undefined && mat.valor !== null) ? mat.valor : '';
        document.getElementById('quantidade').value = mat.quantidade ?? '';
        document.getElementById('und-medida').value = mat.und_medida || '';
        document.getElementById('quantidade-segura').value = mat.quantidade_segura ?? '';

        // Código interno / label
        const campoCodigoInterno = document.getElementById('codigo-interno');
        if (campoCodigoInterno && mat.id) campoCodigoInterno.value = formatarCodigoInterno(mat.id);
        if (spanCodigoInterno && mat.id) spanCodigoInterno.textContent = 'CÓDIGO INTERNO - ' + formatarCodigoInterno(mat.id);

        // Mapa de fornecedores e preenchimento do input/select
        const mapaFornecedores = {};
        (fornecedores || []).forEach(f => { mapaFornecedores[f.id] = f.nome; });

        const inputFornecedor = document.getElementById('fornecedor');
        if (inputFornecedor) {
            if (mat.fornecedor && mapaFornecedores[mat.fornecedor]) {
                inputFornecedor.value = `${mat.fornecedor} - ${mapaFornecedores[mat.fornecedor]}`;
            } else {
                inputFornecedor.value = mat.fornecedor || '';
            }
        }

        const selectFornecedor = document.getElementById('select-fornecedor');
        if (selectFornecedor) {
            selectFornecedor.innerHTML = '<option value="">Selecione o fornecedor</option>';
            (fornecedores || []).forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.id;
                opt.textContent = `${f.id} - ${f.nome}`;
                if (String(mat.fornecedor) === String(f.id)) opt.selected = true;
                selectFornecedor.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Erro ao carregar detalhes via IPC:', err);
        alert('Erro ao carregar dados do material.');
    }
});

// Função para formatar o código interno (adicione se não tiver)
function formatarCodigoInterno(codigo) {
    let str = codigo.toString().padStart(8, '0');
    return str.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
}

function mostrarNotificacaoEstoqueBaixo(id, descricao) {
    try {
        const texto = `ATENÇÃO: Material ${formatarCodigoInterno(id)} - ${descricao} atingiu a quantidade mínima.`;
        const duracao = 8000; // 8s
        const expires = Date.now() + duracao;

        // Salva mensagem com timestamp de expiração
        localStorage.setItem('notificacaoEstoqueBaixo', JSON.stringify({ msg: texto, expires }));

        // Exibe imediatamente na página atual pelo tempo restante
        _exibirNotificacaoElemento(texto, duracao);
    } catch (e) {
        console.error('Erro em mostrarNotificacaoEstoqueBaixo:', e);
    }
}

// Função interna que cria/exibe o elemento e agenda remoção
function _exibirNotificacaoElemento(texto, tempoMs) {
    try {
        let el = document.getElementById('notificacao-estoque-baixo');
        if (!el) {
            el = document.createElement('div');
            el.id = 'notificacao-estoque-baixo';
            // não sobrescrever estilos do CSS; apenas garante que exista
            document.body.appendChild(el);
        }

        el.innerHTML = texto;
        el.style.display = 'block';

        // Limpa timeout anterior se houver
        if (el._notifTimeout) {
            clearTimeout(el._notifTimeout);
        }

        // Agenda esconder + limpeza da chave do localStorage
        const timeout = setTimeout(() => {
            if (el) el.style.display = 'none';
            const raw = localStorage.getItem('notificacaoEstoqueBaixo');
            if (raw) {
                try {
                    const data = JSON.parse(raw);
                    if (data && data.expires && data.expires <= Date.now()) {
                        localStorage.removeItem('notificacaoEstoqueBaixo');
                    }
                } catch (_) { localStorage.removeItem('notificacaoEstoqueBaixo'); }
            }
        }, Math.max(0, tempoMs));

        el._notifTimeout = timeout;
    } catch (e) {
        console.error('_exibirNotificacaoElemento erro:', e);
    }
}

// Ao carregar qualquer página, verifica se há notificação agendada e a exibe pelo tempo restante
document.addEventListener('DOMContentLoaded', function() {
    try {
        const raw = localStorage.getItem('notificacaoEstoqueBaixo');
        if (!raw) return;

        const data = JSON.parse(raw);
        if (!data || !data.msg || !data.expires) {
            localStorage.removeItem('notificacaoEstoqueBaixo');
            return;
        }

        const restante = data.expires - Date.now();
        if (restante <= 0) {
            // já expirou
            localStorage.removeItem('notificacaoEstoqueBaixo');
            return;
        }

        // Exibe no elemento específico (CSS notificacao.css posiciona no canto inferior direito)
        _exibirNotificacaoElemento(data.msg, restante);
    } catch (e) {
        console.error('Erro ao processar notificação armazenada:', e);
        localStorage.removeItem('notificacaoEstoqueBaixo');
    }
});

// Helper: fetch JSON com timeout curto para fallback rápido (HTTP -> IPC)
async function fetchJson(url, timeoutMs = 500) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: ctrl.signal });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return await resp.json();
  } finally {
    clearTimeout(id);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const tbody = document.getElementById('tbody-materiais');
  const inputBusca = document.querySelector('.input-busca');
  const btnLupa = document.querySelector('.icone-lupa');
  if (!tbody) return;

  let materiaisCache = [];
  let mapaFornecedores = {};

  // Feedback imediato
  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#888">Carregando...</td></tr>';

  function renderizarTabela(materiais) {
    const rows = materiais.map(mat => {
      const fornecedorTexto = mat.fornecedor
        ? (mapaFornecedores[mat.fornecedor]
            ? `${mat.fornecedor} - ${mapaFornecedores[mat.fornecedor]}`
            : mat.fornecedor)
        : '';
      return `
        <tr>
          <td>${mat.id ? formatarCodigoInterno(mat.id) : ''}</td>
          <td>${mat.descricao_breve || ''}</td>
          <td>${mat.fabricante || ''}</td>
          <td>${mat.codigo_fabricante || ''}</td>
          <td>R$ ${Number(mat.valor || 0).toFixed(2)}</td>
          <td>${mat.quantidade ?? ''}</td>
          <td>${mat.und_medida || ''}</td>
          <td>${fornecedorTexto}</td>
          <td>
            <button onclick="window.location.href='detalhes-material.html?id=${mat.id}'">
              <img src="../imagens/Olho.png" class="icone-olho" alt="Olho">
              VISUALIZAR
            </button>
          </td>
        </tr>
      `;
    }).join('');
    tbody.innerHTML = rows || '<tr><td colspan="9" style="text-align:center;color:#888">Nenhum material encontrado.</td></tr>';
  }

  function filtrarMateriais() {
    const termo = (inputBusca?.value || '').trim().toLowerCase();
    if (!termo) return renderizarTabela(materiaisCache);
    const filtrados = materiaisCache.filter(mat =>
      (mat.id && formatarCodigoInterno(mat.id).toLowerCase().includes(termo)) ||
      (mat.descricao_breve && mat.descricao_breve.toLowerCase().includes(termo)) ||
      (mat.fabricante && mat.fabricante.toLowerCase().includes(termo)) ||
      (mat.codigo_fabricante && mat.codigo_fabricante.toLowerCase().includes(termo)) ||
      (mat.fornecedor && String(mat.fornecedor).toLowerCase().includes(termo))
    );
    renderizarTabela(filtrados);
  }

  function debounce(fn, ms) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  if (inputBusca) inputBusca.addEventListener('input', debounce(filtrarMateriais, 150));
  if (btnLupa) btnLupa.addEventListener('click', filtrarMateriais);

  async function carregar() {
    // HTTP e IPC em paralelo; usa o que responder primeiro
    const tentativas = [];

    tentativas.push(
      (async () => {
        const [mats, forns] = await Promise.all([
          fetchJson('http://localhost:3000/materiais', 500),
          fetchJson('http://localhost:3000/fornecedores', 500)
        ]);
        return { mats, forns };
      })()
    );

    if (ipcRenderer) {
      tentativas.push(
        (async () => {
          const [matsRes, fornsRes] = await Promise.allSettled([
            ipcRenderer.invoke('listar-materiais'),
            ipcRenderer.invoke('listar-fornecedores')
          ]);
          return {
            mats: matsRes.status === 'fulfilled' ? matsRes.value : [],
            forns: fornsRes.status === 'fulfilled' ? fornsRes.value : []
          };
        })()
      );
    }

    let resultado = null;
    try {
      resultado = await Promise.race(tentativas);
    } catch (_) {}

    // Fallbacks se necessário
    let materiais = resultado?.mats || [];
    let fornecedores = resultado?.forns || [];

    if ((!materiais.length || !fornecedores.length) && ipcRenderer) {
      try { if (!materiais.length) materiais = await ipcRenderer.invoke('listar-materiais'); } catch {}
      try { if (!fornecedores.length) fornecedores = await ipcRenderer.invoke('listar-fornecedores'); } catch {}
    }

    materiaisCache = materiais;
    mapaFornecedores = Object.fromEntries((fornecedores || []).map(f => [f.id, f.nome]));
    renderizarTabela(materiaisCache);
  }

  carregar();
});

document.addEventListener('DOMContentLoaded', function() {
    const btnEditar = document.querySelector('.icone-formulario[alt="Editar"]');
    const botoesEdicao = document.querySelector('.botoes-edicao');
    const campos = [
        'descricao-breve', 'descricao-completa', 'fabricante', 'codigo-fabricante',
        'fornecedor', 'valor', 'valor-custo', 'und-medida', 'quantidade-segura', 'quantidade'
    ];

    if (btnEditar && botoesEdicao) {
        btnEditar.onclick = function() {
            campos.forEach(id => {
                const campo = document.getElementById(id);
                if (campo) {
                    if (campo.tagName === 'SELECT') {
                        campo.disabled = false; // Ativa o select
                    } else {
                        campo.removeAttribute('readonly');
                    }
                }
            });
            botoesEdicao.style.display = 'block';
        };
    }

    const btnConfirmar = document.querySelector('.btn-confirmar-edicao');
    const btnCancelar = document.querySelector('.btn-cancelar-edicao');

    if (btnCancelar && botoesEdicao) {
        btnCancelar.onclick = function() {
            campos.forEach(id => {
                const campo = document.getElementById(id);
                if (campo) {
                    if (campo.tagName === 'SELECT') {
                        campo.disabled = true; // Desativa o select
                    } else {
                        campo.setAttribute('readonly', true);
                    }
                }
            });
            botoesEdicao.style.display = 'none';
        };
    }

    if (btnConfirmar) {
        btnConfirmar.onclick = async function() {
            const id = getParametroUrl('id');
            if (!id) return;
            const dados = {};
            campos.forEach(idCampo => {
                if (idCampo === 'fornecedor') {
                    const selectFornecedor = document.getElementById('select-fornecedor');
                    const inputFornecedor = document.getElementById('fornecedor');
                    if (selectFornecedor && selectFornecedor.style.display !== 'none') {
                        dados['fornecedor'] = selectFornecedor.value;
                    } else if (inputFornecedor) {
                        dados['fornecedor'] = (inputFornecedor.value || '').split(' - ')[0];
                    }
                } else {
                    const campo = document.getElementById(idCampo);
                    if (campo) {
                        if (idCampo === 'valor' || idCampo === 'valor-custo') {
                            dados[idCampo.replace(/-/g, '_')] = Number(campo.value.replace(/\D/g, "")) / 100;
                        } else if (idCampo === 'quantidade' || idCampo === 'quantidade-segura') {
                            dados[idCampo.replace(/-/g, '_')] = Number(campo.value) || 0;
                        } else {
                            dados[idCampo.replace(/-/g, '_')] = campo.value;
                        }
                    }
                }
            });

            try {
                let ok = false;
                let error = null;

                if (ipcRenderer) {
                    const res = await ipcRenderer.invoke('editar-material', id, dados);
                    ok = !!(res && res.ok);
                    error = res && res.error;
                } else {
                    const resp = await fetch(`http://localhost:3000/materiais/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dados)
                    });
                    ok = resp.ok;
                }

                const notificacao = document.getElementById('notificacao');
                if (ok) {
                    if (notificacao) {
                        notificacao.textContent = "Material atualizado com sucesso!";
                        notificacao.className = "sucesso";
                        notificacao.style.display = "block";
                    }

                    // Volta campos para readonly/desativa select
                    campos.forEach(idCampo => {
                        const campo = document.getElementById(idCampo);
                        if (campo) {
                            if (campo.tagName === 'SELECT') {
                                campo.disabled = true;
                                campo.style.display = 'none';
                                const inputFornecedor = document.getElementById('fornecedor');
                                if (inputFornecedor) inputFornecedor.style.display = '';
                            } else {
                                campo.setAttribute('readonly', true);
                            }
                        }
                    });
                    if (typeof botoesEdicao !== 'undefined' && botoesEdicao) botoesEdicao.style.display = 'none';

                    // Verifica quantidade atualizada e notifica se necessário
                    try {
                        let mat = null;
                        if (ipcRenderer) {
                            mat = await ipcRenderer.invoke('buscar-material', id);
                        } else {
                            const r = await fetch(`http://localhost:3000/materiais/${id}`);
                            if (r.ok) mat = await r.json();
                        }
                        if (mat && mat.quantidade !== undefined && mat.quantidade <= (mat.quantidade_segura ?? 0)) {
                            mostrarNotificacaoEstoqueBaixo(mat.id, mat.descricao_breve || mat.descricaoCompleta || '');
                        }
                    } catch (e) {
                        console.warn('Erro ao verificar quantidade após edição', e);
                    }

                    setTimeout(() => {
                        if (notificacao) notificacao.style.display = "none";
                        window.location.reload();
                    }, 1200);
                } else {
                    if (notificacao) {
                        notificacao.textContent = error || "Erro ao atualizar material!";
                        notificacao.className = "erro";
                        notificacao.style.display = "block";
                        setTimeout(() => { notificacao.style.display = "none"; }, 3000);
                    } else {
                        alert(error || "Erro ao atualizar material!");
                    }
                }
            } catch (err) {
                console.error('Erro ao salvar edição:', err);
                const notificacao = document.getElementById('notificacao');
                if (notificacao) {
                    notificacao.textContent = "Erro ao atualizar material!";
                    notificacao.className = "erro";
                    notificacao.style.display = "block";
                    setTimeout(() => { notificacao.style.display = "none"; }, 3000);
                } else {
                    alert('Erro ao atualizar material!');
                }
            }
        };
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const formFornecedor = document.getElementById('form-fornecedor');
    const notificacao = document.getElementById('notificacao');
    if (!formFornecedor) return;

    formFornecedor.onsubmit = async function(e) {
        e.preventDefault();

        const dados = {
            nome: document.getElementById('nome').value,
            razao_social: document.getElementById('razao-social').value,
            cnpj: document.getElementById('cnpj').value,
            inscricao_estadual: document.getElementById('inscricao-estadual').value,
            logradouro: document.getElementById('logradouro').value,
            numero: document.getElementById('numero').value,
            bairro: document.getElementById('bairro').value,
            municipio: document.getElementById('municipio').value,
            estado: document.getElementById('estado').value,
            telefone: document.getElementById('telefone').value,
            email: document.getElementById('email').value
        };

        try {
            let sucesso = false;
            let errMsg = null;

            if (ipcRenderer) {
                const res = await ipcRenderer.invoke('cadastrar-fornecedor', dados);
                // handler no main.js deve retornar { ok: true } ou { ok: false, error: '...' } ou o objeto criado
                if (res && (res.ok === true || res.id)) sucesso = true;
                else errMsg = res && res.error ? res.error : 'Erro ao cadastrar fornecedor (IPC).';
            } else {
                const resp = await fetch('http://localhost:3000/fornecedores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });
                if (resp.ok) {
                    sucesso = true;
                } else {
                    errMsg = 'Erro ao cadastrar fornecedor (HTTP).';
                }
            }

            if (sucesso) {
                if (notificacao) {
                    notificacao.textContent = "Fornecedor cadastrado com sucesso!";
                    notificacao.className = "sucesso";
                    notificacao.style.display = "block";
                }
                // opcional: limpar formulário
                formFornecedor.reset();

                setTimeout(() => {
                    if (notificacao) notificacao.style.display = "none";
                    // redireciona para menu (mantive comportamento anterior)
                    window.location.href = 'menu.html';
                }, 1500);
            } else {
                const msg = errMsg || 'Erro ao cadastrar fornecedor!';
                if (notificacao) {
                    notificacao.textContent = msg;
                    notificacao.className = "erro";
                    notificacao.style.display = "block";
                    setTimeout(() => { notificacao.style.display = "none"; }, 3000);
                } else {
                    alert(msg);
                }
            }
        } catch (err) {
            console.error('Erro no cadastro de fornecedor:', err);
            const msg = (err && err.message) ? err.message : 'Erro ao cadastrar fornecedor!';
            if (notificacao) {
                notificacao.textContent = msg;
                notificacao.className = "erro";
                notificacao.style.display = "block";
                setTimeout(() => { notificacao.style.display = "none"; }, 3000);
            } else {
                alert(msg);
            }
        }
    };
});

document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname.endsWith('consulta-fornecedor.html')) {
        const tbody = document.getElementById('tbody-fornecedores');
        const inputBusca = document.querySelector('.input-busca-fornecedor');
        const btnLupa = document.querySelector('.icone-lupa-fornecedor');
        const notificacao = document.getElementById('notificacao');
        if (!tbody) return;

        let fornecedoresCache = [];

        function mostrarCarregando() {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888">Carregando...</td></tr>';
        }

        function renderizarTabela(fornecedores) {
            if (!fornecedores || !fornecedores.length) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888">Nenhum fornecedor encontrado.</td></tr>';
                return;
            }
            tbody.innerHTML = fornecedores.map(f => `
                <tr>
                    <td>${f.id ?? ''}</td>
                    <td>${escapeHtml(f.nome ?? '')}</td>
                    <td>${escapeHtml(f.cnpj ?? '')}</td>
                    <td>${escapeHtml(f.telefone ?? '')}</td>
                    <td>${escapeHtml(f.email ?? '')}</td>
                    <td>
                        <button type="button" onclick="window.location.href='detalhes-fornecedor.html?id=${encodeURIComponent(f.id)}'">
                            <img src="../imagens/Olho.png" class="icone-olho" alt="Olho"> VISUALIZAR
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        function escapeHtml(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function filtrarFornecedores() {
            const termo = (inputBusca?.value || '').trim().toLowerCase();
            if (!termo) return renderizarTabela(fornecedoresCache);
            const filtrados = fornecedoresCache.filter(f =>
                (f.id && f.id.toString().includes(termo)) ||
                (f.nome && f.nome.toLowerCase().includes(termo)) ||
                (f.cnpj && f.cnpj.toLowerCase().includes(termo)) ||
                (f.telefone && f.telefone.toLowerCase().includes(termo)) ||
                (f.email && f.email.toLowerCase().includes(termo))
            );
            renderizarTabela(filtrados);
        }

    if (inputBusca) inputBusca.addEventListener('input', () => filtrarFornecedores());
    if (btnLupa) btnLupa.addEventListener('click', filtrarFornecedores);

    async function carregarFornecedores() {
        mostrarCarregando();
        try {
            let fornecedores = [];
            // Prioriza IPC no Electron
            if (ipcRenderer) {
                try {
                    const res = await ipcRenderer.invoke('listar-fornecedores');
                    if (Array.isArray(res)) fornecedores = res;
                    else if (res && res.fornecedores) fornecedores = res.fornecedores;
                } catch (e) {
                    console.warn('IPC listar-fornecedores falhou, tentando HTTP:', e);
                }
            }

            // Fallback HTTP se não obteve nada via IPC
            if (!fornecedores.length) {
                try {
                    const resp = await fetch('http://localhost:3000/fornecedores');
                    if (resp.ok) fornecedores = await resp.json();
                } catch (e) {
                    console.warn('Fetch fornecedores falhou:', e);
                }
            }

            fornecedoresCache = Array.isArray(fornecedores) ? fornecedores : [];
            renderizarTabela(fornecedoresCache);
        } catch (err) {
            console.error('Erro ao carregar fornecedores:', err);
            if (notificacao) {
                notificacao.textContent = 'Erro ao carregar fornecedores.';
                notificacao.className = 'erro';
                notificacao.style.display = 'block';
                setTimeout(() => { notificacao.style.display = 'none'; }, 3000);
            }
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888">Erro ao carregar fornecedores.</td></tr>';
        }
    }

    carregarFornecedores();
}
});

// Substitua o bloco antigo de detalhes-fornecedor por este (usa IPC quando disponível)
document.addEventListener('DOMContentLoaded', async function() {
    if (!window.location.pathname.endsWith('detalhes-fornecedor.html')) return;
    const id = getParametroUrl('id');
    const campos = [
        'id', 'nome', 'razao-social', 'cnpj', 'inscricao-estadual',
        'logradouro', 'numero', 'bairro', 'municipio', 'estado', 'telefone', 'email'
    ];
    const notificacao = document.getElementById('notificacao');
    if (!id) return;

    // feedback imediato
    campos.forEach(c => {
        const el = document.getElementById(c);
        if (el) el.value = 'Carregando...';
    });
    const spanCodigo = document.querySelector('.codigo-interno');
    if (spanCodigo) spanCodigo.textContent = 'CARREGANDO...';

    try {
        let fornecedor = null;

        // tenta IPC primeiro
        if (ipcRenderer) {
            try { fornecedor = await ipcRenderer.invoke('buscar-fornecedor', id); } catch (e) { console.warn('IPC buscar-fornecedor falhou:', e); fornecedor = null; }
        }

        // fallback HTTP
        if (!fornecedor) {
            try {
                const resp = await fetch(`http://localhost:3000/fornecedores/${encodeURIComponent(id)}`);
                if (resp.ok) fornecedor = await resp.json();
            } catch (e) { console.warn('Fetch fornecedor falhou:', e); }
        }

        if (!fornecedor) {
            if (notificacao) {
                notificacao.textContent = 'Fornecedor não encontrado!';
                notificacao.className = 'erro';
                notificacao.style.display = 'block';
                setTimeout(() => { notificacao.style.display = 'none'; window.location.href = 'consulta-fornecedor.html'; }, 1400);
            } else {
                alert('Fornecedor não encontrado!');
                window.location.href = 'consulta-fornecedor.html';
            }
            return;
        }

        // preenche campos (converte nomes com '-' para '_' nas keys)
        campos.forEach(campo => {
            const el = document.getElementById(campo);
            if (!el) return;
            const key = campo.replace(/-/g, '_');
            el.value = fornecedor[key] !== undefined && fornecedor[key] !== null ? fornecedor[key] : (fornecedor[campo] ?? '');
        });

        if (spanCodigo) spanCodigo.textContent = 'CÓDIGO FORNECEDOR - ' + (fornecedor.id ?? '');
    } catch (err) {
        console.error('Erro ao carregar detalhes do fornecedor:', err);
        if (notificacao) {
            notificacao.textContent = 'Erro ao carregar fornecedor.';
            notificacao.className = 'erro';
            notificacao.style.display = 'block';
            setTimeout(() => { notificacao.style.display = 'none'; }, 3000);
        } else {
            alert('Erro ao carregar fornecedor.');
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Somente na tela de detalhes do fornecedor
    if (!window.location.pathname.endsWith('detalhes-fornecedor.html')) return;

    const btnEditar = document.querySelector('.icone-formulario[alt="Editar"]');
    const form = document.getElementById('form-detalhes-fornecedor');
    const notificacao = document.getElementById('notificacao');
    const campos = [
        'nome', 'razao-social', 'cnpj', 'inscricao-estadual',
        'logradouro', 'numero', 'bairro', 'municipio', 'estado', 'telefone', 'email'
    ];
    let valoresOriginais = {};

    if (!form || !btnEditar) return;

    btnEditar.addEventListener('click', function() {
        // salva valores e habilita edição
        campos.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                valoresOriginais[id] = el.value;
                el.removeAttribute('readonly');
            }
        });

        // mostra botões de edição (cria se necessário)
        let container = form.querySelector('.botoes-edicao');
        if (!container) {
            container = document.createElement('div');
            container.className = 'botoes-edicao';
            container.style.display = 'flex';
            container.style.gap = '12px';
            container.innerHTML = `
                <button type="button" class="btn-confirmar-edicao">SALVAR</button>
                <button type="button" class="btn-cancelar-edicao">CANCELAR</button>
            `;
            form.appendChild(container);

            // Confirmar: salva via IPC ou HTTP
            container.querySelector('.btn-confirmar-edicao').onclick = async function() {
                const idFornecedor = getParametroUrl('id');
                if (!idFornecedor) return;

                const dados = {};
                campos.forEach(idCampo => {
                    const campo = document.getElementById(idCampo);
                    if (campo) dados[idCampo.replace(/-/g, '_')] = campo.value;
                });

                try {
                    let sucesso = false;
                    let erroMsg = null;

                    if (ipcRenderer) {
                        const res = await ipcRenderer.invoke('editar-fornecedor', idFornecedor, dados);
                        if (res && (res.ok === true || res.id || res.updated)) sucesso = true;
                        else erroMsg = res && res.error ? res.error : 'Erro ao atualizar (IPC)';
                    } else {
                        const resp = await fetch(`http://localhost:3000/fornecedores/${encodeURIComponent(idFornecedor)}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(dados)
                        });
                        if (resp.ok) sucesso = true;
                        else erroMsg = 'Erro ao atualizar (HTTP)';
                    }

                    if (sucesso) {
                        if (notificacao) {
                            notificacao.textContent = "Fornecedor atualizado com sucesso!";
                            notificacao.className = "sucesso";
                            notificacao.style.display = "block";
                        }
                        // aplica readonly e atualiza valoresOriginais
                        campos.forEach(id => {
                            const campo = document.getElementById(id);
                            if (campo) {
                                campo.setAttribute('readonly', true);
                                valoresOriginais[id] = campo.value;
                            }
                        });
                        // esconde botões
                        if (container) container.style.display = 'none';

                        setTimeout(() => {
                            if (notificacao) notificacao.style.display = 'none';
                        }, 1400);
                    } else {
                        const msg = erroMsg || 'Erro ao atualizar fornecedor!';
                        if (notificacao) {
                            notificacao.textContent = msg;
                            notificacao.className = "erro";
                            notificacao.style.display = "block";
                            setTimeout(() => { notificacao.style.display = "none"; }, 3000);
                        } else {
                            alert(msg);
                        }
                    }
                } catch (err) {
                    console.error('Erro ao salvar edição fornecedor:', err);
                    const msg = (err && err.message) ? err.message : 'Erro ao atualizar fornecedor!';
                    if (notificacao) {
                        notificacao.textContent = msg;
                        notificacao.className = "erro";
                        notificacao.style.display = "block";
                        setTimeout(() => { notificacao.style.display = "none"; }, 3000);
                    } else {
                        alert(msg);
                    }
                }
            };

            // Cancelar: restaura valores e esconde botões
            container.querySelector('.btn-cancelar-edicao').onclick = function() {
                campos.forEach(id => {
                    const campo = document.getElementById(id);
                    if (campo) {
                        campo.value = valoresOriginais[id] ?? '';
                        campo.setAttribute('readonly', true);
                    }
                });
                container.style.display = 'none';
            };
        } else {
            container.style.display = 'flex';
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
  if (!window.location.pathname.endsWith('detalhes-fornecedor.html')) return;
  const btnExcluirIcone = document.querySelector('.icone-formulario[alt="Excluir"]');
  const modal = document.getElementById('modal-excluir-fornecedor') || document.getElementById('modal-excluir');
  if (!modal) return;
  const btnCancelar = modal.querySelector('.btn-cancelar');
  const btnConfirmar = modal.querySelector('.btn-excluir');
  const notificacao = document.getElementById('notificacao');
  if (btnExcluirIcone) btnExcluirIcone.onclick = () => modal.style.display = 'flex';
  if (btnCancelar) btnCancelar.onclick = () => modal.style.display = 'none';
  if (!btnConfirmar) return;

  btnConfirmar.onclick = async function() {
    modal.style.display = 'none';
    const id = getParametroUrl('id');
    if (!id) return;
    try {
      if (ipcRenderer) {
        const res = await ipcRenderer.invoke('excluir-fornecedor', id);
        if (res && res.ok) {
          if (notificacao) { notificacao.textContent = "Fornecedor excluído com sucesso!"; notificacao.className = "sucesso"; notificacao.style.display = "block"; }
          setTimeout(() => { if (notificacao) notificacao.style.display = "none"; window.location.href = 'consulta-fornecedor.html'; }, 900);
          return;
        } else {
          const msg = (res && res.error) ? res.error : 'Erro ao excluir fornecedor!';
          if (notificacao) { notificacao.textContent = msg; notificacao.className = "erro"; notificacao.style.display = "block"; setTimeout(()=>{ notificacao.style.display = "none"; }, 3000); }
          else alert(msg);
          return;
        }
      }
      // fallback HTTP
      const resp = await fetch(`http://localhost:3000/fornecedores/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (resp.ok) {
        if (notificacao) { notificacao.textContent = "Fornecedor excluído com sucesso!"; notificacao.className = "sucesso"; notificacao.style.display = "block"; }
        setTimeout(() => { if (notificacao) notificacao.style.display = "none"; window.location.href = 'consulta-fornecedor.html'; }, 900);
      } else {
        const txt = await resp.text().catch(()=>null);
        const msg = txt || 'Erro ao excluir fornecedor (HTTP).';
        if (notificacao) { notificacao.textContent = msg; notificacao.className = "erro"; notificacao.style.display = "block"; setTimeout(()=>{ notificacao.style.display = "none"; }, 3000); }
        else alert(msg);
      }
    } catch (err) {
      console.error('Erro ao excluir fornecedor:', err);
      const msg = (err && err.message) ? err.message : 'Erro ao excluir fornecedor!';
      if (notificacao) { notificacao.textContent = msg; notificacao.className = "erro"; notificacao.style.display = "block"; setTimeout(()=>{ notificacao.style.display = "none"; }, 3000); }
      else alert(msg);
    }
  };
});

function formatarMoeda(valor) {
    valor = valor.replace(/\D/g, "");
    valor = (parseInt(valor, 10) / 100).toFixed(2) + "";
    valor = valor.replace(".", ",");
    valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    return "R$ " + valor;
}

function aplicarMascaraMoeda(input) {
    input.addEventListener('input', function(e) {
        let valor = e.target.value.replace(/\D/g, "");
        if (valor === "") valor = "0";
        valor = (parseInt(valor, 10) / 100).toFixed(2);
        valor = valor.replace(".", ",");
        valor = valor.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
        e.target.value = "R$ " + valor;
    });
}

// Ao carregar a página, aplique a máscara nos campos desejados:
document.addEventListener('DOMContentLoaded', function() {
    const campoCusto = document.getElementById('valor-custo');
    const campoVenda = document.getElementById('valor');
    if (campoCusto) aplicarMascaraMoeda(campoCusto);
    if (campoVenda) aplicarMascaraMoeda(campoVenda);
});

document.addEventListener('DOMContentLoaded', async function() {
    const selectFornecedor = document.getElementById('fornecedor');
    if (!selectFornecedor) return;

    // estado inicial
    selectFornecedor.innerHTML = '<option value="">Carregando...</option>';

    let fornecedores = [];

    // tenta IPC (Electron)
    try {
        if (ipcRenderer) {
            const res = await ipcRenderer.invoke('listar-fornecedores');
            if (Array.isArray(res)) fornecedores = res;
        }
    } catch (e) {
        console.warn('IPC listar-fornecedores falhou:', e);
    }

    // fallback HTTP (silencioso, sem deixar erro estourar no console)
    if (!fornecedores.length) {
        try {
            const resp = await fetch('http://localhost:3000/fornecedores');
            if (resp.ok) fornecedores = await resp.json();
        } catch (e) {
            console.warn('Fetch listar-fornecedores falhou:', e);
        }
    }

    // popula select
    selectFornecedor.innerHTML = '<option value="">Selecione o fornecedor</option>';
    if (fornecedores && fornecedores.length) {
        fornecedores.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = `${f.id} - ${f.nome}`;
            selectFornecedor.appendChild(opt);
        });
    } else {
        const opt = document.createElement('option');
        opt.value = '';
        opt.disabled = true;
        opt.textContent = 'Nenhum fornecedor disponível';
        selectFornecedor.appendChild(opt);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const btnEditar = document.querySelector('.icone-formulario[alt="Editar"]');
    const inputFornecedor = document.getElementById('fornecedor');
    const selectFornecedor = document.getElementById('select-fornecedor');

    if (btnEditar && inputFornecedor && selectFornecedor) {
        btnEditar.addEventListener('click', function() {
            inputFornecedor.style.display = 'none';
            selectFornecedor.style.display = '';
            selectFornecedor.disabled = false;
        });
    }

    // Se quiser voltar ao modo visualizacao ao cancelar edicao:
    const btnCancelar = document.querySelector('.btn-cancelar-edicao');
    if (btnCancelar && inputFornecedor && selectFornecedor) {
        btnCancelar.addEventListener('click', function() {
            inputFornecedor.style.display = '';
            selectFornecedor.style.display = 'none';
            selectFornecedor.disabled = true;
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const btnEditar = document.querySelector('.icone-formulario[alt="Editar"]');
    const btnCancelar = document.querySelector('.btn-cancelar-edicao');
    const inputFornecedor = document.getElementById('fornecedor');
    const selectFornecedor = document.getElementById('select-fornecedor');

    // Ao clicar em editar, mostra o select e esconde o input
    if (btnEditar && inputFornecedor && selectFornecedor) {
        btnEditar.addEventListener('click', function() {
            inputFornecedor.style.display = 'none';
            selectFornecedor.style.display = '';
            selectFornecedor.disabled = false;
        });
    }

    // Ao clicar em cancelar, volta para o input readonly
    if (btnCancelar && inputFornecedor && selectFornecedor) {
        btnCancelar.addEventListener('click', function() {
            inputFornecedor.style.display = '';
            selectFornecedor.style.display = 'none';
            selectFornecedor.disabled = true;
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const tbody = document.getElementById('tbody-materiais');

    // Se não houver tabela nesta página, não executa o restante
    if (!tbody) return;

    async function carregarMateriais() {
        let materiais = [];
        let fornecedores = [];
        try {
            // Busca materiais e fornecedores em paralelo
            const [respMateriais, respFornecedores] = await Promise.all([
                fetch('http://localhost:3000/materiais'),
                fetch('http://localhost:3000/fornecedores')
            ]);
            if (!respMateriais.ok || !respFornecedores.ok) throw new Error('HTTP');
            materiais = await respMateriais.json();
            fornecedores = await respFornecedores.json();
        } catch (err) {
            // Fallback: usa IPC do Electron se disponível
            if (ipcRenderer) {
                try {
                    materiais = await ipcRenderer.invoke('listar-materiais');
                } catch (_) { materiais = []; }
                try {
                    fornecedores = await ipcRenderer.invoke('listar-fornecedores');
                } catch (_) { fornecedores = []; }
            }
        }

        // Cria um mapa de id => nome
        const mapaFornecedores = {};
        fornecedores.forEach(f => {
            mapaFornecedores[f.id] = f.nome;
        });

        renderizarTabela(materiais, mapaFornecedores);
    }

    function renderizarTabela(materiais, mapaFornecedores) {
        tbody.innerHTML = '';
        materiais.forEach(mat => {
            // Monta o texto "código - nome" se existir fornecedor
            let fornecedorTexto = '';
            if (mat.fornecedor && mapaFornecedores[mat.fornecedor]) {
                fornecedorTexto = `${mat.fornecedor} - ${mapaFornecedores[mat.fornecedor]}`;
            } else if (mat.fornecedor) {
                fornecedorTexto = mat.fornecedor;
            }
            tbody.innerHTML += `
                <tr>
                    <td>${mat.id ? formatarCodigoInterno(mat.id) : ''}</td>
                    <td>${mat.descricao_breve}</td>
                    <td>${mat.fabricante}</td>
                    <td>${mat.codigo_fabricante}</td>
                    <td>R$ ${Number(mat.valor_custo).toFixed(2)}</td>
                    <td>${mat.quantidade}</td>
                    <td>${mat.und_medida}</td>
                    <td>${fornecedorTexto}</td>
                    <td>
                        <button onclick="window.location.href='detalhes-material.html?id=${mat.id}'">
                            <img src="../imagens/Olho.png" class="icone-olho" alt="Olho">
                            VISUALIZAR
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    carregarMateriais();
});

document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.endsWith('historico-movimentacoes.html')) return;

    const form = document.getElementById('form-historico');
    const tabela = document.getElementById('tabela-historico');
    const mensagem = document.getElementById('mensagem-hist');
    if (!form || !tabela) return;
    const tbody = tabela.querySelector('tbody');

    function formatMoney(n) {
        return 'R$ ' + Number(n || 0).toFixed(2).replace('.', ',');
    }

    function safe(v) { return v === null || v === undefined ? '' : String(v); }

    form.onsubmit = async function(e) {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        try {
            let codigo = (document.getElementById('codigo-interno-hist')?.value || '').trim();
            codigo = codigo.replace(/\./g, '').replace(/\D/g, '');
            if (!codigo) {
                mensagem.textContent = 'Informe o código interno.';
                return;
            }

            // reset UI
            mensagem.textContent = '';
            tabela.style.display = 'none';
            tbody.innerHTML = '';

            let historico = [];

            // PRIORIDADE: IPC (Electron) - debug log adicionado
            if (ipcRenderer) {
                try {
                    const res = await ipcRenderer.invoke('historico-movimentacoes', codigo);
                    console.log('[renderer] historico-movimentacoes result:', res);
                    // aceitar formatos: array directly, { rows: [...] }, { movimentacoes: [...] }
                    if (Array.isArray(res)) historico = res;
                    else if (res && Array.isArray(res.rows)) historico = res.rows;
                    else if (res && Array.isArray(res.movimentacoes)) historico = res.movimentacoes;
                    else if (res && res.ok === false) {
                        mensagem.textContent = res.error || 'Erro ao buscar histórico via Electron.';
                        return;
                    } else {
                        historico = [];
                    }
                } catch (err) {
                    console.warn('IPC historico-movimentacoes falhou:', err && err.message ? err.message : err);
                    historico = [];
                }
            }

            // FALLBACK HTTP somente se IPC não retornou nada
            if (!historico.length) {
                try {
                    const resp = await fetch(`http://localhost:3000/historico/${encodeURIComponent(codigo)}`);
                    if (!resp.ok) {
                        mensagem.textContent = `Erro ao buscar histórico (HTTP ${resp.status}).`;
                        return;
                    }
                    const data = await resp.json();
                    historico = Array.isArray(data) ? data : (data.rows || []);
                    console.log('[renderer] historico HTTP result:', historico);
                } catch (err) {
                    mensagem.textContent = 'Servidor HTTP indisponível. Execute o app principal (Electron).';
                    return;
                }
            }

            if (!historico.length) {
                mensagem.textContent = 'Nenhuma movimentação encontrada!';
                return;
            }

            // Monta linhas com colunas: Tipo, Data, Valor Custo, Valor Venda, Fornecedor, Quantidade, Unidade
            const rows = historico.map(mov => {
                const tipo = safe(mov.tipo);
                const data = mov.data ? new Date(mov.data).toLocaleString('pt-BR') : '';
                const vc = formatMoney(mov.valor_custo ?? mov.valorCusto ?? mov['valor_custo']);
                const vv = formatMoney(mov.valor_venda ?? mov.valorVenda ?? mov['valor_venda']);
                const fornecedorTexto = (mov.fornecedor_nome || mov.fornecedor)
                    ? `${safe(mov.fornecedor)}${mov.fornecedor_nome ? ' - ' + safe(mov.fornecedor_nome) : ''}`
                    : (mov.fornecedor ? safe(mov.fornecedor) : '');
                const quantidade = safe(mov.quantidade ?? mov.qtd ?? mov['quantidade']);
                const und = safe(mov.und_medida ?? mov.undMedida ?? mov.unidade ?? mov['und_medida'] ?? mov.und);
                return `<tr>
                    <td>${tipo}</td>
                    <td>${data}</td>
                    <td>${vc}</td>
                    <td>${vv}</td>
                    <td>${fornecedorTexto}</td>
                    <td>${quantidade}</td>
                    <td>${und}</td>
                </tr>`;
            }).join('');

            tbody.innerHTML = rows;

            // garante que o wrapper e a tabela fiquem visíveis
            const wrapper = document.querySelector('.tabela-historico-wrapper');
            if (wrapper) wrapper.style.display = ''; // remove display:none definido no HTML
            if (tabela) tabela.style.display = tabela.tagName === 'TABLE' ? 'table' : '';

        } catch (err) {
            console.error('Erro ao buscar histórico:', err);
            mensagem.textContent = 'Erro ao buscar histórico!';
        } finally {
            if (btn) btn.disabled = false;
        }
    };
});

document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.endsWith('historico-movimentacoes.html')) return;

    const form = document.getElementById('form-historico');
    if (!form) return;

    // tenta encontrar botão de consulta por id, class ou dentro do form
    let btnConsultar = document.getElementById('btn-consultar-hist')
        || form.querySelector('.btn-consultar-hist')
        || form.querySelector('button[type="submit"]')
        || document.querySelector('[data-action="consultar-historico"]');

    // Se o botão existir e não for do tipo submit, liga o click para disparar requestSubmit()
    if (btnConsultar && btnConsultar.getAttribute('type') !== 'submit') {
        btnConsultar.addEventListener('click', function (ev) {
            ev.preventDefault();
            // requestSubmit() dispara o evento 'submit' do form (melhor que form.submit() por disparar validação/handlers)
            if (typeof form.requestSubmit === 'function') form.requestSubmit();
            else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const formCadastroMaterial = document.getElementById('form-cadastro-material');
    const notificacao = document.getElementById('notificacao');
    if (!formCadastroMaterial) return;

    function parseCurrencyToNumber(str) {
        if (!str) return 0;
        // remove tudo que não seja dígito
        const apenasDigitos = String(str).replace(/\D/g, '');
        return (Number(apenasDigitos) / 100) || 0;
    }

    formCadastroMaterial.onsubmit = async function(e) {
        e.preventDefault();
        const btnSubmit = formCadastroMaterial.querySelector('button[type="submit"]') || null;
        if (btnSubmit) btnSubmit.disabled = true;

        // coleta dados do formulário (ajuste nomes para o backend)
        const fornecedorInput = document.getElementById('fornecedor');
        const selectFornecedor = document.getElementById('select-fornecedor');
        const fornecedorValor = (selectFornecedor && selectFornecedor.style.display !== 'none' && !selectFornecedor.disabled)
            ? selectFornecedor.value
            : (fornecedorInput ? (String(fornecedorInput.value).split(' - ')[0] || '') : '');

        const dados = {
            descricao_breve: document.getElementById('descricao-breve').value.trim(),
            fabricante: document.getElementById('fabricante').value.trim(),
            valor_custo: parseCurrencyToNumber(document.getElementById('valor-custo').value),
            valor: parseCurrencyToNumber(document.getElementById('valor').value),
            codigo_fabricante: document.getElementById('codigo-fabricante').value.trim(),
            descricao_completa: document.getElementById('descricao-completa').value.trim(),
            quantidade: Number(document.getElementById('quantidade').value) || 0,
            und_medida: document.getElementById('und-medida').value.trim(),
            fornecedor: fornecedorValor || null,
            quantidade_segura: Number(document.getElementById('quantidade-segura').value) || 0
        };

        try {
            let sucesso = false;
            let erroMsg = null;

            if (ipcRenderer) {
                // usa IPC no Electron
                const res = await ipcRenderer.invoke('cadastrar-material', dados);
                if (res && (res.ok === true || res.id || res.insertedId)) sucesso = true;
                else erroMsg = (res && res.error) ? res.error : 'Erro ao cadastrar material (IPC).';
            } else {
                // fallback HTTP
                const resp = await fetch('http://localhost:3000/materiais', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });
                if (resp.ok) sucesso = true;
                else erroMsg = 'Erro ao cadastrar material (HTTP).';
            }

            if (sucesso) {
                if (notificacao) {
                    notificacao.textContent = "Material cadastrado com sucesso!";
                    notificacao.className = "sucesso";
                    notificacao.style.display = "block";
                }
                formCadastroMaterial.reset();
                setTimeout(() => {
                    if (notificacao) notificacao.style.display = "none";
                    window.location.href = 'menu.html';
                }, 1400);
            } else {
                if (notificacao) {
                    notificacao.textContent = erroMsg || 'Erro ao cadastrar material!';
                    notificacao.className = "erro";
                    notificacao.style.display = "block";
                    setTimeout(() => { notificacao.style.display = "none"; }, 3000);
                } else {
                    alert(erroMsg || 'Erro ao cadastrar material!');
                }
            }
        } catch (err) {
            console.error('Erro no cadastro de material:', err);
            const msg = (err && err.message) ? err.message : 'Erro ao cadastrar material!';
            if (notificacao) {
                notificacao.textContent = msg;
                notificacao.className = "erro";
                notificacao.style.display = "block";
                setTimeout(() => { notificacao.style.display = "none"; }, 3000);
            } else {
                alert(msg);
            }
        } finally {
            if (btnSubmit) btnSubmit.disabled = false;
        }
    };
});

document.addEventListener('DOMContentLoaded', async function() {
    if (!window.location.pathname.endsWith('estoque-baixo.html')) return;

    const tbody = document.getElementById('tbody-estoque-baixo');
    if (!tbody) return;

    // estado inicial
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888">Carregando...</td></tr>';

    try {
        let materiais = [];
        let fornecedores = [];

        // tenta IPC (Electron) primeiro
        if (ipcRenderer) {
            try {
                const mats = await ipcRenderer.invoke('listar-materiais');
                materiais = Array.isArray(mats) ? mats : (mats && mats.materiais ? mats.materiais : []);
            } catch (e) {
                console.warn('IPC listar-materiais falhou:', e);
            }
            try {
                const forns = await ipcRenderer.invoke('listar-fornecedores');
                fornecedores = Array.isArray(forns) ? forns : (forns && forns.fornecedores ? forns.fornecedores : []);
            } catch (e) {
                console.warn('IPC listar-fornecedores falhou:', e);
            }
        }

        // fallback HTTP se necessário (silencioso)
        if (!materiais.length) {
            try {
                const resp = await fetch('http://localhost:3000/materiais/estoque-baixo');
                if (resp.ok) materiais = await resp.json();
            } catch (e) {
                console.warn('Fetch /materiais/estoque-baixo falhou:', e);
            }
        }
        if (!fornecedores.length) {
            try {
                const resp = await fetch('http://localhost:3000/fornecedores');
                if (resp.ok) fornecedores = await resp.json();
            } catch (e) {
                console.warn('Fetch /fornecedores falhou:', e);
            }
        }

        // Caso o endpoint /materiais/estoque-baixo não exista e tenhamos todos os materiais,
        // filtra localmente por quantidade <= quantidade_segura
        let materiaisFiltrados = [];
        if (Array.isArray(materiais) && materiais.length) {
            materiaisFiltrados = materiais.filter(m => {
                // considera somente itens com propriedades numéricas
                const q = Number(m.quantidade ?? m.qty ?? 0);
                const qSeg = Number(m.quantidade_segura ?? m.quantidadeSegura ?? 0);
                return !isNaN(q) && !isNaN(qSeg) && q <= qSeg;
            });
        }

        // mapa de fornecedores
        const mapaFornecedores = Object.fromEntries((fornecedores || []).map(f => [f.id, f.nome]));

        // render
        if (!materiaisFiltrados.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888">Nenhum material em quantidade mínima.</td></tr>';
            return;
        }

        const rows = materiaisFiltrados.map(mat => {
            const fornecedorTexto = mat.fornecedor
                ? (mapaFornecedores[mat.fornecedor] ? `${mat.fornecedor} - ${mapaFornecedores[mat.fornecedor]}` : mat.fornecedor)
                : '';
            const idFormat = mat.id ? formatarCodigoInterno(mat.id) : '';
            const valorCusto = Number(mat.valor_custo ?? mat.valorCusto ?? 0).toFixed(2);
            return `
                <tr>
                    <td>${idFormat}</td>
                    <td>${mat.descricao_breve ?? ''}</td>
                    <td>${mat.fabricante ?? ''}</td>
                    <td>${fornecedorTexto}</td>
                    <td>${mat.quantidade ?? ''}</td>
                    <td>${mat.und_medida ?? ''}</td>
                    <td>R$ ${valorCusto}</td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    } catch (err) {
        console.error('Erro ao carregar estoque baixo:', err);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888">Erro ao carregar materiais.</td></tr>';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const formMov = document.getElementById('form-movimentacao');
    const mensagemMov = document.getElementById('mensagem-mov');
    if (!formMov) return;

    formMov.onsubmit = async function(e) {
        e.preventDefault();
        const btn = formMov.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        try {
            const tipoEl = document.getElementById('tipo-mov');
            const tipo = (tipoEl && tipoEl.value) ? tipoEl.value.toLowerCase() : 'entrada';

            let codigo_interno = (document.getElementById('codigo-interno')?.value || '').trim();
            codigo_interno = codigo_interno.replace(/\./g, '').replace(/\D/g, '');
            if (!codigo_interno) throw new Error('Informe o código interno do material.');

            const quantidade = Number(document.getElementById('quantidade-mov')?.value || 0);
            if (!quantidade || quantidade <= 0) throw new Error('Informe uma quantidade válida.');

            // prepara payload
            const payload = { tipo, codigo_interno: Number(codigo_interno), quantidade };

            // Prioriza IPC no Electron
            let resultado = null;
            if (ipcRenderer) {
                resultado = await ipcRenderer.invoke('movimentar-material', payload);
            } else {
                // fallback HTTP (mantido para compatibilidade)
                const resp = await fetch('http://localhost:3000/materiais/movimentacao', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                resultado = await resp.json();
                if (!resp.ok) resultado = { ok: false, error: resultado.error || resultado.message || 'Erro HTTP' };
            }

            if (resultado && resultado.ok) {
                // mostra mensagem de sucesso
                if (mensagemMov) {
                    mensagemMov.textContent = (resultado.message || 'Movimentação registrada com sucesso!') +
                                              (resultado.novaQuantidade !== undefined ? ' Nova quantidade: ' + resultado.novaQuantidade : '');
                    mensagemMov.style.color = 'green';
                }

                // atualiza campo de quantidade exibido na página se existir
                const campoQtd = document.getElementById('quantidade') || document.getElementById('quantidade-atual');
                if (campoQtd) {
                    if ('value' in campoQtd) campoQtd.value = resultado.novaQuantidade ?? campoQtd.value;
                    else campoQtd.textContent = resultado.novaQuantidade ?? campoQtd.textContent;
                }

                // Verifica material atualizado via IPC e mostra notificação se estiver abaixo do seguro
                try {
                    if (ipcRenderer) {
                        const matId = resultado.material_id ?? payload.codigo_interno;
                        const mat = await ipcRenderer.invoke('buscar-material', String(matId));
                        const qtdAtual = Number(mat?.quantidade ?? resultado.novaQuantidade ?? NaN);
                        const qtdSegura = Number(mat?.quantidade_segura ?? mat?.quantidadeSegura ?? NaN);
                        if (!isNaN(qtdAtual) && !isNaN(qtdSegura) && qtdAtual <= qtdSegura) {
                            mostrarNotificacaoEstoqueBaixo(mat.id ?? matId, mat.descricao_breve || mat.descricaoCompleta || mat.descricao || '');
                        }
                    }
                } catch (e) {
                    console.warn('Erro ao verificar estoque após movimentação:', e);
                }

                setTimeout(() => { window.location.href = 'menu.html'; }, 1200);
            } else {
                const errMsg = (resultado && (resultado.error || resultado.message)) || 'Erro ao registrar movimentação.';
                if (mensagemMov) {
                    mensagemMov.textContent = errMsg;
                    mensagemMov.style.color = 'red';
                } else {
                    alert(errMsg);
                }
            }
        } catch (err) {
            console.error('Erro ao submeter movimentação:', err);
            if (mensagemMov) {
                mensagemMov.textContent = err.message || 'Erro ao processar movimentação.';
                mensagemMov.style.color = 'red';
            } else {
                alert(err.message || 'Erro ao processar movimentação.');
            }
        } finally {
            if (btn) btn.disabled = false;
        }
    };
});

/* ====== Módulo consolidado para fornecedor / select ====== */
async function loadFornecedores() {
  try {
    if (ipcRenderer) {
      const res = await ipcRenderer.invoke('listar-fornecedores');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.fornecedores)) return res.fornecedores;
    }
  } catch (e) { console.warn('IPC listar-fornecedores falhou:', e); }
  try {
    const forns = await fetchJson('http://localhost:3000/fornecedores', 700);
    if (Array.isArray(forns)) return forns;
  } catch (_) {}
  return [];
}

(function fornecedorModule() {
  function setupExpandableSelects() {
    const selector = '.select-wrapper select, select#select-fornecedor';
    document.querySelectorAll(selector).forEach(sel => {
      if (sel._expandableInit) return;
      sel._expandableInit = true;
      const VISIBLE = 4;
      function expand() {
        const wrapper = sel.parentElement;
        if (wrapper && getComputedStyle(wrapper).position === 'static') wrapper.style.position = 'relative';
        sel.setAttribute('size', String(VISIBLE));
        sel.style.overflowY = 'auto';
        sel.style.zIndex = '9999';
        sel.style.boxSizing = 'border-box';
      }
      function collapse() {
        sel.removeAttribute('size');
        sel.style.overflowY = '';
        sel.style.zIndex = '';
        sel.style.boxSizing = '';
      }
      sel.addEventListener('mousedown', function (ev) {
        const isOpen = sel.hasAttribute('size');
        if (!isOpen) { ev.preventDefault(); expand(); sel.focus(); }
      });
      sel.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== sel) collapse(); }, 120));
      sel.addEventListener('change', () => setTimeout(collapse, 120));
      sel.addEventListener('keydown', e => { if (e.key === 'Escape') collapse(); });
    });
  }

  async function setupFornecedorDetails() {
    if (!window.location.pathname.endsWith('detalhes-material.html')) return;
    const input = document.getElementById('fornecedor');
    const select = document.getElementById('select-fornecedor');
    const btnEditar = document.querySelector('.icone-formulario[alt="Editar"]');
    const btnConfirm = document.querySelector('.btn-confirmar-edicao');
    const btnCancel = document.querySelector('.btn-cancelar-edicao');
    if (!input || !select) return;

    async function popularSelect() {
      const forns = await loadFornecedores();
      select.innerHTML = '<option value="">Selecione o fornecedor</option>';
      forns.forEach(f => {
        const o = document.createElement('option');
        o.value = String(f.id);
        o.textContent = `${f.id} - ${f.nome}`;
        select.appendChild(o);
      });
    }

    select.style.display = 'none';
    select.disabled = true;

    async function enterEdit() {
      if (select.options.length <= 1) await popularSelect();
      const curId = (input.value || '').split(' - ')[0].trim();
      select.value = curId || '';
      input.style.display = 'none';
      select.style.display = '';
      select.disabled = false;
      setupExpandableSelects();
      select.focus();
    }

    function exitEdit(save) {
      if (save) {
        const opt = select.options[select.selectedIndex];
        if (opt && opt.value) input.value = opt.textContent;
      }
      select.style.display = 'none';
      select.disabled = true;
      input.style.display = '';
    }

    if (btnEditar) btnEditar.addEventListener('click', e => { e.preventDefault(); enterEdit(); });
    if (btnCancel) btnCancel.addEventListener('click', e => { e.preventDefault(); exitEdit(false); });
    if (btnConfirm) btnConfirm.addEventListener('click', e => { e.preventDefault(); exitEdit(true); document.dispatchEvent(new Event('fornecedor:saved')); });

    select.addEventListener('change', () => {
      const opt = select.options[select.selectedIndex];
      if (opt && opt.value) input.value = opt.textContent;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { setupExpandableSelects(); setupFornecedorDetails(); });
  } else {
    setupExpandableSelects(); setupFornecedorDetails();
  }
})();