import { redirect } from "next/navigation";

import { site } from "@/config/site";

export default function RootPage() {
  redirect(site.defaultRoute);
}
