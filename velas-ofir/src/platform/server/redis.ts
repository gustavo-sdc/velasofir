import "server-only";
import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";
export function redisClient() {
  if (process.env.REDIS_ENABLED !== "true") return null;
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  )
    return null;
  return Redis.fromEnv();
}
export async function cached<T>(
  key: string,
  load: () => Promise<T>,
  ttl = 120,
): Promise<T> {
  const redis = redisClient();
  if (redis) {
    try {
      const value = await redis.get<T>(`ofir:v1:${key}`);
      if (value !== null) return value;
    } catch {
      /* Conteúdo público continua sem cache. */
    }
  }
  const value = await load();
  if (redis) {
    try {
      await redis.set(`ofir:v1:${key}`, value, { ex: ttl });
    } catch {
      /* Cache é auxiliar. */
    }
  }
  return value;
}
const counter = `local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return n`;
export async function rateLimit(
  scope: string,
  identity: string,
  maximum = 10,
  seconds = 60,
) {
  const redis = redisClient();
  if (!redis)
    throw new Error(
      "Proteção de acesso indisponível. Tente novamente mais tarde.",
    );
  const digest = createHash("sha256").update(identity).digest("hex");
  const window = Math.floor(Date.now() / (seconds * 1000));
  const count = await redis.eval<[number], number>(
    counter,
    [`ofir:v1:limit:${scope}:${digest}:${window}`],
    [seconds],
  );
  return count <= maximum;
}
