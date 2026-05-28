import { redirect } from "next/navigation";

/** Ancienne route — redirection vers Trésorerie. */
export default function DepotsRedirectPage() {
  redirect("/tresorerie");
}
