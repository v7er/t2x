import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/checkin")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "check-in" });
  },
});
