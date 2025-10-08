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

document.addEventListener('DOMContentLoaded', function() {
    const inputBusca = document.querySelector('.input-busca');
    const btnLupa = document.querySelector('.icone-lupa');
    const tbody = document.getElementById('tbody-materiais');
    let materiaisCache = [];

    async function carregarMateriais() {
        const resp = await fetch('http://localhost:3000/materiais');
        const materiais = await resp.json();
        materiaisCache = materiais; // Salva para filtrar depois
        renderizarTabela(materiais);
    }

function renderizarTabela(materiais) {
    tbody.innerHTML = '';
    materiais.forEach(mat => {
        tbody.innerHTML += `
            <tr>
                <td>${mat.id ? formatarCodigoInterno(mat.id) : ''}</td>
                <td>${mat.descricao_breve}</td>
                <td>${mat.fabricante}</td>
                <td>${mat.codigo_fabricante}</td>
                <td>R$ ${Number(mat.valor).toFixed(2)}</td>
                <td>${mat.quantidade}</td>
                <td>${mat.und_medida}</td>
                <td>${mat.fornecedor}</td>
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

    // Filtro ao digitar ou clicar na lupa
    function filtrarMateriais() {
        const termo = inputBusca.value.trim().toLowerCase();
        const filtrados = materiaisCache.filter(mat =>
            (mat.id && formatarCodigoInterno(mat.id).toLowerCase().includes(termo)) ||
            (mat.descricao_breve && mat.descricao_breve.toLowerCase().includes(termo)) ||
            (mat.fabricante && mat.fabricante.toLowerCase().includes(termo)) ||
            (mat.codigo_fabricante && mat.codigo_fabricante.toLowerCase().includes(termo)) ||
            (mat.fornecedor && mat.fornecedor.toLowerCase().includes(termo))
        );
        renderizarTabela(filtrados);
    }

    inputBusca.addEventListener('input', filtrarMateriais);
    if (btnLupa) btnLupa.addEventListener('click', filtrarMateriais);

    carregarMateriais();
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
            // Remove pontos do código formatado
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
                setTimeout(() => {
                    window.location.href = 'menu.html'; // Corrija aqui
                }, 1200);
            } else {
                mensagemMov.textContent = resultado.error;
                mensagemMov.style.color = 'red';
            }
        };
    }
});

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

    async function carregarMateriais() {
        // Busca materiais e fornecedores em paralelo
        const [respMateriais, respFornecedores] = await Promise.all([
            fetch('http://localhost:3000/materiais'),
            fetch('http://localhost:3000/fornecedores')
        ]);
        const materiais = await respMateriais.json();
        const fornecedores = await respFornecedores.json();

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
        const tbody = tabela.querySelector('tbody');
        const mensagem = document.getElementById('mensagem-hist');

        form.onsubmit = async function(e) {
            e.preventDefault();
            let codigo = document.getElementById('codigo-interno-hist').value.trim();
            // Removes pontos do código interno
            codigo = codigo.replace(/\./g, '');
            if (!codigo) return;
            mensagem.textContent = '';
            tabela.style.display = 'none';
            tbody.innerHTML = '';
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
            });
            tabela.style.display = '';
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
                            <td>${mat.id}</td>
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