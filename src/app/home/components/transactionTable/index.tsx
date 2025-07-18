"use client";
import { AuthContext } from "@/context/AuthContext";
import { TransacaoProps } from "@/interfaces/transacao.type";
import { useContext, useEffect, useState } from "react";
import { TableRole } from "./components/tablerole";
import { getTransactions } from "@/services/operacoesServices";

import styles from "./transactionTable.module.css";

export const TransactionTable = () => {
  const { user } = useContext(AuthContext);
  const [transacoes, setTransacoes] = useState<TransacaoProps[]>([]);

  useEffect(() => {
    async function getOrders() {
      if (user && user.id) {
        const data = await getTransactions(user?.id as string);
        if (data) {
          setTransacoes(data);
        }
      }
    }
    getOrders();
  }, [user]);
  return (
    <table className={styles.Table}>
      <thead>
        <tr>
          <th style={{ textAlign: "left" }}>Data</th>
          <th>D/C</th>
          <th>Tipo</th>
          <th>Descricao</th>
          <th>Valor</th>
          <th>#</th>
        </tr>
      </thead>
      <tbody>
        {transacoes.map((trans) => (
          <TableRole key={trans.id} {...trans} />
        ))}
      </tbody>
    </table>
  );
};
