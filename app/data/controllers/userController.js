const User = require('../models/User');

const userController = {
    createUser: async function(req, res){
        try {
            const newUser = new User(req.body);
            await newUser.save();
            res.status(201).json(newUser);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    getAllUsers: async function(req, res){
        try {

            const { email, password } = req.query;
            let filter = {};
            
            if (email) filter.email = email;
            if (password) filter.password = password;

            const users = await User.find(filter);
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