const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Usa a UC passada no body e normaliza (ex: "Álgebra" -> "algebra", "SC" -> "sc"). Falha segura para "geral"
    let uc = 'geral';
    if (req.body.uc) {
      uc = req.body.uc.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    
    // Suporte para usar variável de ambiente UPLOAD_DIR no Docker ou path local
    const baseUploadPath = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
    const uploadPath = path.join(baseUploadPath, uc);

    // Garante que o diretório é criado caso não exista
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Gera um nome único: timestamp + hash + extensão original
    const hash = crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${hash}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // Limite de 100MB
});

module.exports = upload;