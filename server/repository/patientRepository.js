// Armazenamento em memória simples (simulando um "banco de dados")
// Chave: ID numérico do Patient
// Valor: Objeto Patient FHIR completo
const patients = {};

// Variável para controle da geração de ID sequencial.
let nextId = 1;

/**
 * [Função Opcional] Inicializa o repositório.
 * Não faz nada neste caso de persistência em memória.
 */
function init() {
    // console.log("Repositório de pacientes inicializado.");
}

/**
 * Cria e salva um novo Patient.
 * @param {object} patientWithoutId - O objeto Patient (sem 'identifier' preenchido)
 * @returns {{id: number, patientWithId: object}} O ID gerado e o Patient completo com o ID.
 */
function create(patientWithoutId) {
    const id = nextId++;
    
    // Adiciona o identifier no formato FHIR-like acordado pelo grupo 
    const patientWithId = {
        ...patientWithoutId,
        identifier: [{ value: String(id) }] // Armazenamos como string para consistência com o FHIR (mesmo sendo ID numérico)
    };

    patients[id] = patientWithId;
    
    return { id, patientWithId };
}

/**
 * Retorna um Patient pelo ID.
 * @param {number} id - O ID do Patient a ser lido.
 * @returns {object | null} O objeto Patient ou null se não for encontrado (ou 'deletado' no nosso contexto).
 */
function read(id) {
    // Devolve o paciente armazenado, se existir.
    return patients[id] || null;
}

/**
 * Atualiza um Patient existente.
 * @param {number} id - O ID do Patient a ser atualizado (deve ser um ID existente).
 * @param {object} patient - O objeto Patient completo já validado.
 * @returns {void}
 */
function update(id, patient) {
    // O service/controller deve garantir que o recurso exista antes de chamar o update.
    // E o validador garante que o ID na URL seja o mesmo no body. 
    if (patients[id]) {
        // Substitui o objeto completo.
        patients[id] = patient;
    }
}

/**
 * Remove um Patient de forma definitiva.
 * @param {number} id - O ID do Patient a ser removido.
 * @returns {void}
 */
function remove(id) {
    // A remoção de vez garante que o GET subsequente retorne 404 Not Found. 
    delete patients[id];
}

/**
 * Retorna um array com todos os IDs de Patient existentes.
 * @returns {number[]} Array de IDs existentes.
 */
function listIds() {
    // Object.keys(patients) retorna um array de strings com as chaves (IDs).
    // Usamos map para converter de volta para números, conforme esperado pelo PatientIDs. 
    return Object.keys(patients).map(id => parseInt(id, 10));
}

// Exporta as funções conforme o contrato 
module.exports = {
    init,
    create,
    read,
    update,
    remove,
    listIds,
};