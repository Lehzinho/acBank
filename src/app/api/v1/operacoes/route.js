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

    await session.authenticate(cookieHeader);
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
