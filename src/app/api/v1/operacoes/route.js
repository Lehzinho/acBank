import operacoes from "../../../../../models/operacoes.js";
import session from "../../../../../models/session.js";
import * as cookie from "cookie";

import {
  UnauthorizedError,
  ValidationError,
} from "../../../../../infra/errors";

export async function POST(request) {
  try {
    // Extrai o cookie da requisição
    const cookieHeader = request.headers.get("cookie");

    if (!cookieHeader) {
      throw new UnauthorizedError({
        message: "Sessão não encontrada.",
        action: "Faça login para acessar este recurso.",
      });
    }

    // Parse dos cookies
    const cookies = cookie.parse(cookieHeader);
    const sessionToken = cookies.session_id;

    if (!sessionToken) {
      throw new UnauthorizedError({
        message: "Token de sessão não encontrado.",
        action: "Faça login para acessar este recurso",
      });
    }

    // Verifica se a sessão é válida
    const sessionData = await session.verify(sessionToken);

    if (!sessionData) {
      throw new UnauthorizedError({
        message: "Sessão inválida ou expirada.",
        action: "Faça login novamente",
      });
    }
    const body = await request.json();

    const operacao = await operacoes.create(body);
    return Response.json(operacao, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json(
        {
          name: "UnauthorizedError",
          message: "Usuario não autorizado.",
          action: "Faça login para acessar este recurso.",
          status_code: 401,
        },
        {
          status: error.statusCode,
        }
      );
    }
    if (error instanceof ValidationError) {
      return Response.json(error.toJSON(), {
        status: error.statusCode,
      });
    }

    throw error;
  }
}
