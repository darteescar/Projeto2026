var axios = require('axios');
var express = require('express');
var router = express.Router();

const API_DADOS_URL = process.env.API_DADOS_URL || 'http://api_dados_server:16000/api';

// GET página principal
router.get('/', async function(req, res) {
  try{
    const response = await axios.get(`${API_DADOS_URL}/recursos`);
    const recursos = response.data;

    // Arrays para os recentes e top10
    const recentes = [...recursos].sort((a,b) => new Date(b.data_registo) - new Date(a.data_registo)).slice(0, 10);
    const top10 = [...recursos].sort((a,b) => (b.visualizacoes || 0) - (a.visualizacoes || 0)).slice(0, 10);

    res.render('index', { title: 'Início | Recursos LEI', recentes, top10, id: req.user.id });
  }catch(error){
    res.status(500).render('index', { title: 'Início | Recursos LEI', recentes: [], top10: [], id: req.user.id });
  }
});

// GET página sobre
router.get('/sobre', function(req, res) {
  res.render('sobre', { title: 'Sobre | Recursos LEI', id: req.user.id });
});

module.exports = router;
