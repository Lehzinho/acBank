import { api } from "@/config/api";

export async function createNewUser(
  nome: string,
  email: string,
  password: string
) {
  try {
    const { data } = await api.post("/api/v1/users", {
      nome,
      email,
      password,
    });
    return data;
  } catch (error) {}
}

export async function getUser(email: string) {
  try {
    const { data } = await api.get(`/api/v1/users/${email}`);

    return data;
  } catch (error) {}
}
