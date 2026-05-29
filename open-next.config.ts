import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// OpenNext-конфиг для Cloudflare. Дефолтный пресет покрывает SSR/ISR/RSC
// и стандартный Next 16 без кастомных incremental cache / queue.
// Если позже понадобится KV/R2-кеш для ISR — добавим incrementalCache: kvIncrementalCache.
export default defineCloudflareConfig();
