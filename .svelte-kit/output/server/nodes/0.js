

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.BLcA__RL.js","_app/immutable/chunks/CceMLUxr.js","_app/immutable/chunks/WI0Emwxq.js","_app/immutable/chunks/B_4bYdCG.js"];
export const stylesheets = ["_app/immutable/assets/0.C0mjo9ja.css"];
export const fonts = [];
