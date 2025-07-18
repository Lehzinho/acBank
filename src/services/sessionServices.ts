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

export async function getNewSession() {
  try {
    const { data } = await api.get("/api/v1/sessions");
    return data;
  } catch (error) {
    throw error;
  }
}
