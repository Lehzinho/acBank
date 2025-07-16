import orchestrator from "../../orchestrator";
import user from "models/users";
import password from "models/password";
import { version as uuidVersion } from "uuid";

/**
 * Configuração inicial dos testes
 *
 * beforeAll: Executa uma vez antes de todos os testes
 * - Aguarda todos os serviços ficarem disponíveis
 * - Limpa o banco de dados para garantir estado limpo
 * - Executa migrações pendentes
 */
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      // Dados de entrada para criação do usuário
      const userData = {
        nome: "alexandretoulios",
        email: "test@gmail.com",
        password: "senha123",
      };

      // Executa requisição POST para criar usuário
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const responseBody = await response.json();

      // Verifica estrutura da resposta
      expect(responseBody).toEqual({
        id: responseBody.id,
        nome: "alexandretoulios",
        email: "test@gmail.com",
        saldo: "0.00", // Saldo inicial padrão
        password: responseBody.password, // Senha criptografada
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      // Verifica status HTTP de sucesso
      expect(response.status).toBe(201);

      // Verifica se ID é UUID v4 válido
      expect(uuidVersion(responseBody.id)).toBe(4);

      // Verifica se timestamps são válidos
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // Verifica se usuário foi salvo no banco de dados
      const userInDatabase = await user.findOneByUsername("alexandretoulios");

      // Testa se a senha foi criptografada corretamente
      const correctPasswordMatch = await password.compare(
        "senha123",
        userInDatabase.password
      );

      // Testa se senhas incorretas não passam na validação
      const incorrectPasswordMatch = await password.compare(
        "senhaErrada",
        userInDatabase.password
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });

    test("With duplicated 'email'", async () => {
      // Cria primeiro usuário com email específico
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: "emailduplicado1",
          email: "duplicado@gmail.com",
          password: "senha123",
        }),
      });

      // Verifica se primeiro usuário foi criado com sucesso
      expect(response1.status).toBe(201);

      // Tenta criar segundo usuário com mesmo email (case diferente)
      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado2", // Note: deveria ser 'nome' em vez de 'username'
          email: "Duplicado@gmail.com", // Mesmo email com case diferente
          password: "senha123",
        }),
      });

      // Verifica se segunda tentativa falha com erro de validação
      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      // Verifica estrutura do erro retornado
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O email informado já está send utilizado", // Typo: "send" deveria ser "sendo"
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With duplicated 'usuario'", async () => {
      // Cria primeiro usuário com nome específico
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: "usernameduplicado",
          email: "usernameduplicado1@gmail.com",
          password: "senha123",
        }),
      });

      // Verifica se primeiro usuário foi criado com sucesso
      expect(response1.status).toBe(201);

      // Tenta criar segundo usuário com mesmo nome (case diferente)
      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: "UsernameDuplicado", // Mesmo nome com case diferente
          email: "usernameduplicado2@gmail.com",
          password: "senha123",
        }),
      });

      // Verifica se segunda tentativa falha com erro de validação
      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      // Verifica estrutura do erro para nome duplicado
      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O usuário informado já está send utilizado", // Typo: "send" deveria ser "sendo"
        action: "Utilize outro nome de usuário para realizar esta operação.",
        status_code: 400,
      });
    });
  });
});
