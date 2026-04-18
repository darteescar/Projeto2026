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
            let queryObj = { ...req.query };

            const searchTerm = queryObj.q;
            const fields = queryObj._select;
            const sortField = queryObj._sort;
            const order = queryObj._order === 'desc' ? -1 : 1;

            delete queryObj.q;
            delete queryObj._select;
            delete queryObj._sort;
            delete queryObj._order;

            let mongoQuery = {};
            let projection = {};
            let mongoSort = {};

            if (searchTerm) {
                mongoQuery = { $text: { $search: searchTerm } };
                projection.score = { $meta: 'textScore' };
                mongoSort = { score: { $meta: 'textScore' } };
            } else {
                mongoQuery = queryObj;
            }

            if (fields) {
                fields.split(',').forEach(f => {
                    projection[f.trim()] = 1;
                });
            }

            let execQuery = Comentario.find(mongoQuery, projection);

            if (sortField) {
                execQuery = execQuery.sort({ [sortField]: order });
            } else if (searchTerm) {
                execQuery = execQuery.sort(mongoSort);
            }

            const comentarios = await execQuery.exec();
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