# PatientsOnFIRE / CRUDEPatients — Trabalho Prático (REST + FHIR)

# Integrantes: Emilie Kim, Henrique Fenilli, Mariana Homrich, Mariana Luísa, Pamela Piovisan


Este repositório contém a implementação do sistema **PatientsOnFIRE** (servidor REST em Node.js) e do cliente **CRUDEPatients** (HTML/JS) para manipular recursos **Patient** no padrão **HL7 FHIR v5.0.0**, conforme o enunciado da disciplina.

A ideia do grupo é trabalhar de forma **independente em casa** e depois **encaixar as partes** com o mínimo de conflito.  
Por isso, as pastas e contratos abaixo foram definidos como “interfaces” entre os módulos.

---

## Visão geral da arquitetura

- **Servidor (PatientsOnFIRE)**  
  API RESTful que expõe endpoints CRUD para `/Patient` e `/PatientIDs`.  
  Responsável por gerar IDs, validar o JSON FHIR mínimo e persistir pacientes.

- **Cliente (CRUDEPatients)**  
  Interface web que permite criar, listar, buscar, editar e deletar pacientes via API.

- **Testes**  
  Coleção Postman ou testes automatizados que validam se a API atende a especificação.

A comunicação é sempre **JSON** (sem XML) e os pacientes são identificados por **IDs inteiros positivos**.

---

## Partes de cada um, como funciona e como se relacionam

A implementação foi dividida em módulos independentes. Pense como peças de Lego: cada pessoa constrói a sua peça em casa e depois todas se encaixam para formar o sistema completo.

---

### **Pamela — Cliente/Site (CRUDEPatients)**

**O que faz:**  
É a parte que o usuário vê no navegador. Tem formulário, botões e tabela para interagir com os pacientes.

**Como se relaciona com o resto:**  
- O usuário preenche os dados do paciente no site.  
- O site transforma esses dados em um JSON no padrão Patient.  
- O site envia esse JSON para o servidor pedindo: criar / editar / buscar / deletar.  
- Depois mostra a resposta do servidor na tela (lista atualizada, mensagens de erro etc.).

**Em resumo:**  
Pamela é o **“controle remoto”** do sistema.

---

### **Henrique — Servidor/Rotas (PatientsOnFIRE)**

**O que faz:**  
É o “atendente da central”. Ele recebe todas as requisições vindas do site (POST, GET, PUT, DELETE) e coordena o que deve acontecer.

**Como se relaciona com o resto:**  
- Recebe pedidos vindos do cliente da Pamela.  
- **Antes de salvar ou atualizar**, manda os dados para a Emilie validar.  
- Se a Emilie aprovar, manda para a Homrich guardar/atualizar.  
- Devolve o resultado final para o cliente.

**Em resumo:**  
Henrique é quem **organiza o fluxo** e garante que a API siga as regras do trabalho.

---

### **Emilie — Validador/Modelo Patient (FHIR mínimo)**

**O que faz:**  
É a “portaria/checagem de qualidade”. Garante que o paciente enviado está no formato certo e com os campos mínimos obrigatórios.

**Como se relaciona com o resto:**  
- Henrique manda o JSON do paciente para validação.  
- Emilie verifica se:  
  - é realmente um `Patient`;  
  - tem nome, gênero e data de nascimento;  
  - no PUT, o `identifier` combina com o ID da URL.  
- Se estiver ok → devolve “pode passar” (com JSON ajustado/normalizado).  
- Se não estiver ok → devolve erro (400 ou 422).

**Em resumo:**  
Emilie decide se o paciente **entra no sistema** ou é **barrado**.

---

### **Mariana Homrich — Repositório/Persistência + Helpers de Erro**

**O que faz:**  
É a parte que **guarda os pacientes de verdade**, como um mini-banco de dados simples (em memória e/ou arquivo).  
Também cria um helper para padronizar respostas de erro.

**Como se relaciona com o resto:**  
- Só recebe pacientes quando Emilie aprovou.  
- Henrique pede para ela:  
  - salvar novo paciente (POST),  
  - buscar paciente (GET),  
  - atualizar (PUT),  
  - deletar (DELETE),  
  - listar IDs (PatientIDs).  
- Ela devolve os dados para o Henrique responder ao cliente.

**Em resumo:**  
Homrich é o **“arquivo/banco”** do sistema.

---

### **Mariana Luísa — Testes + Integração**

**O que faz:**  
É quem confirma se tudo está certo. Cria testes (Postman ou automáticos) simulando o uso real.

**Como se relaciona com o resto:**  
- Testa o servidor do Henrique com vários casos.  
- Confere se Emilie barra o que deve barrar.  
- Confere se Homrich guarda e devolve direitinho.  
- Confere se o cliente da Pamela funciona com o backend real.

**Em resumo:**  
Mariana Luísa é a **“auditoria/controle de qualidade final”**.

---

### **Fluxo completo (bem simples)**

1. Usuário usa o site da Pamela.  
2. Pamela envia pedido pro servidor do Henrique.  
3. Henrique manda o JSON pra Emilie validar.  
4. Emilie aprova ou bloqueia.  
5. Se aprovou → Henrique manda pra Homrich guardar/alterar.  
6. Henrique responde pro site.  
7. Pamela mostra na tela.  
8. Mariana Luísa testa tudo isso pra garantir que tá certo.  

---

## Decisões em comum do grupo

Estas decisões foram escolhidas para facilitar a implementação e garantir compatibilidade entre módulos:

1. **Campos mínimos obrigatórios do Patient:**  
   `resourceType`, `name` (pelo menos 1), `gender`, `birthDate`.

2. **Formato do identifier (FHIR-like):**  
   `identifier: [{ value: <ID> }]`

3. **PUT não cria recurso novo:**  
   se `PUT /Patient/<ID>` e o recurso não existir → `404 Not Found`.

4. **Após DELETE, GET retorna:**  
   `404 Not Found`.

5. **DELETE retorna:**  
   `204 No Content` (sem corpo).

6. **Formato padrão de erro:**  
   ```json
   { "error": "mensagem curta", "details": "opcional" }
   ```

7. **BaseURL/porta padrão:**  
   `http://localhost:3000`.

Esses pontos são importantes porque **cliente, servidor e testes precisam usar exatamente o mesmo padrão**.

---

## Estrutura de pastas do projeto

```
/server
  app.js                         <-- Henrique
  routes/patientRoutes.js        <-- Henrique
  controllers/patientController.js <-- Henrique
  services/patientService.js     <-- Henrique
  models/patientValidator.js     <-- Emilie
  repository/patientRepository.js <-- Mariana Homrich
  utils/httpErrors.js            <-- Mariana Homrich
  package.json                   <-- Henrique

/client
  index.html                     <-- Pamela
  script.js                      <-- Pamela

/tests
  postman_collection.json        <-- Mariana Luísa
  OU
  patient.test.js                <-- Mariana Luísa
  README_tests.md                <-- Mariana Luísa

/examples
  patient_valid.json             <-- Emilie
  patient_invalid.json           <-- Emilie

README.md
```

A seguir, cada pasta é detalhada com **o que contém**, **quem mexe nela** e **como se encaixa no restante**.

---

## `/server` — Servidor PatientsOnFIRE (Node.js)

### O que contém
Implementação do backend REST.  
Organizado em camadas para facilitar testes e manutenção:

- **`app.js`**  
  Ponto de entrada do servidor. Configura Express, middleware JSON e registra rotas.

- **`routes/patientRoutes.js`**  
  Define os endpoints:
  - `POST /Patient`
  - `PUT /Patient/:id`
  - `GET /Patient/:id`
  - `DELETE /Patient/:id`
  - `GET /PatientIDs`

- **`controllers/patientController.js`**  
  Recebe requisições HTTP e traduz para chamadas internas (service).

- **`services/patientService.js`**  
  Lógica de negócio do CRUD.  
  Aqui o servidor **chama o validador** e o **repositório**.

- **`models/patientValidator.js`** (**Emilie**)  
  **Validação pura** do JSON Patient mínimo (sem Express).  
  Exporta:
  ```js
  normalizePatient(patient)
  validateForCreate(patient)
  validateForUpdate(patient, idFromUrl)
  ```
  O service usa essas funções antes de salvar/atualizar.

- **`repository/patientRepository.js`** (**Mariana Homrich**)  
  Persistência simples (memória e/ou arquivo).  
  Exporta:
  ```js
  init()
  create(patientWithoutId)
  read(id)
  update(id, patient)
  remove(id)
  listIds()
  ```
  O service usa o repo para armazenar e recuperar pacientes.

- **`utils/httpErrors.js`** (opcional)  
  Helpers para padronizar mensagens/retornos de erro.

- **`package.json`**  
  Dependências e scripts do backend.

### Quem trabalha aqui
- **Henrique:** `app.js`, `routes/`, `controllers/`, `services/`  
- **Emilie:** `models/patientValidator.js`  
- **Mariana Homrich:** `repository/patientRepository.js`

### Como encaixa com o resto
- O **controller** recebe a requisição e chama o **service**.
- O **service**:
  1. valida o JSON via `patientValidator`  
  2. salva/busca via `patientRepository`  
  3. devolve para o controller o status e o corpo de resposta.
- O **cliente** chama esses endpoints via HTTP.
- Os **testes** validam esses endpoints.

---

## `/client` — Cliente CRUDEPatients (HTML/JS)

### O que contém
Interface web para consumir o servidor REST:

- **`index.html`** (**Pamela**)  
  Front pronto do grupo com:
  - formulário de busca
  - modal de cadastro
  - modal de edição
  - tabela de pacientes

- **`script.js`** (**Pamela**)  
  Implementa o CRUD via `fetch` usando os endpoints do servidor.  
  Responsável por:
  - montar JSON Patient mínimo no padrão acordado
  - fazer requisições
  - renderizar pacientes na tabela
  - exibir mensagens conforme status codes

- **`style.css`** (opcional)  
  Estilos adicionais caso necessário.

### Quem trabalha aqui
- **Pamela:** `script.js` (e ajustes no HTML se precisar de link script)

### Como encaixa com o resto
- O cliente assume baseURL `http://localhost:3000`.
- Para listar tudo, chama `GET /PatientIDs` e depois `GET /Patient/<ID>`.
- Para criar, chama `POST /Patient` (sem identifier).
- Para editar, chama `PUT /Patient/<ID>` (com identifier correto).
- Para deletar, chama `DELETE /Patient/<ID>`.

---

## `/tests` — Testes do sistema

### O que contém
Artefatos para garantir que o servidor segue a especificação:

- **`postman_collection.json`** (**Mariana Luísa**)  
  Coleção com casos de teste prontos (happy path + erros).

**ou**

- **`patient.test.js`** (**Mariana Luísa**)  
  Testes automatizados (Jest + supertest).

- **`README_tests.md`**  
  Instruções de como rodar os testes.

### Quem trabalha aqui
- **Mariana Luísa**

### Como encaixa com o resto
Os testes chamam a API real do `/server`.  
Se algo falhar, indica que:
- o contrato foi quebrado
- ou algum endpoint não está seguindo a spec.

---

## `/examples` — Exemplos de JSON

### O que contém
- **`patient_valid.json`** (**Emilie**)  
  Exemplo mínimo válido para POST.

- **`patient_invalid.json`** (**Emilie**)  
  Exemplo inválido para demonstrar retorno 400/422.

### Quem trabalha aqui
- **Emilie**

### Como encaixa com o resto
- Facilita validar o backend manualmente.
- Serve como referência para o cliente montar os JSONs.
- Pode ser reaproveitado em testes.

---

## Como rodar o projeto

### 1) Servidor
```bash
cd server
npm install
node app.js
```
Servidor inicia em `http://localhost:3000`.

### 2) Cliente
Abra `client/index.html` no navegador  
(ou use a extensão Live Server do VSCode).

### 3) Testes
**Postman**: importar `tests/postman_collection.json` e rodar.  

**Automatizado** (se estiver usando Jest):
```bash
cd server
npm test
```

---

## Como cada parte se encaixa (resumo)

1. **Cliente** envia JSON Patient mínimo →  
2. **Controller** recebe →  
3. **Service** valida (`patientValidator`) →  
4. **Service** persiste (`patientRepository`) →  
5. **Controller** responde HTTP →  
6. **Cliente** renderiza →  
7. **Testes** garantem que 1–6 seguem o contrato.

---

## Responsabilidades do grupo (independente)

- **Henrique (Backend REST + rotas/controle)**  
  `server/app.js`, `server/routes/`, `server/controllers/`, `server/services/`

- **Emilie (Validador Patient FHIR mínimo + exemplos)**  
  `server/models/patientValidator.js`, `examples/*`

- **Mariana Homrich (Repositório/persistência)**  
  `server/repository/patientRepository.js`

- **Pamela (Cliente JS do CRUD)**  
  `client/script.js` (+ link no HTML)

- **Mariana Luísa (Testes + integração)**  
  `tests/*`

---

## Checklist de merge final

1. Henrique integra os módulos de Emilie e Homrich com `require()` nos caminhos corretos.
2. Conferir se os 7 pontos do contrato comum foram respeitados.
3. Rodar servidor + cliente juntos.
4. Rodar testes e corrigir o que falhar.
5. Gerar ZIP final com `/server`, `/client`, `/tests`, `/examples` e este README.

---

Qualquer dúvida sobre o contrato ou sobre como estruturar as camadas do servidor, falem no grupo antes de codar para não divergir padrões.
