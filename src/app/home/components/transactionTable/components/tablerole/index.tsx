import { TransacaoProps } from "@/interfaces/transacao.type";
import { formatarReal } from "@/utils/formataReal";
import styles from "./tablerole.module.css";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Modal } from "@/components/modal";
import { IoReceiptOutline } from "react-icons/io5";
import { TransactionDetails } from "../transactionDetails";

export const TableRole = (trans: TransacaoProps) => {
  const { user } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [transferencia, setTransferencia] = useState(false);
  const [debitoCredito, setDebitoCredito] = useState("");

  function handleTransaction(tran: TransacaoProps) {
    if (tran.tipo === "TRANSFERENCIA" && tran.usuario_origem_id === user?.id) {
      setDebitoCredito("Débito");
    } else if (
      tran.tipo === "TRANSFERENCIA" &&
      tran.usuario_origem_id !== user?.id
    ) {
      setDebitoCredito("Crédito");
      setTransferencia(true);
    } else if (
      tran.tipo === "REINBOLSO" &&
      tran.usuario_origem_id === user?.id
    ) {
      setDebitoCredito("Débito");
    } else if (
      tran.tipo === "REINBOLSO" &&
      tran.usuario_origem_id !== user?.id
    ) {
      setDebitoCredito("Crédito");
    } else if (
      tran.tipo === "ESTORNADA" &&
      tran.usuario_origem_id === user?.id
    ) {
      setDebitoCredito("Débito");
    } else if (
      tran.tipo === "ESTORNADA" &&
      tran.usuario_origem_id !== user?.id
    ) {
      setDebitoCredito("Crédito");
    } else {
      setDebitoCredito("Crédito");
    }
  }

  useEffect(() => {
    handleTransaction(trans);
  }, [user]);

  return (
    <tr className={styles.TableRole}>
      <td>{new Date(trans.created_at).toLocaleDateString("pt-BR")}</td>
      <td>{debitoCredito} </td>
      <td>
        <p style={{ textTransform: "capitalize" }}>
          {trans.tipo.toLowerCase()}
        </p>
      </td>
      <td>
        <p>{trans.descricao}</p>
      </td>
      <td
        style={{ textAlign: "right" }}
        className={debitoCredito === "Crédito" ? styles.Credito : styles.Debito}
      >{`${debitoCredito !== "Crédito" ? "- " : ""}${formatarReal(
        trans.valor
      )}`}</td>
      <td style={{ textAlign: "center" }}>
        {showModal && (
          <Modal>
            <TransactionDetails
              debitoCredito={debitoCredito}
              setShowModal={setShowModal}
              trans={trans}
              transferencia={transferencia}
            />
          </Modal>
        )}
        <button onClick={() => setShowModal(true)}>
          <IoReceiptOutline size={18} />
        </button>
      </td>
    </tr>
  );
};
