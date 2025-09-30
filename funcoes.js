// Função para carregar os dados do item com base no código
function carregarDados(codigo) {
    const item = dados[codigo];
    if (item) {
        document.getElementById('descricao-breve').value = item.descricaoBreve;
        document.getElementById('descricao-completa').value = item.descricaoCompleta;
        document.getElementById('fabricante').value = item.fabricante;
        document.getElementById('codigo-fabricante').value = item.codigoFabricante;
        document.getElementById('valor').value = item.valor;
        document.getElementById('quantidade').value = mat.quantidade || '';
    } else {
        alert("Item não encontrado!");
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // ...outros códigos...

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

        // Confirmar edição
        document.querySelector('.btn-confirmar-edicao').onclick = function() {
            form.querySelectorAll('input, textarea').forEach(function(el) {
                el.readOnly = true;
                el.setAttribute('readonly', true);
            });
            botoesEdicao.style.display = 'none';
            // Aqui você pode adicionar lógica para salvar os dados, se desejar
            alert('Alterações salvas!');
        };

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
            const resp = await fetch(`http://localhost:3000/materiais/${id}`);
            if (resp.ok) {
                const mat = await resp.json();
                // Preenche os campos do formulário
                document.getElementById('descricao-breve').value = mat.descricao_breve || '';
                document.getElementById('descricao-completa').value = mat.descricao_completa || '';
                document.getElementById('fabricante').value = mat.fabricante || '';
                document.getElementById('codigo-fabricante').value = mat.codigo_fabricante || '';
                document.getElementById('fornecedor').value = mat.fornecedor || '';
                document.getElementById('valor').value = mat.valor || '';
                const selectUnd = document.getElementById('und-medida');
                if (selectUnd) selectUnd.value = mat.und_medida || '';
                document.getElementById('quantidade-segura').value = mat.quantidade_segura || '';
                document.getElementById('quantidade').value = mat.quantidade || '';
                // Exibe o código interno formatado em algum lugar
                document.querySelector('.codigo-interno').textContent = 'CÓDIGO INTERNO - ' + formatarCodigoInterno(mat.id);
            } else {
                document.getElementById('detalhes-material').innerText = 'Material não encontrado!';
            }
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const formCadastro = document.querySelector('.formulario-cadastro form');
    if (formCadastro) {
        formCadastro.onsubmit = async function(e) {
            e.preventDefault();
            const dados = {
                descricao_breve: document.getElementById('descricao-breve').value,
                fabricante: document.getElementById('fabricante').value,
                valor: Number(document.getElementById('valor').value) || 0,
                quantidade: Number(document.getElementById('quantidade').value) || 0,
                codigo_fabricante: document.getElementById('codigo-fabricante').value,
                descricao_completa: document.getElementById('descricao-completa').value,
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
                alert('Material cadastrado com sucesso!');
                window.location.href = 'menu.html'; 
            } else {
                alert('Erro ao cadastrar material!');
            }
        };
    }
});

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
                    alert('Material excluído!');
                    window.location.href = 'menu.html'; // Corrija aqui
                } else {
                    alert('Erro ao excluir material!');
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
        'fornecedor', 'valor', 'und-medida', 'quantidade-segura', 'quantidade'
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
                const campo = document.getElementById(idCampo);
                if (campo) dados[idCampo.replace(/-/g, '_')] = campo.value;
            });
            const resp = await fetch(`http://localhost:3000/materiais/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            if (resp.ok) {
                alert('Material atualizado!');
                window.location.reload();
            } else {
                alert('Erro ao atualizar material!');
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
                alert('Fornecedor cadastrado com sucesso!');
                window.location.href = 'menu.html';
            } else {
                alert('Erro ao cadastrar fornecedor!');
            }
        };
    }
});