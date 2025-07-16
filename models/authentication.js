import { NotFoundError, UnauthorizedError } from "../infra/errors";
import password from "./password.js";
import user from "./users.js";

async function getAuthenticatedUser(providedEmail, providedPassword) {
  const storedUser = await findUserByEmail(providedEmail);
  await validatePassword(providedPassword, storedUser.password);

  return storedUser;

  async function validatePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassword,
      storedPassword
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Senha não confere.",
        action: "Verifique se os dado está correto.",
      });
    }
  }

  async function findUserByEmail(providedEmail) {
    let storedUser;
    try {
      storedUser = await user.findOneByEmail(providedEmail);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Email não confere.",
          action: "Verifique se os dado está correto.",
        });
      }
      throw error;
    }
    return storedUser;
  }
}

const authentication = {
  getAuthenticatedUser,
};

export default authentication;
