import { describe, expect, test } from "bun:test";
import { parseServerEnv } from "../../src/server/env";

describe("parseServerEnv", () => {
  test("returns validated Twitch credentials", () => {
    expect(
      parseServerEnv({
        TWITCH_CLIENT_ID: "client-id",
        TWITCH_CLIENT_SECRET: "client-secret",
      }),
    ).toEqual({
      TWITCH_CLIENT_ID: "client-id",
      TWITCH_CLIENT_SECRET: "client-secret",
    });
  });

  test("names invalid variables without echoing credential values", () => {
    const leakedValue = "do-not-print-this-secret";

    expect(() =>
      parseServerEnv({
        TWITCH_CLIENT_ID: "",
        TWITCH_CLIENT_SECRET: leakedValue,
      }),
    ).toThrow("TWITCH_CLIENT_ID");

    try {
      parseServerEnv({
        TWITCH_CLIENT_ID: "",
        TWITCH_CLIENT_SECRET: leakedValue,
      });
    } catch (error) {
      expect(String(error)).not.toContain(leakedValue);
    }
  });
});
