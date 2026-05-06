const User = require('../models/User');
const bcrypt = require('bcrypt');

const userController = {
    createUser: async function(req, res){
        try {
            const lastUser = await User.findOne().sort({ id: -1 }).exec();
            const nextId = lastUser ? lastUser.id + 1 : 1;

            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            const newUser = new User({
                id: nextId,
                nome: req.body.nome,
                apelido: req.body.apelido,
                email: req.body.email,
                password: hashedPassword,
                data_criacao: new Date(),
                role: req.body.role || 'consumidor'
            });

            await newUser.save();
            res.status(201).json(newUser);
        } catch (error) {
            console.error('createUser error:', error);
            if (error.code === 11000) {
                return res.status(400).json({ message: 'Email já existe.' });
            }
            res.status(500).json({ message: error.message });
        }
    },

    getAllUsers: async function(req, res){
        try {
            let queryObj = { ...req.query };

            const searchTerm = queryObj.q;
            const fields = queryObj._select;
            const sortFields = queryObj._sort;
            const sortOrders = queryObj._order;

            delete queryObj.q;
            delete queryObj._select;
            delete queryObj._sort;
            delete queryObj._order;
            delete queryObj.password; // Não permitir filtrar por password

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

            let execQuery = User.find(mongoQuery, projection);

            if (sortFields) {
                const fieldsArray = sortFields.split(',');
                const ordersArray = sortOrders ? sortOrders.split(',') : [];

                fieldsArray.forEach((field, index) => {
                    const orderValue = ordersArray[index] === 'desc' ? -1 : 1;
                    mongoSort[field.trim()] = orderValue;
                });

                execQuery = execQuery.sort(mongoSort);
            } else if (searchTerm) {
                execQuery = execQuery.sort({ score: { $meta: 'textScore' } });
            }

            const users = await execQuery.exec();
            res.json(users);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getUserById: async function(req, res){
        try {
            const user = await User.findOne({ id: req.params.id });
            if (!user) {
                res.status(404).json({ message: "User não encontrado." });
            } else {
                res.json(user);
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateUser: async function(req, res){
        try {
            if (req.body.password) {
                req.body.password = await bcrypt.hash(req.body.password, 10);
            }
            const user = await User.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
            if (!user) {
                res.status(404).json({ message: "User não encontrado." });
            } else {
                res.json(user);
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    deleteUser: async function(req, res){
        try {
            const user = await User.findOneAndDelete({ id: req.params.id });
            if (!user) {
                res.status(404).json({ message: "User não encontrado." });
            } else {
                res.json({ message: "User apagado com sucesso." });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = userController;