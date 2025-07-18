import orchestrator from "../../orchestrator";
import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";
import session from "models/session";

/**
 * CONFIGURAÇÃO INICIAL DOS TESTES
 *
 * beforeAll: Executado uma vez antes de todos os testes do arquivo
 * - Aguarda todos os serviços estarem prontos
 * - Limpa o banco de dados para garantir ambiente limpo
 * - Executa migrações pendentes do banco
 */
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

/**
 * SUITE DE TESTES PRINCIPAL
 *
 * Testa o endpoint: POST /api/v1/sessions
 * Funcionalidade: Login/Autenticação de usuários
 */
describe("POST /api/v1/sessions", () => {
  /**
   * GRUPO DE TESTES: Usuário Anônimo
   *
   * Testa diferentes cenários de tentativas de login
   * com credenciais corretas e incorretas
   */
  describe("Anonymous user", () => {
    /**
     * TESTE 1: Email Incorreto + Senha Correta
     *
     * Objetivo: Verificar se o sistema rejeita login com email inválido
     *
     * Cenário:
     * 1. Cria usuário com senha conhecida
     * 2. Tenta fazer login com email diferente mas senha correta
     * 3. Deve retornar erro 401 com mensagem padronizada
     */
    test("With incorrect `email` but correct `password`", async () => {
      // Arrange: Cria usuário com senha conhecida
      await orchestrator.createUser({
        password: "senha-correta",
      });

      // Dados de entrada para tentativa de login
      const userData = {
        email: "email.errado@gmail.com", // Email incorreto
        password: "senha-correta", // Senha correta
      };

      // Act: Executa requisição POST para criar sessão (login)
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // Assert: Verifica se retorna erro 401
      expect(response.status).toBe(401);

      const responseBody = await response.json();

      // Verifica estrutura padronizada de erro de autenticação
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos",
        status_code: 401,
      });
    });

    /**
     * TESTE 2: Email Correto + Senha Incorreta
     *
     * Objetivo: Verificar se o sistema rejeita login com senha inválida
     *
     * Cenário:
     * 1. Cria usuário com email conhecido
     * 2. Tenta fazer login com email correto mas senha incorreta
     * 3. Deve retornar erro 401 com mensagem padronizada
     */
    test("With incorrect `password` but correct `email`", async () => {
      // Arrange: Cria usuário com email conhecido
      await orchestrator.createUser({
        email: "email.correto@gmail.com",
      });

      // Dados de entrada para tentativa de login
      const userData = {
        email: "email.correto@gmail.com", // Email correto
        password: "senha-incorreta", // Senha incorreta
      };

      // Act: Executa requisição POST para criar sessão (login)
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // Assert: Verifica se retorna erro 401
      expect(response.status).toBe(401);

      const responseBody = await response.json();

      // Verifica estrutura padronizada de erro de autenticação
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos",
        status_code: 401,
      });
    });

    /**
     * TESTE 3: Email Incorreto + Senha Incorreta
     *
     * Objetivo: Verificar se o sistema rejeita login com ambas credenciais incorretas
     *
     * Cenário:
     * 1. Cria usuário qualquer (para ter dados no banco)
     * 2. Tenta fazer login com email e senha completamente incorretos
     * 3. Deve retornar erro 401 com mensagem padronizada
     */
    test("With incorrect `password` and incorrect `email`", async () => {
      // Arrange: Cria usuário qualquer para ter dados no banco
      const user = await orchestrator.createUser({});

      // Dados de entrada para tentativa de login
      const userData = {
        email: "email.incorreto@gmail.com", // Email incorreto
        password: "senha-incorreta", // Senha incorreta
      };

      // Act: Executa requisição POST para criar sessão (login)
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // Assert: Verifica se retorna erro 401
      expect(response.status).toBe(401);

      const responseBody = await response.json();

      // Verifica estrutura padronizada de erro de autenticação
      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos",
        status_code: 401,
      });
    });

    /**
     * TESTE 4: Email Correto + Senha Correta (LOGIN BEM-SUCEDIDO)
     *
     * Objetivo: Verificar se o sistema cria sessão corretamente com credenciais válidas
     *
     * Cenário:
     * 1. Cria usuário com credenciais conhecidas
     * 2. Faz login com credenciais corretas
     * 3. Verifica se sessão é criada com dados corretos
     * 4. Valida estrutura do token e cookie
     * 5. Verifica expiração da sessão
     */
    test("With correct `password` and correct `email`", async () => {
      // Arrange: Cria usuário com credenciais conhecidas
      const user = await orchestrator.createUser({
        email: "correctemail@gmail.com",
        password: "correct-password",
      });

      // Dados de entrada para login válido
      const userData = {
        email: "correctemail@gmail.com", // Email correto
        password: "correct-password", // Senha correta
      };

      // Act: Executa requisição POST para criar sessão (login)
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      // Assert: Verifica se login foi bem-sucedido
      expect(response.status).toBe(201);

      const responseBody = await response.json();

      /**
       * VALIDAÇÃO DA ESTRUTURA DA SESSÃO
       *
       * O sistema deve retornar:
       * - created_at: Data/hora de criação da sessão
       * - expires_at: Data/hora de expiração da sessão
       * - id: ID único da sessão (UUID v4)
       * - token: Token de autenticação
       * - updated_at: Data/hora de última atualização
       * - user_id: ID do usuário logado
       */
      expect(responseBody).toEqual({
        created_at: responseBody.created_at,
        expires_at: responseBody.expires_at,
        id: responseBody.id,
        token: responseBody.token,
        updated_at: responseBody.updated_at,
        user_id: user.id, // Vincula sessão ao usuário
      });

      /**
       * VALIDAÇÃO DA INTEGRIDADE DOS DADOS DINÂMICOS
       *
       * Verifica se os dados gerados automaticamente estão corretos:
       * - ID da sessão deve ser UUID v4
       * - Timestamps devem ser válidos
       * - Expiração deve estar configurada corretamente
       */

      // Verifica se ID da sessão é um UUID v4 válido
      expect(uuidVersion(responseBody.id)).toBe(4);

      // Verifica se timestamps são válidos
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      /**
       * VALIDAÇÃO DA EXPIRAÇÃO DA SESSÃO
       *
       * Verifica se a sessão expira no tempo correto configurado
       * no modelo de sessão (session.EXPIRATION_IN_MILLISECONDS)
       */
      const createdAt = new Date(responseBody.created_at);
      const expiresAt = new Date(responseBody.expires_at);

      // Remove milissegundos para comparação precisa
      createdAt.setMilliseconds(0);
      expiresAt.setMilliseconds(0);

      // Verifica se diferença entre criação e expiração é exatamente o tempo configurado
      expect(expiresAt - createdAt).toBe(session.EXPIRATION_IN_MILLISECONDS);

      /**
       * VALIDAÇÃO DO COOKIE DE SESSÃO
       *
       * Verifica se o cookie de sessão foi configurado corretamente
       * com todas as opções de segurança necessárias
       */
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        domain: "localhost", // Domínio do cookie
        name: "session_id", // Nome do cookie
        value: responseBody.token, // Valor = token da sessão
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000, // Tempo de vida em segundos
        path: "/", // Caminho do cookie
        sameSite: "Lax", // Proteção CSRF
        httpOnly: true, // Proteção XSS
      });
    });
  });
});
