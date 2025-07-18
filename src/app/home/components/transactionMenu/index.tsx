"use client";
import { AuthContext } from "@/context/AuthContext";
import { formatarValor } from "@/utils/formataReal";
import { useContext, useState } from "react";
import styles from "./transactionMenu.module.css";
import { createTransaction } from "@/services/operacoesServices";
import toast from "react-hot-toast";

export const TransactionMenu = () => {
  const { user, updateUserAccountValue } = useContext(AuthContext);
  const [tipoTransacao, setTipoTransacao] = useState<
    "DEPOSITO" | "TRANSFERENCIA"
  >("DEPOSITO");
  const [valor, setValor] = useState("0");
  const [destinatario, setDestinatario] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDeposit() {
    setLoading(true);
    const deposito = valor.replace(/[^\d]/g, "");
    try {
      if (deposito === "0") {
        setLoading(false);
        throw new Error("Digite o valor a ser mandado");
      }
      const data = await createTransaction(
        user?.email as string,
        destinatario,
        tipoTransacao,
        deposito,
        descricao,
        user?.id as string
      );

      if (!data) {
        throw new Error("Destinatario nao encontrado.");
      }

      updateUserAccountValue(
        tipoTransacao === "TRANSFERENCIA"
          ? data.senderBalance
          : data.receiverBalance
      );

      toast(`${tipoTransacao.toLocaleUpperCase()} efetuado com susseço.`);
    } catch (error: any) {
      toast(error.message);
    } finally {
      setValor("0");
      setLoading(false);
      setDestinatario("");
      setDescricao("");
    }
  }

  return (
    <section className={styles.Container}>
      <div>
        <button
          onClick={() => setTipoTransacao("DEPOSITO")}
          className={tipoTransacao === "DEPOSITO" ? styles.Active : ""}
        >
          Depósito
        </button>
        <button
          onClick={() => setTipoTransacao("TRANSFERENCIA")}
          className={tipoTransacao === "TRANSFERENCIA" ? styles.Active : ""}
        >
          Transferência
        </button>
      </div>
      <h3>
        Tipo da transação:{" "}
        {tipoTransacao === "DEPOSITO" ? "Depósito" : "Transferência"}
      </h3>
      <div>
        <label htmlFor="valor">
          Valor:
          <input
            id="valor"
            value={`R$ ${formatarValor(valor)}`}
            onChange={(e) => setValor(e.target.value)}
            placeholder="R$ 0,00"
          />
        </label>
        <label htmlFor="valor">
          Descrição:
          <input
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição da transação"
          />
        </label>
      </div>
      {tipoTransacao === "TRANSFERENCIA" && (
        <>
          <label htmlFor="destinatario">
            Destinatario:
            <input
              id="destinatario"
              type="email"
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
              placeholder="Digite o e-mail do destinatário"
            />
          </label>
        </>
      )}
      <button onClick={handleDeposit} disabled={loading}>
        {loading ? "Processando..." : "Enviar"}
      </button>
    </section>
  );
};
