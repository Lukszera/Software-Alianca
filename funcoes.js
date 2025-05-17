// Objeto com os dados dos itens
const dados = {
    "001": {
        descricaoBreve: "Peça A",
        descricaoCompleta: "Descrição completa da Peça A",
        fabricante: "Fabricante X",
        codigoFabricante: "12345",
        valor: "R$ 50,00",
        quantidade: "10"
    },
    "002": {
        descricaoBreve: "Peça B",
        descricaoCompleta: "Descrição completa da Peça B",
        fabricante: "Fabricante Y",
        codigoFabricante: "67890",
        valor: "R$ 75,00",
        quantidade: "5"
    },
    "003": {
        descricaoBreve: "Peça C",
        descricaoCompleta: "Descrição completa da Peça C",
        fabricante: "Fabricante Z",
        codigoFabricante: "11223",
        valor: "R$ 100,00",
        quantidade: "8"
    }
};

// Função para carregar os dados do item com base no código
function carregarDados(codigo) {
    const item = dados[codigo];
    if (item) {
        document.getElementById('descricao-breve').value = item.descricaoBreve;
        document.getElementById('descricao-completa').value = item.descricaoCompleta;
        document.getElementById('fabricante').value = item.fabricante;
        document.getElementById('codigo-fabricante').value = item.codigoFabricante;
        document.getElementById('valor').value = item.valor;
        document.getElementById('quantidade').value = item.quantidade;
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
