const Recurso = require('../models/Recurso');

const recursoController = {
    createRecurso: async function(req, res){
        try {
            const newRecurso = new Recurso(req.body);
            await newRecurso.save();
            res.status(201).json(newRecurso);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    getAllRecursos: async function(req, res){
        try {
            const { tipo, ano, uc, autor } = req.query;
            let filter = {};
            
            if (tipo) filter.tipo = tipo;
            if (ano) filter.ano = ano;
            if (uc) filter.uc = uc;
            if (autor) filter.autor = autor;

            const recursos = await Recurso.find(filter);
            res.json(recursos);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getRecursoById: async function(req, res){
        try {
            const recurso = await Recurso.findOne({ id: req.params.id });
            if (!recurso) {
                res.status(404).json({ message: "Recurso não encontrado." });
            } else {
                res.json(recurso);
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateRecurso: async function(req, res){
        try {
            const recurso = await Recurso.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
            if (!recurso) {
                res.status(404).json({ message: "Recurso não encontrado." });
            } else {
                res.json(recurso);
            }
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    deleteRecurso: async function(req, res){
        try {
            const recurso = await Recurso.findOneAndDelete({ id: req.params.id });
            if (!recurso) {
                res.status(404).json({ message: "Recurso não encontrado." });
            } else {
                res.json({ message: "Recurso apagado com sucesso." });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = recursoController;