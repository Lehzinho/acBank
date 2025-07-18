import { UnauthorizedError } from "../../../../../../infra/errors.js";
import operacao from "../../../../../../models/operacoes.js";
import session from "../../../../../../models/session.js";
import * as cookie from "cookie";

export async function GET(request, { params }) {
  // Aguarda os parâmetros antes de usar
  const resolvedParams = await params;
  const username = resolvedParams.usuario;

  try {
    // Extrai o cookie da requisição
    const cookieHeader = request.headers.get("cookie");
    await session.authenticate(cookieHeader);

    const userFound = await operacao.getTransactionsByUserId(username);

    return Response.json(userFound, { status: 200 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return Response.json(error, { status: error.statusCode });
  }
}
