import { faker } from "@faker-js/faker/.";
import retry from "async-retry";
import database from "infra/database.js";
import migrator from "models/migrator.js";
import password from "models/password";
import user from "models/users.js";

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

const orchestrator = {
  runPendingMigrations,
  waitForAllServices,
  clearDatabase,
  createUser,
};

export default orchestrator;
