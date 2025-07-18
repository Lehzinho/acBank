import authentication from "../../../../../models/authentication.js";
import session from "../../../../../models/session.js";
import * as cookie from "cookie";
import { UnauthorizedError } from "../../../../../infra/errors";

export async function POST(request) {
  const userInputValues = await request.json();
  try {
    const authenticatedUser = await authentication.getAuthenticatedUser(
      userInputValues.email,
      userInputValues.password
    );

    const newSession = await session.create(authenticatedUser.id);

    const setCookie = cookie.serialize("session_id", newSession.token, {
      path: "/",
      maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Importante para desenvolvimento
      domain: process.env.NODE_ENV === "production" ? undefined : "localhost",
    });
    return Response.json(newSession, {
      status: 201,
      headers: {
        "Set-Cookie": setCookie,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      const unauthorizedError = new UnauthorizedError({
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos",
      });

      return Response.json(unauthorizedError.toJSON(), {
        status: unauthorizedError.statusCode,
      });
    }

    throw error;
  }
}

export async function GET(request) {
  try {
    // Extrai o cookie da requisição
    const cookieHeader = request.headers.get("cookie");

    if (!cookieHeader) {
      throw new UnauthorizedError({
        message: "Sessão não encontrada.",
        action: "Faça login para acessar este recurso",
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

    // Retorna os dados da sessão válida
    return Response.json(
      {
        valid: true,
        user_id: sessionData.user_id,
        expires_at: sessionData.expires_at,
        email: sessionData.email,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json(error.toJSON(), {
        status: error.statusCode,
      });
    }

    throw error;
  }
}
