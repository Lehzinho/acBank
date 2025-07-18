"use client";
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./transactionDetails.module.css";
import { TransacaoProps } from "@/interfaces/transacao.type";
import { formatarReal } from "@/utils/formataReal";
import { patchTransaction } from "@/services/operacoesServices";
import { AuthContext } from "@/context/AuthContext";

interface TransactionDetailsProps {
  trans: TransacaoProps;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  debitoCredito: string;
  transferencia: boolean;
}

export const TransactionDetails = ({
  trans,
  debitoCredito,
  transferencia,
  setShowModal,
}: TransactionDetailsProps) => {
  const { user, updateUserAccountValue } = useContext(AuthContext);
  const modalRef = useRef<HTMLDivElement>(null);
  const [descricao, setDescricao] = useState("");

  async function handleReimbursment() {
    await patchTransaction(user?.id as string, trans.id, descricao);
    updateUserAccountValue((user?.saldo as number) - trans.valor);
    setShowModal(false);
    setDescricao("");
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.Modal} ref={modalRef}>
      <button onClick={() => setShowModal(false)}>X</button>
      <h1>Hello world</h1>
      <ul>
        <li>
          <p>Data da Transação</p>
          <p>{new Date(trans.created_at).toLocaleDateString("pt-BR")}</p>
        </li>
        <li>
          <p>Dercrição</p>
          <p>{trans.descricao}</p>
        </li>
        {trans.revertida && (
          <li>
            <p>{trans.revertida}</p>
          </li>
        )}
        <li>
          <p>Tipo da Transação</p>
          <p>{trans.tipo}</p>
        </li>
        <li>
          <p>Valor da Transação</p>
          <p
            className={
              debitoCredito === "Crédito" ? styles.Credito : styles.Debito
            }
          >{`${debitoCredito === "Crédito" ? "" : "- "}${formatarReal(
            trans.valor
          )}`}</p>
        </li>
      </ul>
      {transferencia && (
        <div className={styles.Estorno}>
          <label htmlFor="">
            Descrição do Estorno:
            <textarea
              name=""
              id=""
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </label>
          <button onClick={handleReimbursment}>Estornar</button>
        </div>
      )}
    </div>
  );
};
