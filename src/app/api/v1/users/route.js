import user from "../../../../../models/users";
import { NotFoundError, ValidationError } from "../../../../../infra/errors";

export async function POST(request) {
  const body = await request.json();
  try {
    const newUser = await user.create(body);
    return Response.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return Response.json(error, { status: error.statusCode });
  }
}
