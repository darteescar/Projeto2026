const fs = require('fs')
const path = require('path')
const axios = require('axios')
const FormData = require('form-data')

const API_BASE_URL = 'http://localhost:16000/api'
const RECURSOS_JSON = path.join(__dirname, 'recursos.json')

async function startImport() {
    try {
        if (!fs.existsSync(RECURSOS_JSON)) {
            console.error('[ERRO] Ficheiro recursos.json não encontrado na raiz!')
            return
        }

        const recursos = JSON.parse(fs.readFileSync(RECURSOS_JSON, 'utf8'))
        console.log(`Encontrados ${recursos.length} recursos para importar. A iniciar...\n`)

        for (const rec of recursos) {
            try {
                // 1. Verificar se o ficheiro existe no path relativo
                const filePath = path.join(__dirname, rec.path)
                if (!fs.existsSync(filePath)) {
                    console.warn(`[Aviso] Ficheiro físico não encontrado, recurso ignorado: ${filePath}`)
                    continue
                }

                // 2. Fazer o Upload do Ficheiro primeiro
                const form = new FormData()
                form.append('uc', rec.uc) // Passar a UC permite que o multer crie na subpasta correta
                form.append('category', 'batch_import')
                form.append('file', fs.createReadStream(filePath))

                console.log(`A enviar: ${rec.path}...`)
                
                const uploadResponse = await axios.post(`${API_BASE_URL}/files/upload`, form, {
                    headers: { ...form.getHeaders() }
                })
                
                // O controller de file envia o newFile (no qual apanhamos o _id base do mongo)
                const fileId = uploadResponse.data._id 

                // 3. Criar os metadados do recurso preenchendo o que falta e usando o fileId obtido
                const novoRecurso = {
                    id: rec.id,
                    titulo: rec.titulo,
                    ano: rec.ano,
                    tipo: rec.tipo,
                    uc: rec.uc,
                    autor: 1, // hardcoded a autor 1 (suposto admin/sistema produtor)
                    data_registo: new Date().toISOString(), // dia de hoje
                    visibilidade: 'publico', // publico por omissao inicial
                    downloads: 0,
                    visualizacoes: 0,
                    media_avaliacoes: 0,
                    ficheiro: fileId // ligação 
                }

                const recursoResponse = await axios.post(`${API_BASE_URL}/recursos`, novoRecurso)
                console.log(` > Recurso #${recursoResponse.data.id} associado e criado com sucesso.\n`)

            } catch (err) {
                console.error(`[Erro] Falha ao importar recurso ID: ${rec.id}: `, err.response ? err.response.data : err.message)
            }
        }

        console.log('--- Processo de importação terminado ---')
    } catch (error) {
        console.error(`Erro crítico no importador: ${error.message}`)
    }
}

// Iniciar a script
startImport()