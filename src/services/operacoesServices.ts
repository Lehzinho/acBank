import { api } from "@/config/api";

export async function getTransactions(userId: string) {
  try {
    const { data } = await api.get(`/api/v1/operacoes/${userId}`);

    return data;
  } catch (error) {}
}
export async function createTransaction(
  userEmail: string,
  destinatario: string,
  tipoTransacao: string,
  deposito: string,
  descricao: string,
  userId: string
) {
  try {
    const { data } = await api.post(`/api/v1/operacoes`, {
      usuario_origem_email: userEmail,
      usuario_destino_email: destinatario,
      tipo: tipoTransacao,
      valor: Number(deposito),
      descricao: descricao,
      user_id: userId,
    });

    return data;
  } catch (error) {}
}
