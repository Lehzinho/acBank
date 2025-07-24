import { Container } from "@/components/container";
import { Header } from "./components/header";
import { TransactionMenu } from "./components/transactionMenu";
import { TransactionTable } from "./components/transactionTable";
import { getSession } from "@/services/sessionServices";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = (await cookies()).toString();
  const data = await getSession(cookieStore);
  if (!data.valid) {
    redirect("/signin");
  }
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
