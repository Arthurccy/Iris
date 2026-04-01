

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.BQ1H9Clu.js","_app/immutable/chunks/CceMLUxr.js","_app/immutable/chunks/WI0Emwxq.js","_app/immutable/chunks/B_4bYdCG.js"];
export const stylesheets = ["_app/immutable/assets/0.DyjhMlyw.css"];
export const fonts = [];
