import "server-only";
import { cache } from "react";

import { findOrNotFound, serverCaller } from "@/server/caller";

export const getPractitioner = cache(async (id: string) =>
  findOrNotFound((await serverCaller()).practitioners.get({ id })),
);
