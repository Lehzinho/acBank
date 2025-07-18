import user from "../../../../../../models/users.js";

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const username = resolvedParams.usuario;

  try {
    const userFound = await user.findOneByEmail(username);

    return Response.json(userFound, { status: 200 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return Response.json(error, { status: error.statusCode });
  }
}
