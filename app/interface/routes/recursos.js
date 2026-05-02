var axios = require('axios');
var express = require('express');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var os = require('os');
var FormData = require('form-data');

// Define a pasta onde o multer vai colocar os ficheiros temporalmente
var upload = multer({ dest: os.tmpdir() });

const API_DADOS_URL = process.env.API_DADOS_URL || 'http://api-dados:16000/api';

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

    // Filtros para a tabela
    const filtrosApi = {
      visibilidade: 'publico',
      _select: 'id,titulo,uc,ano,tipo,data_registo,media_avaliacoes',
      ...selectedOrder
    };

    if (req.query.uc) filtrosApi.uc = req.query.uc;
    if (req.query.tipo) filtrosApi.tipo = req.query.tipo;
    if (req.query.ano) filtrosApi.ano = req.query.ano;

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

    const ucs = [...new Set(todosRecursos.map(r => r.uc).filter(Boolean))].sort();
    const tipos = [...new Set(todosRecursos.map(r => r.tipo).filter(Boolean))].sort();
    const anos = [...new Set(todosRecursos.map(r => r.ano).filter(Boolean))].sort().reverse();

    res.render('recursos', { 
      title: 'Catálogo de Recursos | Recursos LEI', 
      query: { ...req.query, ordem }, 
      recursos, ucs, tipos, anos,
      id: req.user.id
    });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao contactar API de Dados', error: err, id: req.user.id });
  }
});

// GET formulário para adicionar novo recurso
router.get('/adicionar', function(req, res) {
  res.render('adicionarRecurso', { title: 'Adicionar Recurso | Recursos LEI', id: req.user.id });
});

// POST adicionar novo recurso à base de dados 
router.post('/adicionar', upload.single('ficheiro'), async function(req, res, next) {
  try {
    const recursosResp = await axios.get(`${API_DADOS_URL}/recursos`);
    const maxId = recursosResp.data.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
    const novoId = (maxId + 1).toString();

    let fileId = null;

    if (req.file) {
      const form = new FormData();
      form.append('uc', req.body.uc);
      form.append('category', 'interface_upload');
      form.append('file', fs.createReadStream(req.file.path), req.file.originalname);
      
      const uploadResp = await axios.post(`${API_DADOS_URL}/upload`, form, {
        headers: { ...form.getHeaders() }
      });
      
      fileId = uploadResp.data._id;
      fs.unlinkSync(req.file.path);
    } else {
      throw new Error('Ficheiro é obrigatório.');
    }

    const recurso = {
      id: novoId,
      titulo: req.body.titulo,
      ano: req.body.ano,
      tipo: req.body.tipo,
      uc: req.body.uc,
      autor: req.user.id,
      data_registo: new Date().toISOString(),
      visibilidade: req.body.visibilidade,
      downloads: 0,
      visualizacoes: 0,
      media_avaliacoes: 0,
      ficheiro: fileId
    };
    
    await axios.post(`${API_DADOS_URL}/recursos`, recurso);
    res.redirect('/recursos');
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).render('error', { message: 'Erro ao criar novo recurso', error: err, id: req.user.id });
  }
});

// GET detalhes de um recurso específico
router.get('/detalhes/:id', async function(req, res) {
  try {
    const [recResp, comRes] = await Promise.all([
      axios.get(`${API_DADOS_URL}/recursos/${req.params.id}`),
      axios.get(`${API_DADOS_URL}/comentarios?recurso_id=${req.params.id}&_sort=data&_order=desc`).catch(() => ({data:[]}))
    ]);
    
    let recurso = recResp.data;
    let comentarios = comRes.data;

    comentarios = await Promise.all(comentarios.map(async (c) => {
      try {
        const userResp = await axios.get(`${API_DADOS_URL}/users/${c.autor}`);
        c.autorNome = `${userResp.data.nome} ${userResp.data.apelido}`;
        c.autorId = c.autor;
      } catch (e) {
        c.autorNome = "Utilizador Desconhecido";
        c.autorId = c.autor;
      }
      return c;
    }));

    recurso.visualizacoes = (recurso.visualizacoes || 0) + 1;
    await axios.put(`${API_DADOS_URL}/recursos/${recurso.id}`, recurso);

    let autor = "Autor Desconhecido";
    try {
      const userResp = await axios.get(`${API_DADOS_URL}/users/${recurso.autor}`);
      autor = `${userResp.data.nome} ${userResp.data.apelido}`;
    } catch (errAutor) {}

    res.render('detalhesRecurso', { title: 'Detalhes do Recurso | Recursos LEI', recurso, comentarios, autor, id: req.user.id });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao obter dados do recurso', error: err, id: req.user.id });
  }
});

// GET formulário para editar um recurso específico
router.get('/editar/:id', async function(req, res) {
  try {
    const response = await axios.get(`${API_DADOS_URL}/recursos/${req.params.id}`);
    const recurso = response.data;
    res.render('editarRecurso', { title: 'Editar Recurso | Recursos LEI', recurso, id: req.user.id });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao aceder ao recurso', error: err, id: req.user.id });
  }
});

// POST atualizar recurso específico
router.post('/editar/:id', upload.single('ficheiro'), async function(req, res) {
  try {
    const response = await axios.get(`${API_DADOS_URL}/recursos/${req.params.id}`);
    const recursoAntigo = response.data;
    
    let fileId = recursoAntigo.ficheiro ? recursoAntigo.ficheiro._id : null;

    if (req.file) {
      const form = new FormData();
      form.append('uc', req.body.uc);
      form.append('category', 'interface_upload');
      form.append('file', fs.createReadStream(req.file.path), req.file.originalname);
      
      const uploadResp = await axios.post(`${API_DADOS_URL}/upload`, form, {
        headers: { ...form.getHeaders() }
      });
      fileId = uploadResp.data._id;
      fs.unlinkSync(req.file.path);

      if (recursoAntigo.ficheiro && recursoAntigo.ficheiro._id) {
         await axios.delete(`${API_DADOS_URL}/files/${recursoAntigo.ficheiro._id}`).catch(() => {});
      }
    }

    const recursoAtualizado = Object.assign({}, recursoAntigo, {
      titulo: req.body.titulo,
      ano: req.body.ano,
      tipo: req.body.tipo,
      uc: req.body.uc,
      visibilidade: req.body.visibilidade,
      ficheiro: fileId
    });

    await axios.put(`${API_DADOS_URL}/recursos/${req.params.id}`, recursoAtualizado);
    res.redirect(`/recursos/detalhes/${req.params.id}`);
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).render('error', { message: 'Erro ao atualizar recurso', error: err, id: req.user.id });
  }
});

// POST eliminar recurso específico
router.post('/delete/:id', async function(req, res) {
  try {
    const response = await axios.get(`${API_DADOS_URL}/recursos/${req.params.id}`);
    const recurso = response.data;

    await axios.delete(`${API_DADOS_URL}/recursos/${req.params.id}`);

    if (recurso.ficheiro && recurso.ficheiro._id) {
       await axios.delete(`${API_DADOS_URL}/files/${recurso.ficheiro._id}`).catch(() => {});
    }

    res.redirect('/recursos');
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao eliminar recurso', error: err, id: req.user.id });
  }
});

// POST adicionar comentário a um recurso específico
router.post('/comentar/:id', async function(req, res, next) {
  try {
    const comentariosResp = await axios.get(`${API_DADOS_URL}/comentarios`).catch(()=>({data:[]}));
    const maxId = comentariosResp.data.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0);

    const evalData = {
      id: maxId + 1,
      recurso_id: Number(req.params.id),
      autor: req.user ? req.user.id : "user",
      avaliacao: Number(req.body.avaliacao) || 5,
      descricao: req.body.comentario,
      data: new Date().toISOString()
    };
    await axios.post(`${API_DADOS_URL}/comentarios`, evalData);

    const recursoComentariosResp = await axios.get(`${API_DADOS_URL}/comentarios?recurso_id=${req.params.id}`).catch(()=>({data:[]}));
    const comentarios = recursoComentariosResp.data;
    
    const somaAvaliacoes = comentarios.reduce((acc, c) => acc + Number(c.avaliacao), 0);
    const novaMedia = comentarios.length > 0 ? (somaAvaliacoes / comentarios.length).toFixed(1) : 0;

    const recursoResp = await axios.get(`${API_DADOS_URL}/recursos/${req.params.id}`);
    const recursoAtualizado = { ...recursoResp.data, media_avaliacoes: Number(novaMedia) };
    await axios.put(`${API_DADOS_URL}/recursos/${req.params.id}`, recursoAtualizado);

    res.redirect(`/recursos/detalhes/${req.params.id}`);
  } catch (err) {
    res.status(500).render('error', { message: 'Falha a comentar', error: err, id: req.user.id });
  }
});

// GET para descarregar o ficheiro de um recurso específico
router.get('/download/:id', async function(req, res, next) {
  try {
    const response = await axios.get(`${API_DADOS_URL}/recursos/${req.params.id}`);
    const recurso = response.data;

    if (!recurso.ficheiro || !recurso.ficheiro._id) {
      return res.status(404).render('error', { message: 'Este recurso não tem nenhum ficheiro associado.', error: null, id: req.user.id });
    }

    const recursoAtualizado = Object.assign({}, recurso, { downloads: (recurso.downloads || 0) + 1 });
    
    // We update without waiting
    axios.put(`${API_DADOS_URL}/recursos/${recurso.id}`, recursoAtualizado).catch(()=>{});

    // Proxy the download request directly from internal API to the client browser
    const fileResponse = await axios({
      method: 'get',
      url: `${API_DADOS_URL}/download/${recurso.ficheiro._id}`,
      responseType: 'stream'
    });
    
    res.setHeader('Content-Disposition', `attachment; filename="${recurso.ficheiro.originalName}"`);
    res.setHeader('Content-Type', recurso.ficheiro.mimeType || 'application/octet-stream');
    fileResponse.data.pipe(res);

  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao processar o pedido de download.', error: err, id: req.user.id });
  }
});

module.exports = router;
