import {
  UnauthorizedError,
  ValidationError,
} from "../../../../../../../infra/errors";
import operacoes from "../../../../../../../models/operacoes.js";
import session from "../../../../../../../models/session.js";
import * as cookie from "cookie";

export async function GET(request, { params }) {
  // Aguarda os parâmetros antes de usar

  // Extrai o cookie da requisição
  try {
    const cookieHeader = request.headers.get("cookie");

    // Verifica se a sessão é válida
    await session.authenticate(cookieHeader);

    const resolvedParams = await params;
    const id = resolvedParams.id;

    const transacao = await operacoes.getTransactionById(id);
    return Response.json(transacao, { status: 200 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return Response.json(error, { status: error.statusCode });
  }
}

export async function PATCH(request, { params }) {
  try {
    // Extrai o cookie da requisição
    const cookieHeader = request.headers.get("cookie");

    await session.authenticate(cookieHeader);

    const body = await request.json();
    const resolvedParams = await params;
    const id = resolvedParams.id;
    console.log(body);

    const operacao = await operacoes.reimbursement(
      id,
      "ESTORNADA",
      body.descricao
    );

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
