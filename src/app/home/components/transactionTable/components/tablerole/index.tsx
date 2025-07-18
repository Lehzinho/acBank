import { TransacaoProps } from "@/interfaces/transacao.type";
import { formatarReal } from "@/utils/formataReal";
import styles from "./tablerole.module.css";
import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Modal } from "@/components/modal";
import { IoReceiptOutline } from "react-icons/io5";

export const TableRole = (trans: TransacaoProps) => {
  const { user } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [transaction, setTransaction] = useState(trans);
  const modalRef = useRef<HTMLDivElement>(null);

  function handleTransaction(tran: TransacaoProps) {
    if (tran.tipo === "TRANSFERENCIA" && tran.usuario_origem_id !== user?.id) {
      setTransaction((prev) => ({ ...prev, tipo: "DEPOSITO" }));
    }
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

    // Adiciona o event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup: remove o event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    handleTransaction(trans);
  }, [user]);

  return (
    <>
      <tr className={styles.TableRole}>
        <td>{new Date(trans.created_at).toLocaleDateString("pt-BR")}</td>
        <td>{transaction.tipo === "DEPOSITO" ? "Crédito" : "Débito"} </td>
        <td
          style={{ textAlign: "right" }}
          className={
            transaction.tipo === "DEPOSITO" ? styles.Credito : styles.Debito
          }
        >{`${transaction.tipo === "TRANSFERENCIA" ? "- " : ""}${formatarReal(
          transaction.valor
        )}`}</td>
        <td style={{ textAlign: "center" }}>
          {showModal && (
            <Modal>
              <div className={styles.Modal} ref={modalRef}>
                <button onClick={() => setShowModal(false)}>X</button>
                <h1>Hello world</h1>
                <ul>
                  <li>
                    <p>Data da Transação</p>
                    <p>
                      {new Date(trans.created_at).toLocaleDateString("pt-BR")}
                    </p>
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
                    <p>{transaction.tipo}</p>
                  </li>
                  <li>
                    <p>Valor da Transação</p>
                    <p
                      className={
                        transaction.tipo === "DEPOSITO"
                          ? styles.Credito
                          : styles.Debito
                      }
                    >{`${
                      transaction.tipo === "TRANSFERENCIA" ? "- " : ""
                    }${formatarReal(transaction.valor)}`}</p>
                  </li>
                </ul>
              </div>
            </Modal>
          )}
          <button onClick={() => setShowModal(true)}>
            <IoReceiptOutline size={18} />
          </button>
        </td>
      </tr>
    </>
  );
};
