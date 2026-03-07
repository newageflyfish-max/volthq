/**
 * volt_check_price — Compare pricing across providers for a given model/task.
 *
 * Returns a sorted list of provider offerings matching the query,
 * cheapest first, with pricing details.
 */
import { z } from 'zod';
import type { FeedCache } from '../feed-cache.js';
export declare const checkPriceSchema: any;
export type CheckPriceInput = z.infer<typeof checkPriceSchema>;
export declare function handleCheckPrice(input: CheckPriceInput, feedCache: FeedCache): {
    content: {
        type: "text";
        text: string;
    }[];
};
//# sourceMappingURL=check-price.d.ts.map