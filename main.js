const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Client } = require('pg');

const client = new Client({
  user: 'postgres',       
  host: 'localhost',
  database: 'postgres',      
  password: 'SamySoftware1122!',      
  port: 5432,
  // opcional: ssl: { rejectUnauthorized: false }
});

client.connect().catch(err => {
  console.error('Erro ao conectar no Postgres:', err.message || err);
});

function createWindow () {
  const win = new BrowserWindow({
    icon: path.join(__dirname, 'imagens', 'icone.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });
  win.maximize();
  win.setMenuBarVisibility(false); 
  // Use caminho absoluto para funcionar tanto em dev quanto empacotado
  win.loadFile(path.join(__dirname, 'HTML', 'menu.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (client) client.end().catch(()=>{});
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/* -----------------------------
   Fornecedores
   ----------------------------- */
ipcMain.handle('listar-fornecedores', async () => {
  try {
    const res = await client.query('SELECT * FROM fornecedores ORDER BY id');
    return res.rows;
  } catch (err) {
    console.error('listar-fornecedores:', err);
    return [];
  }
});

ipcMain.handle('buscar-fornecedor', async (event, id) => {
  try {
    const fid = Number(id);
    const res = await client.query('SELECT * FROM fornecedores WHERE id = $1', [fid]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('buscar-fornecedor:', err);
    return null;
  }
});

ipcMain.handle('cadastrar-fornecedor', async (event, dados) => {
  try {
    await client.query(
      `INSERT INTO fornecedores (nome, razao_social, cnpj, inscricao_estadual, logradouro, numero, bairro, municipio, estado, telefone, email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        dados.nome, dados.razao_social, dados.cnpj, dados.inscricao_estadual,
        dados.logradouro, dados.numero, dados.bairro, dados.municipio,
        dados.estado, dados.telefone, dados.email
      ]
    );
    return { ok: true };
  } catch (err) {
    console.error('cadastrar-fornecedor:', err);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('editar-fornecedor', async (event, id, dados) => {
  try {
    await client.query(
      `UPDATE fornecedores SET nome=$1, razao_social=$2, cnpj=$3, inscricao_estadual=$4, logradouro=$5, numero=$6, bairro=$7, municipio=$8, estado=$9, telefone=$10, email=$11 WHERE id=$12`,
      [
        dados.nome, dados.razao_social, dados.cnpj, dados.inscricao_estadual,
        dados.logradouro, dados.numero, dados.bairro, dados.municipio,
        dados.estado, dados.telefone, dados.email, Number(id)
      ]
    );
    return { ok: true };
  } catch (err) {
    console.error('editar-fornecedor:', err);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('excluir-fornecedor', async (event, id) => {
  try {
    await client.query('DELETE FROM fornecedores WHERE id = $1', [Number(id)]);
    return { ok: true };
  } catch (err) {
    console.error('excluir-fornecedor:', err);
    return { ok: false, error: err.message };
  }
});

/* -----------------------------
   Materiais
   ----------------------------- */
ipcMain.handle('listar-materiais', async () => {
  try {
    const res = await client.query('SELECT * FROM materiais ORDER BY id');
    return res.rows;
  } catch (err) {
    console.error('listar-materiais:', err);
    return [];
  }
});

ipcMain.handle('buscar-material', async (event, id) => {
  try {
    const mid = Number(id);
    const res = await client.query('SELECT * FROM materiais WHERE id = $1', [mid]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('buscar-material:', err);
    return null;
  }
});

ipcMain.handle('cadastrar-material', async (event, dados) => {
  try {
    await client.query(
      `INSERT INTO materiais (descricao_breve, fabricante, valor_custo, valor, codigo_fabricante, descricao_completa, quantidade, und_medida, fornecedor, quantidade_segura)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        dados.descricao_breve, dados.fabricante, dados.valor_custo, dados.valor,
        dados.codigo_fabricante, dados.descricao_completa, dados.quantidade,
        dados.und_medida, dados.fornecedor, dados.quantidade_segura
      ]
    );
    return { ok: true };
  } catch (err) {
    console.error('cadastrar-material:', err);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('editar-material', async (event, id, dados) => {
  try {
    await client.query(
      `UPDATE materiais SET descricao_breve=$1, fabricante=$2, valor_custo=$3, valor=$4, codigo_fabricante=$5, descricao_completa=$6, quantidade=$7, und_medida=$8, fornecedor=$9, quantidade_segura=$10 WHERE id=$11`,
      [
        dados.descricao_breve, dados.fabricante, dados.valor_custo, dados.valor,
        dados.codigo_fabricante, dados.descricao_completa, dados.quantidade,
        dados.und_medida, dados.fornecedor, dados.quantidade_segura, Number(id)
      ]
    );
    return { ok: true };
  } catch (err) {
    console.error('editar-material:', err);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('excluir-material', async (event, id) => {
  try {
    await client.query('DELETE FROM materiais WHERE id = $1', [Number(id)]);
    return { ok: true };
  } catch (err) {
    console.error('excluir-material:', err);
    return { ok: false, error: err.message };
  }
});

/* -----------------------------
   Movimentação e Histórico
   ----------------------------- */
ipcMain.handle('movimentar-material', async (event, { tipo, codigo_interno, quantidade }) => {
  try {
    const id = Number(codigo_interno);
    const q = Number(quantidade);
    const res = await client.query('SELECT * FROM materiais WHERE id = $1', [id]);
    if (!res.rows.length) return { ok: false, error: 'Material não encontrado!' };

    let novaQuantidade = Number(res.rows[0].quantidade);
    if (tipo === 'entrada') {
      novaQuantidade += q;
    } else if (tipo === 'saida') {
      if (novaQuantidade < q) return { ok: false, error: 'Quantidade insuficiente em estoque!' };
      novaQuantidade -= q;
    } else {
      return { ok: false, error: 'Tipo de movimentação inválido!' };
    }

    await client.query('UPDATE materiais SET quantidade = $1 WHERE id = $2', [novaQuantidade, id]);

    await client.query(
      `INSERT INTO historico_movimentacoes 
        (material_id, tipo, quantidade, data, valor_custo, valor_venda, fornecedor, und_medida)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7)`,
      [
        id,
        tipo,
        q,
        res.rows[0].valor_custo,
        res.rows[0].valor,
        res.rows[0].fornecedor,
        res.rows[0].und_medida
      ]
    );

    return { ok: true, message: 'Movimentação realizada com sucesso!', novaQuantidade };
  } catch (err) {
    console.error('movimentar-material:', err);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('historico-material', async (event, codigo_interno) => {
  try {
    const materialId = Number(codigo_interno);
    const res = await client.query(
      `SELECT h.*, f.nome as fornecedor_nome
       FROM historico_movimentacoes h
       LEFT JOIN fornecedores f ON NULLIF(h.fornecedor, '')::integer = f.id
       WHERE h.material_id = $1
       ORDER BY h.data DESC`,
      [materialId]
    );
    return res.rows;
  } catch (err) {
    console.error('historico-material:', err);
    return [];
  }
});

/* -----------------------------
   Estoque baixo
   ----------------------------- */
ipcMain.handle('materiais-estoque-baixo', async () => {
  try {
    const res = await client.query(
      `SELECT m.*, f.nome as fornecedor_nome 
       FROM materiais m
       LEFT JOIN fornecedores f ON NULLIF(m.fornecedor, '')::integer = f.id
       WHERE m.quantidade <= m.quantidade_segura
       ORDER BY m.id`
    );
    return res.rows;
  } catch (err) {
    console.error('materiais-estoque-baixo:', err);
    return [];
  }
});