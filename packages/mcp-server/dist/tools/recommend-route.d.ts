/**
 * volt_recommend_route — Get optimal provider recommendation.
 *
 * Runs the scoring algorithm against cached offerings with the agent's
 * routing profile and returns an actionable recommendation with savings.
 */
import { z } from 'zod';
import type { FeedCache } from '../feed-cache.js';
export declare const recommendRouteSchema: any;
export type RecommendRouteInput = z.infer<typeof recommendRouteSchema>;
export declare function handleRecommendRoute(input: RecommendRouteInput, feedCache: FeedCache): {
    content: {
        type: "text";
        text: string;
    }[];
};
//# sourceMappingURL=recommend-route.d.ts.map