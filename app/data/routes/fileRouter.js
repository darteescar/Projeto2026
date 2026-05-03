const express = require('express')
const router = express.Router()
const fileController = require('../controllers/fileController')
const upload = require('../config/multer')

// Novo ficheiro
router.post('/files/upload', upload.single('file'), fileController.uploadFile)

// Listar ficheiros
router.get('/files', fileController.getFiles)

// Download de ficheiro por ID
router.get('/files/download/:id', fileController.downloadFile)

// Apagar ficheiro por ID
router.delete('/files/:id', fileController.deleteFile)

module.exports = router