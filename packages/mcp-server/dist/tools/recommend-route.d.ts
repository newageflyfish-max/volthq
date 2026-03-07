/**
 * volt_recommend_route — Get optimal provider recommendation.
 *
 * Runs the scoring algorithm against cached offerings with the agent's
 * routing profile and returns an actionable recommendation with savings.
 */
import { z } from 'zod';
import type { FeedCache } from '../feed-cache.js';
export declare const recommendRouteSchema: z.ZodObject<{
    model: z.ZodString;
    optimize: z.ZodDefault<z.ZodEnum<{
        cost: "cost";
        latency: "latency";
        reliability: "reliability";
        balanced: "balanced";
    }>>;
    current_cost_per_million: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    min_quality: z.ZodDefault<z.ZodNumber>;
    max_latency_ms: z.ZodDefault<z.ZodNumber>;
    blocked_providers: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type RecommendRouteInput = z.infer<typeof recommendRouteSchema>;
export declare function handleRecommendRoute(input: RecommendRouteInput, feedCache: FeedCache): {
    content: {
        type: "text";
        text: string;
    }[];
};
//# sourceMappingURL=recommend-route.d.ts.map