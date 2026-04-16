const Comentario = require('../models/Comentario');

const comentarioController = {
    createComentario: async function(req, res){
        try {
            const newComentario = new Comentario(req.body);
            await newComentario.save();
            res.status(201).json(newComentario);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    getAllComentarios: async function(req, res){
        try {
            const { recurso_id } = req.query;
            let filter = {};
            
            if (recurso_id) filter.recurso_id = recurso_id;

            const comentarios = await Comentario.find(filter);
            res.json(comentarios);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getComentarioById: async function(req, res){
        try {
            const comentario = await Comentario.findOne({ id: req.params.id });
            if (!comentario) {
                res.status(404).json({ message: "Comentário não encontrado." });
            } else {
                res.json(comentario);
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateComentario: async function(req, res){
        try {
            const comentario = await Comentario.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
            if (!comentario) {
                res.status(404).json({ message: "Comentário não encontrado." });
            } else {
                res.json(comentario);
            }
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    deleteComentario: async function(req, res){
        try {
            const comentario = await Comentario.findOneAndDelete({ id: req.params.id });
            if (!comentario) {
                res.status(404).json({ message: "Comentário não encontrado." });
            } else {
                res.json({ message: "Comentário apagado com sucesso." });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = comentarioController;