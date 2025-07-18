import { serialize } from "cookie";

export async function POST() {
  const setCookie = serialize("session_id", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });

  return Response.json(
    { success: true },
    {
      status: 200,
      headers: {
        "Set-Cookie": setCookie,
        "Content-Type": "application/json",
      },
    }
  );
}
