import { afterEach, describe, expect, it, vi } from "vitest";

import { senderGeSmsSender } from "./sms";

function mockFetch(status: number, body: unknown) {
  const fetch = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () =>
    Response.json(body, { status }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("senderGeSmsSender", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts an informational SMS to the 9-digit national number", async () => {
    const fetch = mockFetch(200, { data: [{ messageId: "123KUxuhiGyDN3", statusId: 1, qnt: 1 }] });
    await senderGeSmsSender("key").send("+995599446450", "Face: your code is 4821");

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("https://sender.ge/api/send.php");
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      apikey: "key",
      smsno: "2",
      destination: "599446450",
      content: "Face: your code is 4821",
    });
  });

  it("throws the provider's message on an error status", async () => {
    mockFetch(402, { message: "overdraft" });
    await expect(senderGeSmsSender("key").send("+995599446450", "hi")).rejects.toThrow(
      "sender.ge 402: overdraft",
    );
  });

  it("refuses numbers outside Georgia without calling the API", async () => {
    const fetch = mockFetch(200, {});
    await expect(senderGeSmsSender("key").send("+4915123456789", "hi")).rejects.toThrow("Georgian");
    expect(fetch).not.toHaveBeenCalled();
  });
});
