import { getLiveOrCachedTables } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { isLive, tables } = await getLiveOrCachedTables();
	return {
		isLive,
		tables
	};
};
