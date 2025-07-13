const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

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
    descricao_breve, fabricante, valor, codigo_fabricante,
    descricao_completa, quantidade, und_medida, fornecedor, quantidade_segura
  } = req.body;

  valor = Number(valor) || 0;
  quantidade_segura = Number(quantidade_segura) || 0;

  try {
    await pool.query(
      'INSERT INTO materiais (descricao_breve, fabricante, valor, codigo_fabricante, descricao_completa, quantidade, und_medida, fornecedor, quantidade_segura) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [descricao_breve, fabricante, valor, codigo_fabricante, descricao_completa, quantidade, und_medida, fornecedor, quantidade_segura]
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

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));

app.get('/materiais/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM materiais WHERE id = $1', [req.params.id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Material não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});