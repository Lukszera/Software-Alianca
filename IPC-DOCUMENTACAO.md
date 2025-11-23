# Documentação: Uso de IPC no Software Electron - Aliança Software

## 📋 Índice
1. [O que é IPC?](#o-que-é-ipc)
2. [Por que o IPC é necessário no Electron?](#por-que-o-ipc-é-necessário-no-electron)
3. [Como o IPC funciona neste software](#como-o-ipc-funciona-neste-software)
4. [Estrutura de Processos](#estrutura-de-processos)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Fluxo de Comunicação](#fluxo-de-comunicação)
7. [Canais IPC Implementados](#canais-ipc-implementados)

---

## O que é IPC?

**IPC** significa **Inter-Process Communication** (Comunicação Entre Processos).

É um mecanismo que permite que diferentes processos de um programa se comuniquem e troquem dados entre si. No contexto do Electron, o IPC é fundamental para permitir que a interface gráfica (páginas HTML/JavaScript) se comunique com o processo principal que tem acesso aos recursos do sistema operacional e ao banco de dados.

---

## Por que o IPC é necessário no Electron?

O Electron possui uma arquitetura de **múltiplos processos** baseada no Chromium:

### 🔵 Processo Principal (Main Process)
- **Arquivo**: `main.js`
- **Responsabilidades**:
  - Criar e gerenciar janelas da aplicação
  - Acessar recursos do sistema operacional (arquivos, rede, etc.)
  - Conectar-se ao banco de dados PostgreSQL
  - Executar operações privilegiadas
  - Gerenciar o ciclo de vida da aplicação

### 🟢 Processos Renderizadores (Renderer Process)
- **Arquivos**: Páginas HTML (menu.html, detalhes-material.html, etc.) + `funcoes.js`
- **Responsabilidades**:
  - Renderizar a interface gráfica
  - Executar JavaScript do lado do cliente
  - Interagir com o usuário
  - Exibir dados

**⚠️ IMPORTANTE**: Por razões de segurança, os processos renderizadores **não têm acesso direto** ao Node.js, sistema de arquivos ou banco de dados. Eles precisam do **IPC** para solicitar essas operações ao processo principal.

---

## Como o IPC funciona neste software

O IPC neste software funciona através do modelo **request-response** (pergunta-resposta):

1. **Renderer envia uma solicitação** → `ipcRenderer.invoke('nome-do-canal', dados)`
2. **Main recebe e processa** → `ipcMain.handle('nome-do-canal', callback)`
3. **Main retorna resposta** → `return resultado`
4. **Renderer recebe a resposta** → `await ipcRenderer.invoke(...)`

### Configuração no Código

#### No `main.js` (Processo Principal):
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');

// Registra um handler IPC
ipcMain.handle('listar-materiais', async () => {
  try {
    const res = await query('SELECT * FROM materiais ORDER BY id');
    return res;
  } catch (err) {
    console.error('listar-materiais:', err);
    return [];
  }
});
```

#### No `funcoes.js` (Processo Renderizador):
```javascript
const { ipcRenderer } = require('electron');

// Chama o handler IPC
const materiais = await ipcRenderer.invoke('listar-materiais');
```

---

## Estrutura de Processos

```
┌─────────────────────────────────────────────────────────────┐
│                    APLICAÇÃO ELECTRON                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         PROCESSO PRINCIPAL (main.js)               │    │
│  │                                                     │    │
│  │  • Gerencia janelas                                │    │
│  │  • Conecta ao PostgreSQL                           │    │
│  │  • Registra handlers IPC (ipcMain.handle)          │    │
│  │  • Executa queries no banco de dados               │    │
│  │                                                     │    │
│  └─────────────────┬───────────────────────────────────┘    │
│                    │                                         │
│                    │ IPC (Inter-Process Communication)      │
│                    │                                         │
│  ┌─────────────────┴───────────────────────────────────┐    │
│  │    PROCESSOS RENDERIZADORES (HTML + funcoes.js)    │    │
│  │                                                     │    │
│  │  • menu.html                                       │    │
│  │  • detalhes-material.html                          │    │
│  │  • cadastro-material.html                          │    │
│  │  • detalhes-fornecedor.html                        │    │
│  │  • etc.                                            │    │
│  │                                                     │    │
│  │  Cada página usa ipcRenderer.invoke() para:        │    │
│  │  • Buscar dados do banco                           │    │
│  │  • Salvar alterações                               │    │
│  │  • Excluir registros                               │    │
│  │  • Movimentar estoque                              │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Exemplos Práticos

### Exemplo 1: Listar Materiais

**Cenário**: O usuário abre a página de materiais e precisa ver a lista completa.

#### No Renderer (`funcoes.js`):
```javascript
// Invoca o canal IPC para listar materiais
const materiais = await ipcRenderer.invoke('listar-materiais');

// Renderiza os materiais na tabela
renderizarTabela(materiais);
```

#### No Main (`main.js`):
```javascript
ipcMain.handle('listar-materiais', async () => {
  try {
    const res = await query('SELECT * FROM materiais ORDER BY id');
    return res;
  } catch (err) {
    console.error('listar-materiais:', err);
    return [];
  }
});
```

**Fluxo**:
1. Página HTML solicita lista de materiais via IPC
2. Processo principal recebe a solicitação
3. Executa query no PostgreSQL
4. Retorna os dados para a página
5. Página exibe os materiais na tabela

---

### Exemplo 2: Cadastrar Fornecedor

**Cenário**: O usuário preenche o formulário de cadastro de fornecedor e clica em "Salvar".

#### No Renderer (`funcoes.js` ou HTML inline):
```javascript
const dados = {
  nome: 'Fornecedor XYZ',
  razao_social: 'XYZ Ltda',
  cnpj: '12.345.678/0001-90',
  // ... outros campos
};

const resultado = await ipcRenderer.invoke('cadastrar-fornecedor', dados);

if (resultado.ok) {
  alert('Fornecedor cadastrado com sucesso!');
} else {
  alert('Erro: ' + resultado.error);
}
```

#### No Main (`main.js`):
```javascript
ipcMain.handle('cadastrar-fornecedor', async (event, dados) => {
  try {
    await query(
      `INSERT INTO fornecedores (nome, razao_social, cnpj, inscricao_estadual, 
       logradouro, numero, bairro, municipio, estado, telefone, email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [dados.nome, dados.razao_social, dados.cnpj, dados.inscricao_estadual,
       dados.logradouro, dados.numero, dados.bairro, dados.municipio,
       dados.estado, dados.telefone, dados.email]
    );
    return { ok: true };
  } catch (err) {
    console.error('cadastrar-fornecedor:', err);
    return { ok: false, error: err.message };
  }
});
```

---

### Exemplo 3: Movimentar Material (Entrada/Saída de Estoque)

**Cenário**: O usuário registra uma saída de material do estoque.

#### No Renderer:
```javascript
const movimentacao = {
  tipo: 'saida',
  codigo_interno: 123,
  quantidade: 5
};

const resultado = await ipcRenderer.invoke('movimentar-material', movimentacao);

if (resultado.ok) {
  console.log('Nova quantidade:', resultado.novaQuantidade);
} else {
  alert('Erro: ' + resultado.error);
}
```

#### No Main (`main.js`):
```javascript
ipcMain.handle('movimentar-material', async (_e, { tipo, codigo_interno, quantidade }) => {
  try {
    const mult = String(tipo).toLowerCase() === 'saida' ? -1 : 1;
    const qnt = Number(quantidade || 0);

    // Atualiza quantidade no material
    const rows = await query(
      `UPDATE materiais
         SET quantidade = GREATEST(0, COALESCE(quantidade,0) + $1)
       WHERE id = $2
       RETURNING id, descricao_breve, valor_custo, valor, fornecedor, 
                 und_medida, quantidade, quantidade_segura`,
      [mult * qnt, Number(codigo_interno)]
    );
    
    const mat = rows[0];
    if (!mat) return { ok: false, error: 'Material não encontrado' };

    // Registra no histórico
    await query(
      `INSERT INTO historico_movimentacoes
         (material_id, tipo, quantidade, data, valor_custo, valor_venda, 
          fornecedor, und_medida)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7)`,
      [mat.id, String(tipo).toLowerCase(), qnt, Number(mat.valor_custo || 0),
       Number(mat.valor || 0), mat.fornecedor ?? null, mat.und_medida ?? null]
    );

    return { ok: true, material_id: mat.id, novaQuantidade: mat.quantidade };
  } catch (err) {
    console.error('[IPC] movimentar-material error:', err);
    return { ok: false, error: err.message };
  }
});
```

---

## Fluxo de Comunicação

### Fluxo Completo de uma Operação de Consulta:

```
USUÁRIO                RENDERER              IPC           MAIN             BANCO DE DADOS
   │                      │                   │             │                     │
   │  Clica "Ver         │                   │             │                     │
   │  Materiais"         │                   │             │                     │
   └─────────────────────>│                   │             │                     │
                          │                   │             │                     │
                          │ invoke('listar-  │             │                     │
                          │  materiais')      │             │                     │
                          ├──────────────────>│             │                     │
                          │                   │             │                     │
                          │                   │  handler    │                     │
                          │                   │  executa    │                     │
                          │                   ├────────────>│                     │
                          │                   │             │                     │
                          │                   │             │ SELECT * FROM      │
                          │                   │             │ materiais          │
                          │                   │             ├────────────────────>│
                          │                   │             │                     │
                          │                   │             │ Retorna linhas     │
                          │                   │             │<────────────────────┘
                          │                   │             │
                          │                   │  Retorna    │
                          │                   │  dados      │
                          │                   │<────────────┤
                          │                   │             │
                          │  Resolve promise  │             │
                          │  com os dados     │             │
                          │<──────────────────┤             │
                          │                   │             │
   Visualiza              │  Renderiza        │             │
   os dados              │  na tela          │             │
   <─────────────────────┤                   │             │
```

---

## Canais IPC Implementados

Este software implementa os seguintes canais IPC:

### 📦 Materiais
| Canal IPC | Parâmetros | Retorno | Descrição |
|-----------|------------|---------|-----------|
| `listar-materiais` | nenhum | Array de materiais | Lista todos os materiais cadastrados |
| `buscar-material` | id (número) | Objeto material ou null | Busca um material específico por ID |
| `cadastrar-material` | dados (objeto) | `{ok: boolean, error?: string}` | Cadastra um novo material |
| `editar-material` | id, dados | `{ok: boolean, error?: string}` | Atualiza os dados de um material |
| `excluir-material` | id (número) | `{ok: boolean, error?: string}` | Exclui um material |
| `movimentar-material` | `{tipo, codigo_interno, quantidade}` | `{ok, material_id, novaQuantidade, error?}` | Registra entrada/saída de material |
| `historico-movimentacoes` | materialId | Array de movimentações | Retorna histórico de movimentações de um material |
| `materiais-estoque-baixo` | nenhum | Array de materiais | Lista materiais com estoque abaixo do mínimo |

### 🏭 Fornecedores
| Canal IPC | Parâmetros | Retorno | Descrição |
|-----------|------------|---------|-----------|
| `listar-fornecedores` | nenhum | Array de fornecedores | Lista todos os fornecedores cadastrados |
| `buscar-fornecedor` | id (número) | Objeto fornecedor ou null | Busca um fornecedor específico por ID |
| `cadastrar-fornecedor` | dados (objeto) | `{ok: boolean, error?: string}` | Cadastra um novo fornecedor |
| `editar-fornecedor` | id, dados | `{ok: boolean, error?: string}` | Atualiza os dados de um fornecedor |
| `excluir-fornecedor` | id (número) | `{ok: boolean, error?: string}` | Exclui um fornecedor |

---

## Vantagens do IPC neste Software

### ✅ Segurança
- O processo renderizador não tem acesso direto ao banco de dados
- Credenciais do PostgreSQL ficam protegidas no processo principal
- Validações podem ser centralizadas no main.js

### ✅ Organização
- Separação clara entre lógica de apresentação (HTML/CSS/JS) e lógica de negócio (banco de dados)
- Código mais fácil de manter e debugar
- Reutilização: múltiplas páginas podem usar os mesmos handlers IPC

### ✅ Consistência
- Todas as operações de banco passam pelo mesmo ponto (main.js)
- Facilita implementar logs, auditoria e controle de acesso
- Garantia de que as queries SQL são executadas corretamente

### ✅ Performance
- As queries são executadas no processo principal, liberando o renderizador para atualizar a interface
- Operações assíncronas (async/await) evitam travamentos da interface

---

## Alternativa: Backend HTTP (Express)

Este software também possui um backend HTTP alternativo (`backend/server.js`), mas o **IPC é a solução preferencial** quando rodando como aplicação Electron porque:

1. **Mais rápido**: Comunicação direta entre processos, sem overhead de rede
2. **Mais seguro**: Não expõe APIs HTTP que poderiam ser acessadas externamente
3. **Mais simples**: Não requer configuração de porta, CORS, etc.
4. **Integrado**: Funciona nativamente com o Electron

O backend HTTP é útil para:
- Desenvolvimento e testes fora do Electron
- Possível integração futura com outras aplicações
- Debugging com ferramentas como Postman/Insomnia

---

## Conclusão

O **IPC** é a espinha dorsal da comunicação neste software Electron. Ele permite que:

- A interface gráfica (HTML/CSS/JavaScript) permaneça simples e focada na experiência do usuário
- O processo principal gerencie todas as operações críticas (banco de dados, arquivos, etc.)
- O sistema seja seguro, organizado e eficiente

Sem o IPC, não seria possível ter uma aplicação desktop que combina a flexibilidade de tecnologias web (HTML/CSS/JS) com o poder de acesso aos recursos do sistema operacional e banco de dados.

---

## Referências

- [Documentação Oficial do Electron - IPC](https://www.electronjs.org/docs/latest/tutorial/ipc)
- Código-fonte deste projeto: veja o repositório no GitHub
- `main.js` - Implementação dos handlers IPC no processo principal
- `funcoes.js` - Uso do ipcRenderer nas páginas (processos renderizadores)
