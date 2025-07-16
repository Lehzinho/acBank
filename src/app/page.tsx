import { getAuthStatus, requireAuth } from "@/utils/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const { isAuthenticated } = await getAuthStatus();

  if (isAuthenticated) {
    redirect("/home");
  } else {
    redirect("/signin");
  }
}
