import user from "../../../../../models/users";

export async function POST(request) {
  const body = await request.json();

  const newUser = await user.create(body);

  return Response.json(newUser, { status: 201 });
}
