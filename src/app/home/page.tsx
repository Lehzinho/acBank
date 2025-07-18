import { Container } from "@/components/container";
import { Header } from "./components/header";
import { TransactionMenu } from "./components/transactionMenu";
import { TransactionTable } from "./components/transactionTable";

export default async function Home() {
  return (
    <>
      <Header />
      <Container>
        <TransactionMenu />
        <TransactionTable />
      </Container>
    </>
  );
}
