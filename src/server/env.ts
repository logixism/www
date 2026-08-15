import { z } from "zod";

const serverEnvSchema = z.object({
  TWITCH_CLIENT_ID: z.string().trim().min(1),
  TWITCH_CLIENT_SECRET: z.string().trim().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(input: Record<string, unknown>): ServerEnv {
  const result = serverEnvSchema.safeParse(input);
  if (result.success) return result.data;

  const names = [
    ...new Set(
      result.error.issues
        .map((issue) => issue.path[0])
        .filter((name): name is string => typeof name === "string"),
    ),
  ];
  throw new Error(`Invalid server environment: ${names.join(", ")}`);
}

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cachedEnv ??= parseServerEnv({
    TWITCH_CLIENT_ID: import.meta.env.TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET: import.meta.env.TWITCH_CLIENT_SECRET,
  });
  return cachedEnv;
}
