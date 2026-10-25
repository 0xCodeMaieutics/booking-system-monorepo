/**
 * After booking, the Manage Link's token is kept in a session cookie scoped to the confirmation URL,
 * so the confirmation page can render the Appointment on the server.
 */
export const MANAGE_TOKEN_COOKIE = "manage-token";

export function rememberManageToken(confirmationUrl: string, token: string) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${MANAGE_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=${confirmationUrl}; samesite=lax${secure}`;
}

export function forgetManageToken(confirmationUrl: string) {
  document.cookie = `${MANAGE_TOKEN_COOKIE}=; path=${confirmationUrl}; max-age=0`;
}
