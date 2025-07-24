import { api } from "@/config/api";

export async function createNewSession(email: string, password: string) {
  try {
    await api.post("/api/v1/sessions", {
      email,
      password,
    });
  } catch (error) {
    throw error;
  }
}

export async function getSession(cookieHeader?: string | undefined) {
  let response;
  if (cookieHeader) {
    response = await fetch(`${process.env.HOST_URL}/api/v1/sessions`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader || "",
      },
      credentials: "include", // importante para cookies
    });
    const data = await response.json();
    return data;
  } else {
    const { data } = await api.get("/api/v1/sessions");
    return data;
  }
}
