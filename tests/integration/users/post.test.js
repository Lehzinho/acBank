import orchestrator from "../../orchestrator";
import user from "models/users";
import password from "models/password";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: "alexandretoulios",
          email: "test@gmail.com",
          password: "senha123",
        }),
      });

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        nome: "alexandretoulios",
        email: "test@gmail.com",
        saldo: "0.00",
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(response.status).toBe(201);
      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername("alexandretoulios");
      const correctPasswordMatch = await password.compare(
        "senha123",
        userInDatabase.password
      );

      const incorrectPasswordMatch = await password.compare(
        "senhaErrada",
        userInDatabase.password
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
    // test("With duplicated 'email'", async () => {});
    // test("With duplicated 'usuario'", async () => {});
  });
});
