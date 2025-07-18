import { faker } from "@faker-js/faker/.";
import retry from "async-retry";
import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/users.js";
import session from "models/session.js";
import operacao from "models/operacoes.js";

async function waitForAllServices() {
  await waitForWebServices();

  async function waitForWebServices() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObject) {
  return await user.create({
    nome: userObject.nome || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject.email || faker.internet.email(),
    password: userObject.password || "validpassword",
  });
}

async function createOperation({
  usuario_origem_email,
  usuario_destino_email,
  tipo,
  valor,
  descricao,
  user_id,
}) {
  return await operacao.create({
    usuario_origem_email,
    usuario_destino_email,
    tipo,
    valor,
    descricao,
    user_id,
  });
}

async function createToken(userId) {
  return await session.create(userId);
}

const orchestrator = {
  runPendingMigrations,
  waitForAllServices,
  clearDatabase,
  createOperation,
  createToken,
  createUser,
};

export default orchestrator;
