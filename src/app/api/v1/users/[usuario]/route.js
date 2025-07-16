import user from "../../../../../../models/users";

export async function GET(request, { params }) {
  const username = params.usuario;
  try {
    const userFound = await user.findOneByUsername(username);

    return Response.json(userFound, { status: 200 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return Response.json(error, { status: error.statusCode });
  }
}
