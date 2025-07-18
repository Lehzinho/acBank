import { UnauthorizedError } from "../../../../../../infra/errors.js";
import operacao from "../../../../../../models/operacoes.js";
import session from "../../../../../../models/session.js"; // Adicione esta importação
import * as cookie from "cookie";

export async function GET(request, { params }) {
  // Aguarda os parâmetros antes de usar
  const resolvedParams = await params;
  const username = resolvedParams.usuario;

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

    const userFound = await operacao.getTransactionsByUserId(username);

    return Response.json(userFound, { status: 200 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return Response.json(error, { status: error.statusCode });
  }
}
