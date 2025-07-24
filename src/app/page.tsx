import { getSession } from "@/services/sessionServices";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = (await cookies()).toString();
  const data = await getSession(cookieStore);
  if (data.valid) {
    redirect("/home");
  } else {
    redirect("/signin");
  }
}
