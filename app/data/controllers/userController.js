const User = require('../models/User');

const userController = {
    createUser: async function(req, res){
        try {
            const lastUser = await User.findOne().sort({ id: -1 }).exec();
            const nextId = lastUser ? lastUser.id + 1 : 1;

            const newUser = new User({
                id: nextId,
                nome: req.body.nome,
                apelido: req.body.apelido,
                email: req.body.email,
                password: req.body.password,
                data_criacao: new Date(),
                role: req.body.role || 'user'
            });

            await newUser.save();
            res.status(201).json(newUser);
        } catch (error) {
            console.error('createUser error:', error);
            if (error.code === 11000) {
                return res.status(400).json({ message: 'Email já registado.' });
            }
            res.status(400).json({ message: error.message });
        }
    },

    getAllUsers: async function(req, res){
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

            let execQuery = User.find(mongoQuery, projection);

            if (sortField) {
                execQuery = execQuery.sort({ [sortField]: order });
            } else if (searchTerm) {
                execQuery = execQuery.sort(mongoSort);
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
                res.status(404).json({ message: "Usuário não encontrado." });
            } else {
                res.json(user);
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateUser: async function(req, res){
        try {
            const user = await User.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
            if (!user) {
                res.status(404).json({ message: "Usuário não encontrado." });
            } else {
                res.json(user);
            }
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    deleteUser: async function(req, res){
        try {
            const user = await User.findOneAndDelete({ id: req.params.id });
            if (!user) {
                res.status(404).json({ message: "Usuário não encontrado." });
            } else {
                res.json({ message: "Usuário apagado com sucesso." });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = userController;
module.exports.login = async (email, password) => {
    const user = await User.findOne({ email });
    if (user && user.password === password) { // Se usares bcrypt, usa o compare aqui
        return user;
    }
    throw new Error('Incorreto');
};