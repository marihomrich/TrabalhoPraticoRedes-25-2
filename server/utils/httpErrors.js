/**
 * Cria um objeto de resposta HTTP de erro padronizado pelo grupo.
 * @param {number} status - O código de status HTTP (e.g., 400, 404, 422).
 * @param {string} message - A mensagem curta de erro (campo "error").
 * @param {string} [details] - Detalhes adicionais sobre o erro (campo "details", opcional).
 * @returns {{status: number, body: object}} Um objeto que o Controller/Service usará para responder.
 */
function httpError(status, message, details) {
    // O contrato do grupo define { "error": "...", "details": "..." } 
    const body = {
        error: message,
        details: details || "", // Garante que o campo 'details' exista, mesmo que vazio
    };

    // Retorna a estrutura que o Service/Controller espera.
    return {
        status,
        body
    };
}

// Exporta a função conforme o contrato 
module.exports = {
    httpError
};