import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AdminRouter } from "@tsami/api/admin";

export type AdminInputs = inferRouterInputs<AdminRouter>;
export type AdminOutputs = inferRouterOutputs<AdminRouter>;
