const Recurso = require('../models/Recurso');

const recursoController = {
    createRecurso: async function(req, res){
        try {
            const lastRecurso = await Recurso.findOne().sort({ id: -1 }).exec();
            const nextId = lastRecurso ? lastRecurso.id + 1 : 1;

            const recursoData = { ...req.body, id: nextId };
            if (!recursoData.data_registo) {
                recursoData.data_registo = new Date();
            }

            const newRecurso = new Recurso(recursoData);
            await newRecurso.save();
            res.status(201).json(newRecurso);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getAllRecursos: async function(req, res){
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

            let execQuery = Recurso.find(mongoQuery, projection).populate('ficheiro');

            if (sortField) {
                execQuery = execQuery.sort({ [sortField]: order });
            } else if (searchTerm) {
                execQuery = execQuery.sort(mongoSort);
            }

            const recursos = await execQuery.exec();
            res.json(recursos);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getRecursoById: async function(req, res){
        try {
            const recurso = await Recurso.findOne({ id: req.params.id }).populate('ficheiro');
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
            res.status(500).json({ message: error.message });
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