var axios = require('axios');
var express = require('express');
var router = express.Router();
var multer = require('multer');

// Define a pasta onde o multer vai colocar os ficheiros recebidos
var upload = multer({ dest: 'uploads/' });

const API_DADOS_URL = process.env.API_DADOS_URL || 'http://localhost:16000/api';

//!===================================================!//
//!     Todas as rotas já têm o prefixo /recursos     !//
//!===================================================!//

// GET todos os recursos, com filtros opcionais
router.get('/', async function(req, res) {
  try {
    const ordem = req.query.ordem || 'data_desc';

    const ordemMap = {
      data_desc: { _sort: 'data_registo', _order: 'desc' },
      data_asc: { _sort: 'data_registo', _order: 'asc' },
      estrelas_desc: { _sort: 'media_avaliacoes', _order: 'desc' },
      estrelas_asc: { _sort: 'media_avaliacoes', _order: 'asc' }
    };

    const selectedOrder = ordemMap[ordem] || ordemMap.data_desc;

    // Filtros para a tabela (com projeção, ordenação e visibilidade pública)
    const filtrosApi = {
      visibilidade: 'publico',
      _select: 'id,titulo,uc,ano,tipo,data_registo,media_avaliacoes',
      ...selectedOrder
    };

    // Propagar filtros de pesquisa
    if (req.query.uc) filtrosApi.uc = req.query.uc;
    if (req.query.tipo) filtrosApi.tipo = req.query.tipo;
    if (req.query.ano) filtrosApi.ano = req.query.ano;

    // Filtros para preencher os dropdowns (todas as UCs e tipos de ficheiros públicos)
    const filtrosPublicos = {
      visibilidade: 'publico',
      _select: 'uc,tipo,ano'
    };

    const queryParams = new URLSearchParams(filtrosApi).toString();
    const allParams = new URLSearchParams(filtrosPublicos).toString();

    const [responseFiltered, responseAll] = await Promise.all([
      axios.get(`${API_DADOS_URL}/recursos?${queryParams}`),
      axios.get(`${API_DADOS_URL}/recursos?${allParams}`)
    ]);

    const recursos = responseFiltered.data;
    const todosRecursos = responseAll.data;

    // Extrair UCs e Tipos únicos para os filtros do Pug
    const ucs = [...new Set(todosRecursos.map(r => r.uc).filter(Boolean))].sort();
    const tipos = [...new Set(todosRecursos.map(r => r.tipo).filter(Boolean))].sort();
    const anos = [...new Set(todosRecursos.map(r => r.ano).filter(Boolean))].sort().reverse();

    res.render('recursos', { 
      title: 'Catálogo de Recursos | Recursos LEI', 
      query: { ...req.query, ordem }, 
      recursos,
      ucs,
      tipos,
      anos
    });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao contactar API de Dados', error: err });
  }
});

//?===================================?//
//?         Adicionar Recurso         ?//
//?===================================?//

// GET formulário para adicionar novo recurso
router.get('/adicionar', function(req, res) {
  res.render('adicionarRecurso', { title: 'Adicionar Recurso | Recursos LEI' });
});

// POST adicionar novo recurso à base de dados 
router.post('/adicionar', upload.single('ficheiro'), async function(req, res, next) {
  try {
    const recursos = await axios.get(`${API_DADOS_URL}/recursos`);
    const newId = recursos.data.length + 1;

    const recurso = {
      id: newId,
      titulo: req.body.titulo,
      ano: req.body.ano,
      tipo: req.body.tipo,
      uc: req.body.uc,
      autor: 1, // TODO: substituir pelo id numérico do user autenticado
      data_registo: new Date().toISOString(),
      visibilidade: req.body.visibilidade,
      tamanho_bytes: req.file ? req.file.size : 0,
      downloads: 0,
      visualizacoes: 0,
      media_avaliacoes: 0,
      path: "" // TODO: decidir o storage
    };
    
    await axios.post(`${API_DADOS_URL}/recursos`, recurso);
    res.redirect('/recursos');
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao criar novo recurso', error: err });
  }
});

//?=======================================?//
//?         Detalhe de um Recurso         ?//
//?=======================================?//

// GET detalhes de um recurso específico
router.get('/detalhes/:id', async function(req, res) {
  try {
    const [recResp, comRes] = await Promise.all([
      axios.get(`${API_DADOS_URL}/recursos/${req.params.id}`),
      axios.get(`${API_DADOS_URL}/comentarios?recurso_id=${req.params.id}`)
    ]);
    
    const recurso = recResp.data;
    const comentarios = comRes.data;

    let autor;
    try {
      const userResp = await axios.get(`${API_DADOS_URL}/users/${recurso.autor}`);
      autor = `${userResp.data.nome} ${userResp.data.apelido}`;
    } catch (userErr) {
      if (!(userErr.response && userErr.response.status === 404)) {
        throw userErr;
      }
    }

    res.render('detalhesRecurso', { title: 'Detalhes do Recurso | Recursos LEI', recurso, comentarios, autor });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao obter dados do recurso', error: err });
  }
});

//?================================?//
//?         Editar Recurso         ?//
//?================================?//

// GET formulário para editar um recurso específico
router.get('/editar/:id', async function(req, res) {
  try {
    const response = await axios.get(`${API_DADOS_URL}/recursos/${req.params.id}`);
    const recurso = response.data;
    res.render('editarRecurso', { title: 'Editar Recurso | Recursos LEI', recurso });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao visualizar recurso. Não o conseguiu aceder.', error: err });
  }
});

// POST atualizar recurso específico
router.post('/editar/:id', async function(req, res) {
  try {
    const recurso = {
      titulo: req.body.titulo,
      ano: req.body.ano,
      tipo: req.body.tipo,
      uc: req.body.uc,
      visibilidade: req.body.visibilidade
    };
    await axios.put(`${API_DADOS_URL}/recursos/${req.params.id}`, recurso);
    res.redirect(`/recursos/detalhes/${req.params.id}`);
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao atualizar recurso', error: err });
  }
});

//?================================?//
//?         Eliminar Recurso       ?//
//?================================?//

// POST eliminar recurso específico
router.post('/delete/:id', async function(req, res) {
  try {
    await axios.delete(`${API_DADOS_URL}/recursos/${req.params.id}`);
    res.redirect('/recursos');
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao eliminar recurso', error: err });
  }
});




















router.post('/avaliar/:id', async function(req, res, next) {
  try {
    const comentariosResp = await axios.get(`${API_DADOS_URL}/comentarios`);
    const maxId = comentariosResp.data.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0);

    const evalData = {
      id: maxId + 1,
      recurso_id: Number(req.params.id),
      autor: 1, // TODO: substituir pelo id numérico do user autenticado
      avaliacao: Number(req.body.avaliacao) || 5, // assuming no stars on UI yet, defaults to 5
      descricao: req.body.comentario,
      data: new Date().toISOString()
    };
    await axios.post(`${API_DADOS_URL}/comentarios`, evalData);
    res.redirect(`/recursos/detalhes/${req.params.id}`);
  } catch (err) {
    res.status(500).render('error', { message: 'Falha a comentar', error: err });
  }
});

router.get('/download/:id', function(req, res, next) {
  res.status(500).render('error', { message: 'Download não implementado', error: new Error('Download não implementado') });
});

module.exports = router;
