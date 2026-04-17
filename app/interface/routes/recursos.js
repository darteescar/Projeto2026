var axios = require('axios');
var express = require('express');
var router = express.Router();
var multer = require('multer');

// Define a pasta onde o multer vai colocar os ficheiros recebidos
var upload = multer({ dest: 'uploads/' });

const API_DADOS_URL = process.env.API_DADOS_URL || 'http://localhost:16002';

//!===================================================!//
//!     Todas as rotas já têm o prefixo /recursos     !//
//!===================================================!//

// GET todos os recursos, com filtros opcionais
router.get('/', async function(req, res) {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const [responseFiltered, responseAll] = await Promise.all([
      axios.get(`${API_DADOS_URL}/recursos?${queryParams}`),
      axios.get(`${API_DADOS_URL}/recursos`)
    ]);
    
    const recursos = responseFiltered.data;
    const todosRecursos = responseAll.data;

    // Extrair UCs e Tipos únicos
    const ucs = [...new Set(todosRecursos.map(r => r.uc).filter(Boolean))].sort();
    const tipos = [...new Set(todosRecursos.map(r => r.tipo).filter(Boolean))].sort();

    res.render('recursos', { 
      title: 'Catálogo de Recursos | Recursos LEI', 
      query: req.query, 
      recursos,
      ucs,
      tipos
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
      autor: "Sistema de Teste", // TODO: meter o user que está logado
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
    res.render('detalhesRecurso', { title: 'Detalhes do Recurso | Recursos LEI', recurso, comentarios });
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
    const evalData = {
      id: crypto.randomUUID(),
      recurso_id: req.params.id,
      autor: "User_" + Math.floor(Math.random() * 100), // temp format
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
