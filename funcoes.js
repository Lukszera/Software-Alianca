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

// Função para carregar os dados do item com base no código
function carregarDados(codigo) {
    const item = dados[codigo];
    if (item) {
        document.getElementById('descricao-breve').value = item.descricaoBreve;
        document.getElementById('descricao-completa').value = item.descricaoCompleta;
        document.getElementById('fabricante').value = item.fabricante;
        document.getElementById('codigo-fabricante').value = item.codigoFabricante;
        document.getElementById('valor-custo').value = item.valor_custo || '';
        document.getElementById('valor').value = item.valor || '';
        } else {
            alert("Item não encontrado!");
        }
}

document.addEventListener('DOMContentLoaded', function() {

    const btnAnexar = document.querySelector('.icone-formulario[alt="Anexar"]');
    const btnArquivos = document.querySelector('.icone-formulario[alt="Arquivos"]');
    const inputAnexo = document.getElementById('input-anexo');
    const modalArquivos = document.getElementById('modal-arquivos');
    const listaArquivos = document.querySelector('.lista-arquivos');

    if (modalArquivos) {
        modalArquivos.addEventListener('mousedown', function(e) {
            if (e.target === modalArquivos) {
                modalArquivos.classList.remove('ativo');
            }
        });
    }
    // Array para armazenar os arquivos anexados
    let anexos = [];

    // Anexar arquivo
    if (btnAnexar && inputAnexo) {
        btnAnexar.addEventListener('click', function() {
            inputAnexo.value = "";
            inputAnexo.click();
        });
    }

    if (inputAnexo) {
        inputAnexo.addEventListener('change', function() {
            if (inputAnexo.files.length > 0) {
                // Adiciona todos os arquivos selecionados ao array
                for (let i = 0; i < inputAnexo.files.length; i++) {
                    anexos.push(inputAnexo.files[i]);
                }
            }
        });
    }

    // Mostrar modal de arquivos
    if (btnArquivos && modalArquivos) {
        btnArquivos.addEventListener('click', function() {
            renderizarListaArquivos();
            modalArquivos.classList.add('ativo');
        });
    }

    // Função para renderizar a lista de anexos
   function renderizarListaArquivos() {
    listaArquivos.innerHTML = '';
    if (anexos.length === 0) {
        listaArquivos.innerHTML = '<div style="text-align:center;color:#888;">Nenhum arquivo anexado.</div>';
        return;
    }
    anexos.forEach(function(arquivo, idx) {
        const div = document.createElement('div');
        div.className = 'arquivo-item';

        // Nome do arquivo (link para download)
        const nome = document.createElement('a');
        nome.className = 'arquivo-nome';
        nome.textContent = arquivo.name;
        nome.href = URL.createObjectURL(arquivo);
        nome.download = arquivo.name;
        nome.target = '_blank';

        // Botão de remover
        const btnRemover = document.createElement('button');
        btnRemover.className = 'arquivo-remover';
        btnRemover.title = 'Remover';
        btnRemover.innerHTML = '<img src="imagens/lixeira-anexo.png" alt="Remover">';

        btnRemover.onclick = function() {
            anexos.splice(idx, 1);
            renderizarListaArquivos();
        };

        div.appendChild(nome);
        div.appendChild(btnRemover);
        listaArquivos.appendChild(div);
    });

         if (modalArquivos) {
    modalArquivos.addEventListener('mousedown', function(e) {
        // Fecha o modal se clicar fora do conteúdo central
        if (e.target === modalArquivos) {
            modalArquivos.classList.remove('ativo');
        }
    });
}
}
});

document.addEventListener('DOMContentLoaded', function() {
    const btnEditar = document.querySelector('.icone-formulario[alt="Editar"]');
    const botoesEdicao = document.querySelector('.botoes-edicao');
    const form = document.querySelector('.formulario-detalhes form');
    let valoresOriginais = {};

    if (btnEditar && botoesEdicao && form) {
        btnEditar.addEventListener('click', function() {
            // Salva os valores originais
            form.querySelectorAll('input, textarea').forEach(function(el) {
    valoresOriginais[el.id] = el.value;
    el.readOnly = false;
    el.removeAttribute('readonly');
});
            botoesEdicao.style.display = 'flex';
        });

        // Cancelar edição
        document.querySelector('.btn-cancelar-edicao').onclick = function() {
            // Restaura os valores originais
            form.querySelectorAll('input, textarea').forEach(function(el) {
                el.value = valoresOriginais[el.id];
                el.readOnly = true;
                el.setAttribute('readonly', true);
            });
            botoesEdicao.style.display = 'none';
        };
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const btnExcluirIcone = document.querySelector('.icone-formulario[alt="Excluir"]');
    const modalExcluir = document.getElementById('modal-excluir');
    const btnCancelar = document.querySelector('.btn-cancelar');
    const btnExcluir = document.querySelector('.btn-excluir');

    if (btnExcluirIcone && modalExcluir) {
        btnExcluirIcone.onclick = function() {
            modalExcluir.classList.add('ativo');
        };
    }

    if (btnCancelar && modalExcluir) {
        btnCancelar.onclick = function() {
            modalExcluir.classList.remove('ativo');
        };
    }

    if (btnExcluir && modalExcluir) {
        btnExcluir.onclick = function() {
            // Aqui você pode colocar a lógica real de exclusão
            alert('Material excluído!');
            modalExcluir.classList.remove('ativo');
        };
    }
});

// Função para obter parâmetro da URL
function getParametroUrl(nome) {
    const url = new URL(window.location.href);
    return url.searchParams.get(nome);
}

// Carregar detalhes do material na página de detalhes
document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname.endsWith('detalhes-material.html')) {
        const id = getParametroUrl('id');
        if (id) {
            // Busca material e fornecedores em paralelo
            const [respMat, respForn] = await Promise.all([
                fetch(`http://localhost:3000/materiais/${id}`),
                fetch('http://localhost:3000/fornecedores')
            ]);
            if (respMat.ok && respForn.ok) {
                const mat = await respMat.json();
                const fornecedores = await respForn.json();

                // Preenche todos os campos normalmente
                document.getElementById('descricao-breve').value = mat.descricao_breve || '';
                document.getElementById('descricao-completa').value = mat.descricao_completa || '';
                document.getElementById('fabricante').value = mat.fabricante || '';
                document.getElementById('codigo-fabricante').value = mat.codigo_fabricante || '';
                document.getElementById('valor-custo').value = mat.valor_custo || '';
                document.getElementById('valor').value = mat.valor || '';
                document.getElementById('quantidade').value = mat.quantidade || '';
                document.getElementById('und-medida').value = mat.und_medida || '';
                document.getElementById('quantidade-segura').value = mat.quantidade_segura || '';

                // Preenche o código interno (se existir)
                const campoCodigoInterno = document.getElementById('codigo-interno');
                if (campoCodigoInterno && mat.id) {
                    campoCodigoInterno.value = formatarCodigoInterno(mat.id);
                }

                const spanCodigoInterno = document.querySelector('.codigo-interno');
                if (spanCodigoInterno && mat.id) {
                    spanCodigoInterno.textContent = 'CÓDIGO INTERNO - ' + formatarCodigoInterno(mat.id);
                }
                // Mapa de fornecedores para exibir código-nome
                const mapaFornecedores = {};
                fornecedores.forEach(f => {
                    mapaFornecedores[f.id] = f.nome;
                });

                // Preenche o input readonly com código-nome
                const inputFornecedor = document.getElementById('fornecedor');
                if (inputFornecedor) {
                    if (mat.fornecedor && mapaFornecedores[mat.fornecedor]) {
                        inputFornecedor.value = `${mat.fornecedor} - ${mapaFornecedores[mat.fornecedor]}`;
                    } else if (mat.fornecedor) {
                        inputFornecedor.value = mat.fornecedor;
                    } else {
                        inputFornecedor.value = '';
                    }
                }

                // Preenche o select de fornecedores para edição
                const selectFornecedor = document.getElementById('select-fornecedor');
                if (selectFornecedor) {
                    selectFornecedor.innerHTML = '<option value="">Selecione o fornecedor</option>';
                    fornecedores.forEach(f => {
                        const opt = document.createElement('option');
                        opt.value = f.id;
                        opt.textContent = `${f.id} - ${f.nome}`;
                        if (mat.fornecedor == f.id) opt.selected = true;
                        selectFornecedor.appendChild(opt);
                    });
                }
            }
        }
    }
});

// Função para formatar o código interno (adicione se não tiver)
function formatarCodigoInterno(codigo) {
    let str = codigo.toString().padStart(8, '0');
    return str.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
}

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
    const btnExcluirIcone = document.querySelector('.icone-formulario[alt="Excluir"]');
    const modalExcluir = document.getElementById('modal-excluir');
    const btnCancelar = document.querySelector('.btn-cancelar');
    const btnExcluir = document.querySelector('.btn-excluir');

    if (btnExcluirIcone && modalExcluir) {
        btnExcluirIcone.onclick = function() {
            modalExcluir.classList.add('ativo');
        };
    }

    if (btnCancelar && modalExcluir) {
        btnCancelar.onclick = function() {
            modalExcluir.classList.remove('ativo');
        };
    }

    if (btnExcluir && modalExcluir) {
        btnExcluir.onclick = async function() {
            // Obtém o id do material pela URL
            const id = getParametroUrl('id');
            if (id) {
                const resp = await fetch(`http://localhost:3000/materiais/${id}`, {
                    method: 'DELETE'
                });
                if (resp.ok) {
                    const notificacao = document.getElementById('notificacao');
                    notificacao.textContent = "Material excluído com sucesso!";
                    notificacao.className = "sucesso";
                    notificacao.style.display = "block";
                    setTimeout(() => {
                        notificacao.style.display = "none";
                        window.location.href = 'menu.html';
                    }, 2000);
                } else {
                    const notificacao = document.getElementById('notificacao');
                    notificacao.textContent = "Erro ao excluir material!";
                    notificacao.className = "erro";
                    notificacao.style.display = "block";
                    setTimeout(() => {
                        notificacao.style.display = "none";
                    }, 3000);
                }
            }
            modalExcluir.classList.remove('ativo');
        };
    }
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
            const dados = {};
            campos.forEach(idCampo => {
                if (idCampo === 'fornecedor') {
                    // Pega o valor do select se estiver visível, senão do input
                    const selectFornecedor = document.getElementById('select-fornecedor');
                    const inputFornecedor = document.getElementById('fornecedor');
                    if (selectFornecedor && selectFornecedor.style.display !== 'none') {
                        dados['fornecedor'] = selectFornecedor.value;
                    } else if (inputFornecedor) {
                        // Se não estiver editando, mantém o valor antigo (pode ser só o código)
                        dados['fornecedor'] = (inputFornecedor.value || '').split(' - ')[0];
                    }
                } else {
                    const campo = document.getElementById(idCampo);
                    if (campo) {
                        if (idCampo === 'valor' || idCampo === 'valor-custo') {
                            dados[idCampo.replace(/-/g, '_')] = Number(campo.value.replace(/\D/g, "")) / 100;
                        } else {
                            dados[idCampo.replace(/-/g, '_')] = campo.value;
                        }
                    }
                }
            });
            const resp = await fetch(`http://localhost:3000/materiais/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            if (resp.ok) {
                const notificacao = document.getElementById('notificacao');
                notificacao.textContent = "Material atualizado com sucesso!";
                notificacao.className = "sucesso";
                notificacao.style.display = "block";
                // Verifica se atingiu a quantidade segura
                const matResp = await fetch(`http://localhost:3000/materiais/${id}`);
                if (matResp.ok) {
                    const mat = await matResp.json();
                    if (mat.quantidade <= mat.quantidade_segura) {
                        mostrarNotificacaoEstoqueBaixo(mat.id, mat.descricao_breve);
                    }
                }
                setTimeout(() => {
                    notificacao.style.display = "none";
                    window.location.reload();
                }, 2000);
            } else {
                const notificacao = document.getElementById('notificacao');
                notificacao.textContent = "Erro ao atualizar material!";
                notificacao.className = "erro";
                notificacao.style.display = "block";
                setTimeout(() => {
                    notificacao.style.display = "none";
                }, 3000);
            }
        };
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const formMov = document.getElementById('form-movimentacao');
    const mensagemMov = document.getElementById('mensagem-mov');
    if (formMov) {
        formMov.onsubmit = async function(e) {
            e.preventDefault();
            const tipo = document.getElementById('tipo-mov').value;
            let codigo_interno = document.getElementById('codigo-interno').value.trim();
            codigo_interno = codigo_interno.replace(/\./g, '');
            const quantidade = Number(document.getElementById('quantidade-mov').value);
            const resp = await fetch('http://localhost:3000/materiais/movimentacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo, codigo_interno, quantidade })
            });
            const resultado = await resp.json();
            if (resp.ok) {
                mensagemMov.textContent = resultado.message + ' Nova quantidade: ' + resultado.novaQuantidade;
                mensagemMov.style.color = 'green';

                // Verifica se atingiu a quantidade segura
                const matResp = await fetch(`http://localhost:3000/materiais/${codigo_interno}`);
                if (matResp.ok) {
                    const mat = await matResp.json();
                    if (mat.quantidade <= mat.quantidade_segura) {
                        mostrarNotificacaoEstoqueBaixo(mat.id, mat.descricao_breve);
                    }
                }

                setTimeout(() => {
                    window.location.href = 'menu.html';
                }, 1200);
            } else {
                mensagemMov.textContent = resultado.error;
                mensagemMov.style.color = 'red';
            }
        };
    }
});

// Função para mostrar notificação no canto inferior direito
function mostrarNotificacaoEstoqueBaixo(codigo, nomeMaterial) {
    // Formata o código interno
    const codigoFormatado = formatarCodigoInterno(codigo);
    // Salva a mensagem no localStorage
    localStorage.setItem(
        'notificacaoEstoqueBaixo',
        `O material <b>${codigoFormatado} - ${nomeMaterial}</b> atingiu a quantidade segura`
    );
}

document.addEventListener('DOMContentLoaded', function() {
    const formFornecedor = document.getElementById('form-fornecedor');
    const notificacao = document.getElementById('notificacao');
    if (formFornecedor) {
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
            const resp = await fetch('http://localhost:3000/fornecedores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            if (resp.ok) {
                notificacao.textContent = "Fornecedor cadastrado com sucesso!";
                notificacao.className = "sucesso";
                notificacao.style.display = "block";
                setTimeout(() => {
                    notificacao.style.display = "none";
                    window.location.href = 'menu.html';
                }, 2000);
            } else {
                notificacao.textContent = "Erro ao cadastrar fornecedor!";
                notificacao.className = "erro";
                notificacao.style.display = "block";
                setTimeout(() => {
                    notificacao.style.display = "none";
                }, 3000);
            }
        };
    }
});

document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname.endsWith('consulta-fornecedor.html')) {
        const tbody = document.getElementById('tbody-fornecedores');
        const inputBusca = document.querySelector('.input-busca-fornecedor');
        const btnLupa = document.querySelector('.icone-lupa-fornecedor');
        let fornecedoresCache = [];

        async function carregarFornecedores() {
            const resp = await fetch('http://localhost:3000/fornecedores');
            const fornecedores = await resp.json();
            fornecedoresCache = fornecedores;
            renderizarTabela(fornecedores);
        }

        function renderizarTabela(fornecedores) {
            tbody.innerHTML = '';
            fornecedores.forEach(f => {
                tbody.innerHTML += `
                    <tr>
                        <td>${f.id}</td>
                        <td>${f.nome}</td>
                        <td>${f.cnpj}</td>
                        <td>${f.telefone}</td>
                        <td>${f.email}</td>
                        <td>
                            <button onclick="window.location.href='detalhes-fornecedor.html?id=${f.id}'">
                                <img src="../imagens/Olho.png" class="icone-olho" alt="Olho">
                                VISUALIZAR
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        function filtrarFornecedores() {
            const termo = (inputBusca.value || '').trim().toLowerCase();
            const filtrados = fornecedoresCache.filter(f =>
                (f.id && f.id.toString().includes(termo)) ||
                (f.nome && f.nome.toLowerCase().includes(termo)) ||
                (f.cnpj && f.cnpj.toLowerCase().includes(termo)) ||
                (f.telefone && f.telefone.toLowerCase().includes(termo)) ||
                (f.email && f.email.toLowerCase().includes(termo))
            );
            renderizarTabela(filtrados);
        }

        if (inputBusca) inputBusca.addEventListener('input', filtrarFornecedores);
        if (btnLupa) btnLupa.addEventListener('click', filtrarFornecedores);

        carregarFornecedores();
    }
});

document.addEventListener('DOMContentLoaded', async function() {
    if (window.location.pathname.endsWith('detalhes-fornecedor.html')) {
        const id = getParametroUrl('id');
        const campos = [
            'id', 'nome', 'razao-social', 'cnpj', 'inscricao-estadual',
            'logradouro', 'numero', 'bairro', 'municipio', 'estado', 'telefone', 'email'
        ];
        if (id) {
            const resp = await fetch(`http://localhost:3000/fornecedores/${id}`);
            if (resp.ok) {
                const f = await resp.json();
                campos.forEach(campo => {
                    const el = document.getElementById(campo);
                    if (el) el.value = f[campo.replace(/-/g, '_')] || '';
                });
                // Exibe o código do fornecedor no cabeçalho
                const spanCodigo = document.querySelector('.codigo-interno');
                if (spanCodigo) {
                    spanCodigo.textContent = 'CÓDIGO FORNECEDOR - ' + f.id;
                }
            } else {
                alert('Fornecedor não encontrado!');
                window.location.href = 'consulta-fornecedor.html';
            }
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.endsWith('detalhes-fornecedor.html')) {
        const btnEditar = document.querySelector('.icone-formulario[alt="Editar"]');
        const btnExcluir = document.querySelector('.icone-formulario[alt="Excluir"]');
        const form = document.getElementById('form-detalhes-fornecedor');
        const campos = [
            'nome', 'razao-social', 'cnpj', 'inscricao-estadual',
            'logradouro', 'numero', 'bairro', 'municipio', 'estado', 'telefone', 'email'
        ];
        let valoresOriginais = {};

        // Editar
        if (btnEditar && form) {
            btnEditar.addEventListener('click', function() {
                // Salva valores originais
                campos.forEach(id => {
                    const campo = document.getElementById(id);
                    if (campo) {
                        valoresOriginais[id] = campo.value;
                        campo.removeAttribute('readonly');
                    }
                });
                // Mostra botões de salvar/cancelar (opcional)
                if (!document.querySelector('.botoes-edicao')) {
                    const div = document.createElement('div');
                    div.className = 'botoes-edicao';
                    div.style.display = 'flex';
                    div.style.gap = '16px';
                    div.innerHTML = `
                        <button type="button" class="btn-confirmar-edicao">CONFIRMAR ✔</button>
                        <button type="button" class="btn-cancelar-edicao">CANCELAR ✖</button>
                    `;
                    form.appendChild(div);

                    // Salvar edição
                    div.querySelector('.btn-confirmar-edicao').onclick = async function() {
                        const idFornecedor = getParametroUrl('id');
                        const dados = {};
                        campos.forEach(idCampo => {
                            const campo = document.getElementById(idCampo);
                            if (campo) dados[idCampo.replace(/-/g, '_')] = campo.value;
                        });
                        const resp = await fetch(`http://localhost:3000/fornecedores/${idFornecedor}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(dados)
                        });
                    const notificacao = document.getElementById('notificacao');
                    if (resp.ok) {
                        notificacao.textContent = "Fornecedor atualizado com sucesso!";
                        notificacao.className = "sucesso";
                        notificacao.style.display = "block";
                        setTimeout(() => {
                            notificacao.style.display = "none";
                            window.location.reload();
                        }, 2000);
                    } else {
                        notificacao.textContent = "Erro ao atualizar fornecedor!";
                        notificacao.className = "erro";
                        notificacao.style.display = "block";
                        setTimeout(() => {
                            notificacao.style.display = "none";
                        }, 3000);
                    }
                    };

                    // Cancelar edição
                    div.querySelector('.btn-cancelar-edicao').onclick = function() {
                        campos.forEach(id => {
                            const campo = document.getElementById(id);
                            if (campo) {
                                campo.value = valoresOriginais[id];
                                campo.setAttribute('readonly', true);
                            }
                        });
                        div.remove();
                    };
                }
            });
        }
    }
});
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.endsWith('detalhes-fornecedor.html')) {
        const btnExcluir = document.querySelector('.icone-formulario[alt="Excluir"]');
        const modal = document.getElementById('modal-excluir-fornecedor');
        if (btnExcluir && modal) {
            btnExcluir.onclick = function() {
                modal.style.display = 'flex';
            };
            // Botão cancelar fecha o modal
            modal.querySelector('.btn-cancelar').onclick = function() {
                modal.style.display = 'none';
            };
            // Botão confirmar faz a exclusão
            modal.querySelector('.btn-excluir').onclick = async function() {
                const idFornecedor = getParametroUrl('id');
                const resp = await fetch(`http://localhost:3000/fornecedores/${idFornecedor}`, {
                    method: 'DELETE'
                });
                const notificacao = document.getElementById('notificacao');
                if (resp.ok) {
                    notificacao.textContent = "Fornecedor excluído com sucesso!";
                    notificacao.className = "sucesso";
                    notificacao.style.display = "block";
                    setTimeout(() => {
                        notificacao.style.display = "none";
                        window.location.href = 'consulta-fornecedor.html';
                    }, 2000);
                } else {
                    notificacao.textContent = "Erro ao excluir fornecedor!";
                    notificacao.className = "erro";
                    notificacao.style.display = "block";
                    setTimeout(() => {
                        notificacao.style.display = "none";
                    }, 3000);
                }
            };
        }
    }
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
    if (selectFornecedor) {
        const resp = await fetch('http://localhost:3000/fornecedores');
        if (resp.ok) {
            const fornecedores = await resp.json();
            fornecedores.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.id;
                opt.textContent = `${f.id} - ${f.nome}`;
                selectFornecedor.appendChild(opt);
            });
        }
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
                    <td>R$ ${Number(mat.valor).toFixed(2)}</td>
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
    if (window.location.pathname.endsWith('historico-movimentacoes.html')) {
        const form = document.getElementById('form-historico');
        const tabela = document.getElementById('tabela-historico');
        const wrapper = document.querySelector('.tabela-historico-wrapper');
        wrapper.style.display = 'none';
        const tbody = tabela.querySelector('tbody');
        const mensagem = document.getElementById('mensagem-hist');
        const totaisDiv = document.querySelector('.totais-historico');
        const totalCustoSpan = document.getElementById('total-custo');
        const totalVendaSpan = document.getElementById('total-venda');

        form.onsubmit = async function(e) {
            e.preventDefault();
            let codigo = document.getElementById('codigo-interno-hist').value.trim();
            codigo = codigo.replace(/\./g, '');
            if (!codigo) return;
            mensagem.textContent = '';
            tabela.style.display = 'none';
            wrapper.style.display = 'none';
            tbody.innerHTML = '';
            if (totaisDiv) totaisDiv.style.display = 'none';
            if (totalCustoSpan) totalCustoSpan.textContent = '';
            if (totalVendaSpan) totalVendaSpan.textContent = '';

            const resp = await fetch(`http://localhost:3000/historico/${codigo}`);
            if (!resp.ok) {
                mensagem.textContent = 'Erro ao buscar histórico!';
                return;
            }
            const historico = await resp.json();
            if (!historico.length) {
                mensagem.textContent = 'Nenhuma movimentação encontrada!';
                return;
            }
            let totalCusto = 0;
            let totalVenda = 0;
            historico.forEach(mov => {
                tbody.innerHTML += `
                    <tr>
                        <td>${mov.tipo}</td>
                        <td>${new Date(mov.data).toLocaleString('pt-BR')}</td>
                        <td>R$ ${Number(mov.valor_custo).toFixed(2)}</td>
                        <td>R$ ${Number(mov.valor_venda).toFixed(2)}</td>
                        <td>${mov.fornecedor ? mov.fornecedor + ' - ' + (mov.fornecedor_nome || '') : ''}</td>
                        <td>${mov.quantidade}</td>
                        <td>${mov.und_medida}</td>
                    </tr>
                `;
                // Soma os totais
                totalCusto += Number(mov.valor_custo) * Number(mov.quantidade);
                totalVenda += Number(mov.valor_venda) * Number(mov.quantidade);
            });
            tabela.style.display = '';
            wrapper.style.display = '';
            if (totaisDiv) {
                totaisDiv.style.display = 'block';
                totalCustoSpan.textContent = `Valor total de custo: R$ ${totalCusto.toFixed(2)}`;
                totalVendaSpan.textContent = `Valor total de venda: R$ ${totalVenda.toFixed(2)}`;
            }
        };
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const formCadastroMaterial = document.getElementById('form-cadastro-material');
    const notificacao = document.getElementById('notificacao');
    if (formCadastroMaterial) {
        formCadastroMaterial.onsubmit = async function(e) {
            e.preventDefault();
            const dados = {
                descricao_breve: document.getElementById('descricao-breve').value,
                fabricante: document.getElementById('fabricante').value,
                valor_custo: Number(document.getElementById('valor-custo').value.replace(/\D/g, "")) / 100,
                valor: Number(document.getElementById('valor').value.replace(/\D/g, "")) / 100,
                codigo_fabricante: document.getElementById('codigo-fabricante').value,
                descricao_completa: document.getElementById('descricao-completa').value,
                quantidade: Number(document.getElementById('quantidade').value) || 0,
                und_medida: document.getElementById('und-medida').value,
                fornecedor: document.getElementById('fornecedor').value,
                quantidade_segura: Number(document.getElementById('quantidade-segura').value) || 0
            };
            const resp = await fetch('http://localhost:3000/materiais', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            if (resp.ok) {
                notificacao.textContent = "Material cadastrado com sucesso!";
                notificacao.className = "sucesso";
                notificacao.style.display = "block";
                setTimeout(() => {
                    notificacao.style.display = "none";
                    window.location.href = 'menu.html';
                }, 2000);
            } else {
                notificacao.textContent = "Erro ao cadastrar material!";
                notificacao.className = "erro";
                notificacao.style.display = "block";
                setTimeout(() => {
                    notificacao.style.display = "none";
                }, 3000);
            }
        };
    }
});

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.endsWith('estoque-baixo.html')) {
        const tbody = document.getElementById('tbody-estoque-baixo');
        fetch('http://localhost:3000/materiais/estoque-baixo')
            .then(resp => resp.json())
            .then(materiais => {
                tbody.innerHTML = '';
                materiais.forEach(mat => {
                    tbody.innerHTML += `
                        <tr>
                            <td>${mat.id ? formatarCodigoInterno(mat.id) : ''}</td>
                            <td>${mat.descricao_breve}</td>
                            <td>${mat.fabricante}</td>
                            <td>${mat.fornecedor ? mat.fornecedor + ' - ' + (mat.fornecedor_nome || '') : ''}</td>
                            <td>${mat.quantidade}</td>
                            <td>${mat.und_medida}</td>
                            <td>R$ ${Number(mat.valor_custo).toFixed(2)}</td>
                        </tr>
                    `;
                });
            });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const notificacao = document.getElementById('notificacao-estoque-baixo');
    const msg = localStorage.getItem('notificacaoEstoqueBaixo');
    if (msg) {
        if (!notificacao) {
            // Cria o elemento se não existir
            const div = document.createElement('div');
            div.id = 'notificacao-estoque-baixo';
            div.innerHTML = msg;
            document.body.appendChild(div);
        } else {
            notificacao.innerHTML = msg;
            notificacao.style.display = 'block';
        }
        setTimeout(() => {
            if (notificacao) notificacao.style.display = 'none';
            localStorage.removeItem('notificacaoEstoqueBaixo');
        }, 8000); // 8 segundos
    }
});