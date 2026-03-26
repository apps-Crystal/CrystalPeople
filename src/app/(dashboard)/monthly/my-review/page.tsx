import { redirect } from "next/navigation";

export default function MyReviewRedirect() {
  redirect("/monthly/self-score");
}
