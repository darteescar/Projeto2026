var axios = require('axios');
var express = require('express');
var router = express.Router();

var multer = require('multer');
var fs = require('fs');
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
    });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao contactar API de Dados', error: err });
  }
});

// GET formulário para adicionar novo recurso
router.get('/adicionar', async function(req, res) {
  try {
    const resp = await axios.get(`${API_DADOS_URL}/recursos?visibilidade=publico&_select=uc,tipo`);
    const ucs = [...new Set(resp.data.map(r => r.uc).filter(Boolean))].sort();
    const tipos = [...new Set(resp.data.map(r => r.tipo).filter(Boolean))].sort();
    res.render('adicionarRecurso', { title: 'Adicionar Recurso | Recursos LEI', ucs, tipos });
  } catch (err) {
    res.render('adicionarRecurso', { title: 'Adicionar Recurso | Recursos LEI', ucs: [], tipos: [] });
  }

});

// POST adicionar novo recurso à base de dados 
router.post('/adicionar', upload.single('ficheiro'), async function(req, res, next) {
  try {
    let fileId = null;

    if (req.file) {
      const form = new FormData();
      form.append('uc', req.body.uc);
      form.append('category', 'interface_upload');
      if (req.body.uc) form.append('tags', req.body.uc);
      form.append('file', fs.createReadStream(req.file.path), req.file.originalname);
      
      const uploadResp = await axios.post(`${API_DADOS_URL}/files/upload`, form, {
        headers: { ...form.getHeaders() }
      });
      
      fileId = uploadResp.data._id;
      fs.unlinkSync(req.file.path);
    } else {
      throw new Error('Ficheiro é obrigatório.');
    }

    // tratar caso escolha "Outra" UC
    let ucValue = req.body.uc;
    if (ucValue === 'outra' && req.body.uc_outra) ucValue = req.body.uc_outra;

    // tratar caso escolha "Outro" Tipo
    let tipoValue = req.body.tipo;
    if (tipoValue === 'outro' && req.body.tipo_outro) tipoValue = req.body.tipo_outro;

    const recurso = {
      titulo: req.body.titulo,
      ano: req.body.ano,
      tipo: tipoValue,
      uc: ucValue,
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
    res.status(500).render('error', { message: 'Erro ao criar novo recurso', error: err });
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

    res.render('detalhesRecurso', { title: 'Detalhes do Recurso | Recursos LEI', recurso, comentarios, autor });
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao obter dados do recurso', error: err });
  }
});

// GET formulário para editar um recurso específico
router.get('/editar/:id', async function(req, res) {
  try {
    const response = await axios.get(`${API_DADOS_URL}/recursos/${req.params.id}`);
    const recurso = response.data;

    try {
      const resp = await axios.get(`${API_DADOS_URL}/recursos?visibilidade=publico&_select=uc,tipo`);
      const ucs = [...new Set(resp.data.map(r => r.uc).filter(Boolean))].sort();
      const tipos = [...new Set(resp.data.map(r => r.tipo).filter(Boolean))].sort();
      res.render('editarRecurso', { title: 'Editar Recurso | Recursos LEI', recurso, ucs, tipos });
    } catch (e) {
      res.render('editarRecurso', { title: 'Editar Recurso | Recursos LEI', recurso, ucs: [], tipos: [] });
    }
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao aceder ao recurso', error: err });
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
      if (req.body.uc) form.append('tags', req.body.uc);
      form.append('file', fs.createReadStream(req.file.path), req.file.originalname);
      
      const uploadResp = await axios.post(`${API_DADOS_URL}/files/upload`, form, {
        headers: { ...form.getHeaders() }
      });
      fileId = uploadResp.data._id;
      fs.unlinkSync(req.file.path);

      if (recursoAntigo.ficheiro && recursoAntigo.ficheiro._id) {
         await axios.delete(`${API_DADOS_URL}/files/${recursoAntigo.ficheiro._id}`).catch(() => {});
      }
    }

    // tratar caso escolha "Outra" UC
    let ucValue = req.body.uc;
    if (ucValue === 'outra' && req.body.uc_outra) ucValue = req.body.uc_outra;

    // tratar caso escolha "Outro" Tipo
    let tipoValue = req.body.tipo;
    if (tipoValue === 'outro' && req.body.tipo_outro) tipoValue = req.body.tipo_outro;

    const recursoAtualizado = Object.assign({}, recursoAntigo, {
      titulo: req.body.titulo,
      ano: req.body.ano,
      tipo: tipoValue,
      uc: ucValue,
      visibilidade: req.body.visibilidade,
      ficheiro: fileId
    });

    await axios.put(`${API_DADOS_URL}/recursos/${req.params.id}`, recursoAtualizado);
    res.redirect(`/recursos/detalhes/${req.params.id}`);
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).render('error', { message: 'Erro ao atualizar recurso', error: err });
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
    res.status(500).render('error', { message: 'Erro ao eliminar recurso', error: err });
  }
});

// POST adicionar comentário a um recurso específico
router.post('/comentar/:id', async function(req, res, next) {
  try {
    const evalData = {
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
    res.status(500).render('error', { message: 'Falha a comentar', error: err });
  }
});

// GET para pré-visualizar o ficheiro de um recurso específico (inline)
router.get('/preview/:id', async function(req, res, next) {
  try {
    const response = await axios.get(`${API_DADOS_URL}/recursos/${req.params.id}`);
    const recurso = response.data;

    if (!recurso.ficheiro || !recurso.ficheiro._id) {
      return res.status(404).render('error', { message: 'Este recurso não tem nenhum ficheiro associado.', error: null });
    }

    const fileResponse = await axios({
      method: 'get',
      url: `${API_DADOS_URL}/files/download/${recurso.ficheiro._id}`,
      responseType: 'stream'
    });

    // Forçar inline para permitir visualização em iframe/modal
    res.setHeader('Content-Disposition', `inline; filename="${recurso.ficheiro.originalName}"`);
    res.setHeader('Content-Type', recurso.ficheiro.mimeType || 'application/octet-stream');
    fileResponse.data.pipe(res);
  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao processar a pré-visualização.', error: err });
  }
});

// GET para descarregar o ficheiro de um recurso específico
router.get('/download/:id', async function(req, res, next) {
  try {
    const response = await axios.get(`${API_DADOS_URL}/recursos/${req.params.id}`);
    const recurso = response.data;

    if (!recurso.ficheiro || !recurso.ficheiro._id) {
      return res.status(404).render('error', { message: 'Este recurso não tem nenhum ficheiro associado.', error: null });
    }

    const recursoAtualizado = Object.assign({}, recurso, { downloads: (recurso.downloads || 0) + 1 });
    
    axios.put(`${API_DADOS_URL}/recursos/${recurso.id}`, recursoAtualizado).catch(()=>{});

    const fileResponse = await axios({
      method: 'get',
      url: `${API_DADOS_URL}/files/download/${recurso.ficheiro._id}`,
      responseType: 'stream'
    });
    
    res.setHeader('Content-Disposition', `attachment; filename="${recurso.ficheiro.originalName}"`);
    res.setHeader('Content-Type', recurso.ficheiro.mimeType || 'application/octet-stream');
    fileResponse.data.pipe(res);

  } catch (err) {
    res.status(500).render('error', { message: 'Erro ao processar o pedido de download.', error: err });
  }
});

module.exports = router;