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