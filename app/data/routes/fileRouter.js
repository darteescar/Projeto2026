const express = require('express')
const router = express.Router()
const fileController = require('../controllers/fileController')
const upload = require('../config/multer')

// Novo ficheiro
router.post('/upload', upload.single('file'), fileController.uploadFile)

// Listar ficheiros
router.get('/', fileController.getFiles)

// Download de ficheiro por ID
router.get('/download/:id', fileController.downloadFile)

// Apagar ficheiro por ID
router.delete('/:id', fileController.deleteFile)

module.exports = router