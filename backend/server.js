const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Adicione esta linha:
app.use(express.static('HTML'));
// Se necessário, adicione para imagens e css:
app.use(express.static('../imagens'));
app.use(express.static('../css'));
app.use(express.static('../'));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'SamySoftware1122!',
  port: 5432,
});

// Ao cadastrar material
app.post('/materiais', async (req, res) => {
  let {
    descricao_breve,
    fabricante,
    valor, // valor de venda
    valor_custo,
    codigo_fabricante,
    descricao_completa,
    quantidade,
    und_medida,
    fornecedor,
    quantidade_segura
  } = req.body;

  valor = Number(valor) || 0;
  valor_custo = Number(valor_custo) || 0;
  quantidade = Number(quantidade) || 0;
  quantidade_segura = Number(quantidade_segura) || 0;

  try {
    // Exemplo de INSERT
    await pool.query(
      `INSERT INTO materiais (
        descricao_breve, fabricante, valor, valor_custo, codigo_fabricante,
        descricao_completa, quantidade, und_medida, fornecedor, quantidade_segura
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        descricao_breve, fabricante, valor, valor_custo, codigo_fabricante,
        descricao_completa, quantidade, und_medida, fornecedor, quantidade_segura
      ]
    );
    res.status(201).json({ message: 'Material cadastrado!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota para listar materiais
app.get('/materiais', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM materiais ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/materiais/estoque-baixo', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.id, m.descricao_breve, m.fabricante, m.quantidade, m.und_medida, m.valor_custo,
             m.fornecedor, f.nome as fornecedor_nome
      FROM materiais m
      LEFT JOIN fornecedores f ON m.fornecedor = f.id::text
      WHERE m.quantidade <= m.quantidade_segura
      ORDER BY m.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/fornecedores/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fornecedores WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));

app.get('/materiais/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT *, valor_custo FROM materiais WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Material não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/materiais/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM materiais WHERE id = $1', [req.params.id]);
    res.json({ message: 'Material excluído!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/materiais/:id', async (req, res) => {
  const {
    descricao_breve, descricao_completa, fabricante, codigo_fabricante,
    fornecedor, valor, valor_custo, und_medida, quantidade_segura, quantidade
  } = req.body;
  try {
    await pool.query(
      `UPDATE materiais SET
        descricao_breve = $1,
        descricao_completa = $2,
        fabricante = $3,
        codigo_fabricante = $4,
        fornecedor = $5,
        valor = $6,
        valor_custo = $7,
        und_medida = $8,
        quantidade_segura = $9,
        quantidade = $10
      WHERE id = $11`,
      [
        descricao_breve, descricao_completa, fabricante, codigo_fabricante, fornecedor,
        valor, valor_custo, und_medida, quantidade_segura, quantidade, req.params.id
      ]
    );
    res.json({ message: 'Material atualizado!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/materiais/movimentacao', async (req, res) => {
  const { tipo, codigo_interno, quantidade } = req.body;
  try {
    const id = Number(codigo_interno);
    const result = await pool.query('SELECT * FROM materiais WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material não encontrado' });
    }
    let mat = result.rows[0];
    let novaQuantidade = mat.quantidade;
    if (tipo === 'entrada') {
      novaQuantidade += Number(quantidade);
    } else if (tipo === 'saida') {
      if (novaQuantidade < Number(quantidade)) {
        return res.status(400).json({ error: 'Quantidade insuficiente para saída' });
      }
      novaQuantidade -= Number(quantidade);
    } else {
      return res.status(400).json({ error: 'Tipo de movimentação inválido' });
    }
    await pool.query('UPDATE materiais SET quantidade = $1 WHERE id = $2', [novaQuantidade, id]);

    // Salva no histórico
    await pool.query(
      `INSERT INTO historico_movimentacoes
        (material_id, tipo, valor_custo, valor_venda, fornecedor, quantidade, und_medida)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        tipo,
        mat.valor_custo,
        mat.valor,
        Number(mat.fornecedor) || null,
        quantidade,
        mat.und_medida
      ]
    );

    res.json({ message: 'Movimentação realizada com sucesso!', novaQuantidade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/fornecedores', async (req, res) => {
  const {
    nome,
    razao_social,
    cnpj,
    inscricao_estadual,
    logradouro,
    numero,
    bairro,
    municipio,
    estado,
    telefone,
    email
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO fornecedores (
        nome, razao_social, cnpj, inscricao_estadual, logradouro,
        numero, bairro, municipio, estado, telefone, email
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        nome,
        razao_social,
        cnpj,
        inscricao_estadual,
        logradouro,
        numero,
        bairro,
        municipio,
        estado,
        telefone,
        email
      ]
    );
    res.status(201).json({ message: 'Fornecedor cadastrado com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/fornecedores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fornecedores ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar fornecedor
app.put('/fornecedores/:id', async (req, res) => {
  const {
    nome, razao_social, cnpj, inscricao_estadual, logradouro,
    numero, bairro, municipio, estado, telefone, email
  } = req.body;
  try {
    await pool.query(
      `UPDATE fornecedores SET
        nome = $1, razao_social = $2, cnpj = $3, inscricao_estadual = $4,
        logradouro = $5, numero = $6, bairro = $7, municipio = $8,
        estado = $9, telefone = $10, email = $11
      WHERE id = $12`,
      [nome, razao_social, cnpj, inscricao_estadual, logradouro, numero, bairro, municipio, estado, telefone, email, req.params.id]
    );
    res.json({ message: 'Fornecedor atualizado!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir fornecedor
app.delete('/fornecedores/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM fornecedores WHERE id = $1', [req.params.id]);
    res.json({ message: 'Fornecedor excluído!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/historico/:material_id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT h.*, f.nome as fornecedor_nome
       FROM historico_movimentacoes h
       LEFT JOIN fornecedores f ON h.fornecedor = f.id
       WHERE h.material_id = $1
       ORDER BY h.data DESC`,
      [req.params.material_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

