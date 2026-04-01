import { a0 as sanitize_props, a1 as rest_props, a2 as fallback, a3 as attributes, a4 as clsx, a5 as ensure_array_like, a6 as element, a7 as slot, a8 as bind_props, a9 as spread_props, aa as attr, ab as attr_class, e as escape_html, ac as head, $ as derived } from "../../chunks/index.js";
/**
 * @license lucide-svelte v0.454.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};
function Icon($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const $$restProps = rest_props($$sanitized_props, [
    "name",
    "color",
    "size",
    "strokeWidth",
    "absoluteStrokeWidth",
    "iconNode"
  ]);
  $$renderer.component(($$renderer2) => {
    let name = fallback($$props["name"], void 0);
    let color = fallback($$props["color"], "currentColor");
    let size = fallback($$props["size"], 24);
    let strokeWidth = fallback($$props["strokeWidth"], 2);
    let absoluteStrokeWidth = fallback($$props["absoluteStrokeWidth"], false);
    let iconNode = fallback($$props["iconNode"], () => [], true);
    const mergeClasses = (...classes) => classes.filter((className, index, array) => {
      return Boolean(className) && array.indexOf(className) === index;
    }).join(" ");
    $$renderer2.push(`<svg${attributes(
      {
        ...defaultAttributes,
        ...$$restProps,
        width: size,
        height: size,
        stroke: color,
        "stroke-width": absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
        class: clsx(mergeClasses("lucide-icon", "lucide", name ? `lucide-${name}` : "", $$sanitized_props.class))
      },
      void 0,
      void 0,
      void 0,
      3
    )}><!--[-->`);
    const each_array = ensure_array_like(iconNode);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let [tag, attrs] = each_array[$$index];
      element($$renderer2, tag, () => {
        $$renderer2.push(`${attributes({ ...attrs }, void 0, void 0, void 0, 3)}`);
      });
    }
    $$renderer2.push(`<!--]--><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></svg>`);
    bind_props($$props, {
      name,
      color,
      size,
      strokeWidth,
      absoluteStrokeWidth,
      iconNode
    });
  });
}
function Database($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.454.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["ellipse", { "cx": "12", "cy": "5", "rx": "9", "ry": "3" }],
    ["path", { "d": "M3 5V19A9 3 0 0 0 21 19V5" }],
    ["path", { "d": "M3 12A9 3 0 0 0 21 12" }]
  ];
  Icon($$renderer, spread_props([
    { name: "database" },
    $$sanitized_props,
    {
      /**
       * @component @name Database
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8ZWxsaXBzZSBjeD0iMTIiIGN5PSI1IiByeD0iOSIgcnk9IjMiIC8+CiAgPHBhdGggZD0iTTMgNVYxOUE5IDMgMCAwIDAgMjEgMTlWNSIgLz4KICA8cGF0aCBkPSJNMyAxMkE5IDMgMCAwIDAgMjEgMTIiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/database
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Factory($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.454.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "path",
      {
        "d": "M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
      }
    ],
    ["path", { "d": "M17 18h1" }],
    ["path", { "d": "M12 18h1" }],
    ["path", { "d": "M7 18h1" }]
  ];
  Icon($$renderer, spread_props([
    { name: "factory" },
    $$sanitized_props,
    {
      /**
       * @component @name Factory
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMiAyMGEyIDIgMCAwIDAgMiAyaDE2YTIgMiAwIDAgMCAyLTJWOGwtNyA1VjhsLTcgNVY0YTIgMiAwIDAgMC0yLTJINGEyIDIgMCAwIDAtMiAyWiIgLz4KICA8cGF0aCBkPSJNMTcgMThoMSIgLz4KICA8cGF0aCBkPSJNMTIgMThoMSIgLz4KICA8cGF0aCBkPSJNNyAxOGgxIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/factory
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function File_code_2($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.454.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "path",
      { "d": "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" }
    ],
    ["path", { "d": "M14 2v4a2 2 0 0 0 2 2h4" }],
    ["path", { "d": "m5 12-3 3 3 3" }],
    ["path", { "d": "m9 18 3-3-3-3" }]
  ];
  Icon($$renderer, spread_props([
    { name: "file-code-2" },
    $$sanitized_props,
    {
      /**
       * @component @name FileCode2
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNCAyMmgxNGEyIDIgMCAwIDAgMi0yVjdsLTUtNUg2YTIgMiAwIDAgMC0yIDJ2NCIgLz4KICA8cGF0aCBkPSJNMTQgMnY0YTIgMiAwIDAgMCAyIDJoNCIgLz4KICA8cGF0aCBkPSJtNSAxMi0zIDMgMyAzIiAvPgogIDxwYXRoIGQ9Im05IDE4IDMtMy0zLTMiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/file-code-2
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Flask_conical($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.454.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "path",
      {
        "d": "M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"
      }
    ],
    ["path", { "d": "M8.5 2h7" }],
    ["path", { "d": "M7 16h10" }]
  ];
  Icon($$renderer, spread_props([
    { name: "flask-conical" },
    $$sanitized_props,
    {
      /**
       * @component @name FlaskConical
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgMnY3LjUyN2EyIDIgMCAwIDEtLjIxMS44OTZMNC43MiAyMC41NWExIDEgMCAwIDAgLjkgMS40NWgxMi43NmExIDEgMCAwIDAgLjktMS40NWwtNS4wNjktMTAuMTI3QTIgMiAwIDAgMSAxNCA5LjUyN1YyIiAvPgogIDxwYXRoIGQ9Ik04LjUgMmg3IiAvPgogIDxwYXRoIGQ9Ik03IDE2aDEwIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/flask-conical
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Layout_grid($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.454.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "rect",
      { "width": "7", "height": "7", "x": "3", "y": "3", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "7", "x": "14", "y": "3", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "7", "x": "14", "y": "14", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "7", "x": "3", "y": "14", "rx": "1" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "layout-grid" },
    $$sanitized_props,
    {
      /**
       * @component @name LayoutGrid
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI3IiB4PSIzIiB5PSIzIiByeD0iMSIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI3IiB4PSIxNCIgeT0iMyIgcng9IjEiIC8+CiAgPHJlY3Qgd2lkdGg9IjciIGhlaWdodD0iNyIgeD0iMTQiIHk9IjE0IiByeD0iMSIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI3IiB4PSIzIiB5PSIxNCIgcng9IjEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/layout-grid
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Mail($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.454.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "rect",
      { "width": "20", "height": "16", "x": "2", "y": "4", "rx": "2" }
    ],
    ["path", { "d": "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }]
  ];
  Icon($$renderer, spread_props([
    { name: "mail" },
    $$sanitized_props,
    {
      /**
       * @component @name Mail
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMTYiIHg9IjIiIHk9IjQiIHJ4PSIyIiAvPgogIDxwYXRoIGQ9Im0yMiA3LTguOTcgNS43YTEuOTQgMS45NCAwIDAgMS0yLjA2IDBMMiA3IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/mail
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Package($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.454.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "path",
      {
        "d": "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
      }
    ],
    ["path", { "d": "M12 22V12" }],
    [
      "path",
      { "d": "m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" }
    ],
    ["path", { "d": "m7.5 4.27 9 5.15" }]
  ];
  Icon($$renderer, spread_props([
    { name: "package" },
    $$sanitized_props,
    {
      /**
       * @component @name Package
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTEgMjEuNzNhMiAyIDAgMCAwIDIgMGw3LTRBMiAyIDAgMCAwIDIxIDE2VjhhMiAyIDAgMCAwLTEtMS43M2wtNy00YTIgMiAwIDAgMC0yIDBsLTcgNEEyIDIgMCAwIDAgMyA4djhhMiAyIDAgMCAwIDEgMS43M3oiIC8+CiAgPHBhdGggZD0iTTEyIDIyVjEyIiAvPgogIDxwYXRoIGQ9Im0zLjMgNyA3LjcwMyA0LjczNGEyIDIgMCAwIDAgMS45OTQgMEwyMC43IDciIC8+CiAgPHBhdGggZD0ibTcuNSA0LjI3IDkgNS4xNSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/package
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Search($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.454.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["circle", { "cx": "11", "cy": "11", "r": "8" }],
    ["path", { "d": "m21 21-4.3-4.3" }]
  ];
  Icon($$renderer, spread_props([
    { name: "search" },
    $$sanitized_props,
    {
      /**
       * @component @name Search
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMSIgY3k9IjExIiByPSI4IiAvPgogIDxwYXRoIGQ9Im0yMSAyMS00LjMtNC4zIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/search
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Shield_check($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.454.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "path",
      {
        "d": "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      }
    ],
    ["path", { "d": "m9 12 2 2 4-4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "shield-check" },
    $$sanitized_props,
    {
      /**
       * @component @name ShieldCheck
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAgMTNjMCA1LTMuNSA3LjUtNy42NiA4Ljk1YTEgMSAwIDAgMS0uNjctLjAxQzcuNSAyMC41IDQgMTggNCAxM1Y2YTEgMSAwIDAgMSAxLTFjMiAwIDQuNS0xLjIgNi4yNC0yLjcyYTEuMTcgMS4xNyAwIDAgMSAxLjUyIDBDMTQuNTEgMy44MSAxNyA1IDE5IDVhMSAxIDAgMCAxIDEgMXoiIC8+CiAgPHBhdGggZD0ibTkgMTIgMiAyIDQtNCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/shield-check
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Sparkles($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.454.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "path",
      {
        "d": "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
      }
    ],
    ["path", { "d": "M20 3v4" }],
    ["path", { "d": "M22 5h-4" }],
    ["path", { "d": "M4 17v2" }],
    ["path", { "d": "M5 18H3" }]
  ];
  Icon($$renderer, spread_props([
    { name: "sparkles" },
    $$sanitized_props,
    {
      /**
       * @component @name Sparkles
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNOS45MzcgMTUuNUEyIDIgMCAwIDAgOC41IDE0LjA2M2wtNi4xMzUtMS41ODJhLjUuNSAwIDAgMSAwLS45NjJMOC41IDkuOTM2QTIgMiAwIDAgMCA5LjkzNyA4LjVsMS41ODItNi4xMzVhLjUuNSAwIDAgMSAuOTYzIDBMMTQuMDYzIDguNUEyIDIgMCAwIDAgMTUuNSA5LjkzN2w2LjEzNSAxLjU4MWEuNS41IDAgMCAxIDAgLjk2NEwxNS41IDE0LjA2M2EyIDIgMCAwIDAtMS40MzcgMS40MzdsLTEuNTgyIDYuMTM1YS41LjUgMCAwIDEtLjk2MyAweiIgLz4KICA8cGF0aCBkPSJNMjAgM3Y0IiAvPgogIDxwYXRoIGQ9Ik0yMiA1aC00IiAvPgogIDxwYXRoIGQ9Ik00IDE3djIiIC8+CiAgPHBhdGggZD0iTTUgMThIMyIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/sparkles
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
const categoryMeta = {
  Production: {
    title: "Production",
    description: "OF, quantités, articles et cadence atelier.",
    icon: Factory,
    accent: "from-corporate-600/15 via-corporate-100/40 to-white"
  },
  Qualité: {
    title: "Qualité",
    description: "Lots, statuts, inspections et audit qualité.",
    icon: Flask_conical,
    accent: "from-emerald-500/15 via-emerald-100/40 to-white"
  },
  Stocks: {
    title: "Stocks",
    description: "Disponibilité, emplacement, site et traçabilité.",
    icon: Package,
    accent: "from-amber-500/15 via-amber-100/40 to-white"
  }
};
function FieldSelectorPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      categories,
      fieldsByCategory,
      searchTerm
    } = $$props;
    let openCategory = null;
    $$renderer2.push(`<section class="glass-card overflow-hidden"><div class="section-divider flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between"><div class="space-y-2"><p class="text-sm font-semibold uppercase tracking-[0.24em] text-corporate-600">Catalogue métier</p> <h2 class="text-2xl font-semibold text-slate-900">Sélection des champs Sage X3</h2> <p class="max-w-2xl text-sm leading-6 text-slate-600">Cliquez sur une famille, cochez les champs utiles, puis laissez le moteur retrouver les requêtes
				existantes qui couvrent au minimum votre besoin.</p></div> <div class="flex flex-col gap-3 sm:flex-row"><label class="relative block min-w-[18rem]">`);
    Search($$renderer2, {
      class: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
    });
    $$renderer2.push(`<!----> <input class="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm outline-none transition focus:border-corporate-300 focus:ring-4 focus:ring-corporate-100" type="search" placeholder="Rechercher un code, un label, une table..."${attr("value", searchTerm)}/></label> <button class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-corporate-200 hover:text-corporate-700" type="button">Vider la sélection</button></div></div> <div class="grid gap-4 p-6 xl:grid-cols-[1.05fr,1.55fr]"><div class="grid gap-4 sm:grid-cols-3 xl:grid-cols-1"><!--[-->`);
    const each_array = ensure_array_like(categories);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let category = each_array[$$index];
      const meta = categoryMeta[category];
      $$renderer2.push(`<button type="button"${attr_class(`rounded-3xl border p-5 text-left transition ${openCategory === category ? "border-corporate-300 bg-gradient-to-br shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"} ${meta.accent}`)}>`);
      if (meta.icon) {
        $$renderer2.push("<!--[-->");
        meta.icon($$renderer2, { class: "mb-4 size-5 text-corporate-700" });
        $$renderer2.push("<!--]-->");
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push("<!--]-->");
      }
      $$renderer2.push(` <div class="flex items-start justify-between gap-3"><div><h3 class="text-lg font-semibold text-slate-900">${escape_html(meta.title)}</h3> <p class="mt-2 text-sm leading-6 text-slate-600">${escape_html(meta.description)}</p></div> <span class="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600">${escape_html(fieldsByCategory[category]?.length ?? 0)}</span></div></button>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="rounded-3xl border border-slate-200 bg-white/70 p-4">`);
    {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="flex h-full min-h-64 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center"><div class="space-y-2"><p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Navigation</p> <p class="text-lg font-semibold text-slate-900">Choisissez une famille à explorer</p> <p class="max-w-md text-sm leading-6 text-slate-600">Les champs sont regroupés par usage métier pour accélérer la consultation en atelier, qualité
							ou logistique.</p></div></div>`);
    }
    $$renderer2.push(`<!--]--></div></div></section>`);
  });
}
function QueryResults($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { selectedFields, matches, fallbackMailTo, fallbackHref } = $$props;
    $$renderer2.push(`<section class="glass-card overflow-hidden"><div class="section-divider flex flex-col gap-3 p-6 lg:flex-row lg:items-center lg:justify-between"><div class="space-y-2"><p class="text-sm font-semibold uppercase tracking-[0.24em] text-corporate-600">Résultats</p> <h2 class="text-2xl font-semibold text-slate-900">Matching de requêtes existantes</h2> <p class="max-w-2xl text-sm leading-6 text-slate-600">L’algorithme remonte les requêtes dont la couverture contient au moins tous les champs cochés. Une
				requête plus riche reste donc éligible.</p></div> <div class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><div class="flex items-center gap-2 font-medium">`);
    Shield_check($$renderer2, { class: "size-4" });
    $$renderer2.push(`<!----> Consultation read-only</div> <p class="mt-1 text-emerald-800/80">Aucune édition de données. Accès rapide à la doc et au SQL.</p></div></div> <div class="p-6"><div class="mb-6 flex flex-wrap gap-2">`);
    if (selectedFields.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500">Aucun champ sélectionné</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(selectedFields);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let field = each_array[$$index];
        $$renderer2.push(`<span class="rounded-full border border-corporate-200 bg-corporate-50 px-3 py-1.5 text-sm text-corporate-800">${escape_html(field.label)} <span class="ml-1 text-corporate-500">(${escape_html(field.code)})</span></span>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (selectedFields.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center"><p class="text-lg font-semibold text-slate-900">Sélectionnez des champs pour lancer le matching</p> <p class="mt-2 text-sm leading-6 text-slate-600">L’app traduira les codes techniques en labels métiers puis comparera votre besoin avec le catalogue
					de requêtes SQL disponibles.</p></div>`);
    } else if (matches.length > 0) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="grid gap-4"><!--[-->`);
      const each_array_1 = ensure_array_like(matches);
      for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
        let query = each_array_1[$$index_2];
        $$renderer2.push(`<article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div class="space-y-3"><div class="flex flex-wrap items-center gap-2"><span class="rounded-full bg-corporate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-corporate-700">${escape_html(query.domain)}</span> <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">${escape_html(query.owner)}</span> <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">${escape_html(query.fields.length)} champs</span></div> <div><h3 class="text-xl font-semibold text-slate-900">${escape_html(query.title)}</h3> <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">${escape_html(query.description)}</p></div></div> <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right"><p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Couverture</p> <p class="text-lg font-semibold text-slate-900">${escape_html(selectedFields.length)}/${escape_html(selectedFields.length)} demandés</p> <p class="text-sm text-slate-500">${escape_html(query.extraFields.length)} champ(s) additionnel(s)</p></div></div> <div class="mt-5 grid gap-4 xl:grid-cols-[1.1fr,1.2fr]"><div class="rounded-2xl bg-pearl p-4"><p class="mb-3 text-sm font-semibold text-slate-900">Champs inclus</p> <div class="flex flex-wrap gap-2"><!--[-->`);
        const each_array_2 = ensure_array_like(query.fields);
        for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
          let fieldCode = each_array_2[$$index_1];
          $$renderer2.push(`<span${attr_class(`rounded-full px-3 py-1 text-xs font-medium ${selectedFields.some((field) => field.code === fieldCode) ? "bg-corporate-600 text-white" : "bg-white text-slate-600"}`)}>${escape_html(fieldCode)}</span>`);
        }
        $$renderer2.push(`<!--]--></div></div> <div class="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-slate-100"><div class="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">`);
        File_code_2($$renderer2, { class: "size-4" });
        $$renderer2.push(`<!----> SQL disponible</div> <pre class="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-300">${escape_html(query.sql)}</pre></div></div> <div class="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500"><span>Dernière mise à jour : ${escape_html(query.lastUpdated)}</span> <span class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">${escape_html(query.system)}</span></div></article>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="rounded-3xl border border-dashed border-amber-200 bg-amber-50 p-8"><div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div class="max-w-2xl space-y-2"><p class="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">Bouton 3636</p> <h3 class="text-xl font-semibold text-slate-900">Aucune requête existante ne couvre ce besoin</h3> <p class="text-sm leading-6 text-slate-700">Le fallback prépare un e-mail vers ${escape_html(fallbackMailTo)} avec la liste exacte des champs demandés
							pour accélérer la création d’une nouvelle extraction.</p></div> <a class="inline-flex items-center justify-center gap-2 rounded-2xl bg-corporate-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-corporate-700"${attr("href", fallbackHref)}>`);
      Mail($$renderer2, { class: "size-4" });
      $$renderer2.push(`<!----> Demander la création de la requête</a></div></div>`);
    }
    $$renderer2.push(`<!--]--></div></section>`);
  });
}
const fieldDictionaryData = [
  {
    code: "ITMREF",
    label: "Référence article",
    category: "Production",
    table: "ITMMASTER",
    description: "Identifiant unique de l'article dans Sage X3.",
    keywords: [
      "article",
      "référence",
      "produit"
    ]
  },
  {
    code: "ITMDEZ",
    label: "Désignation article",
    category: "Production",
    table: "ITMMASTER",
    description: "Libellé métier affiché pour l'article.",
    keywords: [
      "désignation",
      "nom",
      "article"
    ]
  },
  {
    code: "MFGNUM",
    label: "Numéro d'OF",
    category: "Production",
    table: "MFGHEAD",
    description: "Numéro de l'ordre de fabrication.",
    keywords: [
      "of",
      "fabrication",
      "ordre"
    ]
  },
  {
    code: "MFGFCY",
    label: "Site de fabrication",
    category: "Production",
    table: "MFGHEAD",
    description: "Site sur lequel l'OF est exécuté.",
    keywords: [
      "site",
      "usine",
      "production"
    ]
  },
  {
    code: "EXTQTY",
    label: "Quantité prévue",
    category: "Production",
    table: "MFGHEAD",
    description: "Quantité attendue dans l'OF.",
    keywords: [
      "quantité",
      "prévu",
      "planning"
    ]
  },
  {
    code: "CPLQTY",
    label: "Quantité réalisée",
    category: "Production",
    table: "MFGHEAD",
    description: "Quantité produite ou déclarée.",
    keywords: [
      "quantité",
      "réalisée",
      "déclaration"
    ]
  },
  {
    code: "LOT",
    label: "Numéro de lot",
    category: "Qualité",
    table: "STOCK",
    description: "Lot de traçabilité matière ou produit fini.",
    keywords: [
      "lot",
      "traçabilité",
      "batch"
    ]
  },
  {
    code: "QIPCOD",
    label: "Code inspection qualité",
    category: "Qualité",
    table: "QINSPECTION",
    description: "Code du plan ou contrôle qualité associé.",
    keywords: [
      "inspection",
      "qualité",
      "contrôle"
    ]
  },
  {
    code: "QSTA",
    label: "Statut qualité",
    category: "Qualité",
    table: "QINSPECTION",
    description: "Statut qualité de l'article, lot ou contrôle.",
    keywords: [
      "statut",
      "qualité",
      "blocage"
    ]
  },
  {
    code: "CREDAT",
    label: "Date de création",
    category: "Qualité",
    table: "AUDIT",
    description: "Date de création de l'enregistrement.",
    keywords: [
      "date",
      "création",
      "historique"
    ]
  },
  {
    code: "UPDDATTIM",
    label: "Horodatage de mise à jour",
    category: "Qualité",
    table: "AUDIT",
    description: "Date et heure de dernière modification.",
    keywords: [
      "date",
      "mise à jour",
      "audit"
    ]
  },
  {
    code: "BPSNUM",
    label: "Code fournisseur",
    category: "Stocks",
    table: "BPSUPPLIER",
    description: "Identifiant du fournisseur dans Sage X3.",
    keywords: [
      "fournisseur",
      "tiers",
      "achat"
    ]
  },
  {
    code: "STOFCY",
    label: "Site de stock",
    category: "Stocks",
    table: "STOCK",
    description: "Site logistique porteur du stock.",
    keywords: [
      "stock",
      "site",
      "entrepôt"
    ]
  },
  {
    code: "LOC",
    label: "Emplacement",
    category: "Stocks",
    table: "STOCK",
    description: "Adresse ou emplacement physique dans le dépôt.",
    keywords: [
      "emplacement",
      "magasin",
      "rayon"
    ]
  },
  {
    code: "PCUQTY",
    label: "Stock physique",
    category: "Stocks",
    table: "STOCK",
    description: "Quantité présente physiquement au stock.",
    keywords: [
      "stock",
      "physique",
      "quantité"
    ]
  },
  {
    code: "AVLQTY",
    label: "Stock disponible",
    category: "Stocks",
    table: "STOCK",
    description: "Quantité disponible après allocations et contrôles.",
    keywords: [
      "stock",
      "disponible",
      "allocation"
    ]
  }
];
const queriesCatalogData = [
  {
    id: "prod-001",
    title: "Suivi synthétique des ordres de fabrication",
    domain: "Production",
    system: "Sage X3",
    description: "Vue transverse pour piloter l'avancement d'un OF, son article et ses quantités.",
    fields: [
      "MFGNUM",
      "ITMREF",
      "ITMDEZ",
      "MFGFCY",
      "EXTQTY",
      "CPLQTY",
      "LOT"
    ],
    sql: "SELECT MFGNUM, ITMREF, ITMDEZ, MFGFCY, EXTQTY, CPLQTY, LOT FROM MFGHEAD LEFT JOIN MFGITM ON MFGITM.MFGNUM = MFGHEAD.MFGNUM LEFT JOIN STOCK ON STOCK.ITMREF = MFGITM.ITMREF;",
    owner: "Production",
    lastUpdated: "2026-03-18"
  },
  {
    id: "qua-001",
    title: "Contrôles qualité par lot",
    domain: "Qualité",
    system: "Sage X3",
    description: "Extraction qualité centrée sur le lot, le statut et l'horodatage des contrôles.",
    fields: [
      "LOT",
      "ITMREF",
      "ITMDEZ",
      "QIPCOD",
      "QSTA",
      "CREDAT",
      "UPDDATTIM"
    ],
    sql: "SELECT LOT, ITMREF, ITMDEZ, QIPCOD, QSTA, CREDAT, UPDDATTIM FROM QINSPECTION LEFT JOIN ITMMASTER ON ITMMASTER.ITMREF = QINSPECTION.ITMREF;",
    owner: "Qualité",
    lastUpdated: "2026-03-21"
  },
  {
    id: "sto-001",
    title: "Disponibilité stock par site et emplacement",
    domain: "Stocks",
    system: "Sage X3",
    description: "Requête de consultation read-only pour localiser le stock disponible et physique.",
    fields: [
      "ITMREF",
      "ITMDEZ",
      "STOFCY",
      "LOC",
      "PCUQTY",
      "AVLQTY",
      "LOT"
    ],
    sql: "SELECT ITMREF, ITMDEZ, STOFCY, LOC, PCUQTY, AVLQTY, LOT FROM STOCK LEFT JOIN ITMMASTER ON ITMMASTER.ITMREF = STOCK.ITMREF;",
    owner: "Logistique",
    lastUpdated: "2026-03-24"
  },
  {
    id: "cross-001",
    title: "Vue article 360 production / qualité / stock",
    domain: "Transverse",
    system: "Sage X3",
    description: "Jeu de données élargi qui couvre la recherche article, OF, lot, qualité et disponibilité.",
    fields: [
      "ITMREF",
      "ITMDEZ",
      "MFGNUM",
      "LOT",
      "QSTA",
      "STOFCY",
      "LOC",
      "PCUQTY",
      "AVLQTY",
      "MFGFCY",
      "EXTQTY",
      "CPLQTY"
    ],
    sql: "SELECT ITMREF, ITMDEZ, MFGNUM, LOT, QSTA, STOFCY, LOC, PCUQTY, AVLQTY, MFGFCY, EXTQTY, CPLQTY FROM ZVW_X3_360;",
    owner: "BI Industrielle",
    lastUpdated: "2026-03-29"
  }
];
function normalizeText(value) {
  return value.trim().toLowerCase();
}
function filterFields(fields, searchTerm) {
  const normalized = normalizeText(searchTerm);
  if (!normalized) {
    return fields;
  }
  return fields.filter((field) => {
    const haystack = [
      field.code,
      field.label,
      field.table,
      field.description,
      ...field.keywords ?? []
    ].join(" ").toLowerCase();
    return haystack.includes(normalized);
  });
}
function matchQueries(selectedCodes, queries) {
  if (selectedCodes.length === 0) {
    return [];
  }
  const requiredFields = new Set(selectedCodes);
  return queries.filter((query) => selectedCodes.every((code) => query.fields.includes(code))).map((query) => {
    const extraFields = query.fields.filter((field) => !requiredFields.has(field));
    return {
      ...query,
      matchedCount: selectedCodes.length,
      extraFields,
      matchRate: selectedCodes.length / query.fields.length
    };
  }).sort((left, right) => {
    if (left.extraFields.length !== right.extraFields.length) {
      return left.extraFields.length - right.extraFields.length;
    }
    return left.title.localeCompare(right.title, "fr");
  });
}
function buildFallbackMail(selectedFields, mailTo = "3636@entreprise.local") {
  const subject = `Demande de création de requête Sage X3 - ${selectedFields.length} champ(s)`;
  const bodyLines = [
    "Bonjour,",
    "",
    "Aucune requête existante ne couvre exactement mon besoin de consultation Sage X3.",
    "Merci de créer ou compléter une extraction read-only avec les champs suivants :",
    "",
    ...selectedFields.map(
      (field) => `- ${field.code} | ${field.label} | ${field.category} | table ${field.table}`
    ),
    "",
    "Contexte : application de consultation interne Sage X3.",
    "Merci."
  ];
  return `mailto:${mailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    bodyLines.join("\n")
  )}`;
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const dictionary = fieldDictionaryData;
    const queries = queriesCatalogData;
    const categories = Object.keys(categoryMeta);
    const fallbackMailbox = "3636@entreprise.local";
    let selectedCodes = [];
    let searchTerm = "";
    const filteredFields = derived(() => filterFields(dictionary, searchTerm));
    const fieldsByCategory = derived(() => categories.reduce(
      (accumulator, category) => {
        accumulator[category] = filteredFields().filter((field) => field.category === category);
        return accumulator;
      },
      {}
    ));
    const selectedFields = derived(() => dictionary.filter((field) => selectedCodes.includes(field.code)).sort((left, right) => left.label.localeCompare(right.label, "fr")));
    const matches = derived(() => matchQueries(selectedCodes, queries));
    const fallbackHref = derived(() => buildFallbackMail(selectedFields(), fallbackMailbox));
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>IRIS X3 Query Finder</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Interface de consultation read-only pour retrouver des requêtes Sage X3 à partir de champs métiers."/>`);
    });
    $$renderer2.push(`<div class="relative isolate overflow-hidden"><div class="absolute inset-0 -z-10 bg-grid bg-[size:22px_22px] opacity-40"></div> <div class="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><header class="glass-card overflow-hidden"><div class="grid gap-8 p-6 lg:grid-cols-[1.35fr,0.85fr] lg:p-8"><div class="space-y-6"><div class="inline-flex items-center gap-2 rounded-full border border-corporate-100 bg-corporate-50 px-3 py-1.5 text-sm font-medium text-corporate-700">`);
    Database($$renderer2, { class: "size-4" });
    $$renderer2.push(`<!----> Sage X3 • Query Finder</div> <div class="space-y-4"><h1 class="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Transformer les codes techniques en langage métier et retrouver la bonne requête SQL.</h1> <p class="max-w-3xl text-base leading-8 text-slate-600">Interface read-only pensée pour la production, la qualité et les stocks. Les utilisateurs
							cochent leurs champs, l’app traduit les codes Sage X3 et propose automatiquement les requêtes
							disponibles les plus proches du besoin.</p></div> <div class="grid gap-3 sm:grid-cols-3"><div class="rounded-3xl border border-slate-200 bg-white/70 p-4"><p class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Dictionnaire</p> <p class="mt-3 text-3xl font-semibold text-slate-950">${escape_html(dictionary.length)}</p> <p class="mt-1 text-sm text-slate-600">champs métiers indexés</p></div> <div class="rounded-3xl border border-slate-200 bg-white/70 p-4"><p class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Catalogue SQL</p> <p class="mt-3 text-3xl font-semibold text-slate-950">${escape_html(queries.length)}</p> <p class="mt-1 text-sm text-slate-600">requêtes read-only</p></div> <div class="rounded-3xl border border-slate-200 bg-white/70 p-4"><p class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Logique</p> <p class="mt-3 text-3xl font-semibold text-slate-950">3636</p> <p class="mt-1 text-sm text-slate-600">fallback mail si aucun match</p></div></div></div> <div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-slate-100"><div class="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-corporate-200">`);
    Sparkles($$renderer2, { class: "size-4" });
    $$renderer2.push(`<!----> Principes UX</div> <div class="mt-6 space-y-4"><div class="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div class="flex items-center gap-3">`);
    Layout_grid($$renderer2, { class: "size-5 text-corporate-300" });
    $$renderer2.push(`<!----> <p class="font-semibold">Bento grid orientée métiers</p></div> <p class="mt-2 text-sm leading-6 text-slate-400">Navigation rapide par familles Production, Qualité et Stocks avec cartes lisibles et
								ouverts contextuels.</p></div> <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p class="font-semibold">Matching “Qui peut le plus peut le moins”</p> <p class="mt-2 text-sm leading-6 text-slate-400">Une requête plus large reste pertinente si elle contient déjà tous les champs demandés.</p></div> <div class="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p class="font-semibold">Design corporate moderne</p> <p class="mt-2 text-sm leading-6 text-slate-400">Blanc pur, gris perle, bleu profond, séparateurs fins et glassmorphism léger pour un rendu
								premium mais lisible en environnement industriel.</p></div></div></div></div></header> `);
    FieldSelectorPanel($$renderer2, {
      categories,
      fieldsByCategory: fieldsByCategory(),
      searchTerm
    });
    $$renderer2.push(`<!----> `);
    QueryResults($$renderer2, {
      selectedFields: selectedFields(),
      matches: matches(),
      fallbackMailTo: fallbackMailbox,
      fallbackHref: fallbackHref()
    });
    $$renderer2.push(`<!----></div></div>`);
  });
}
export {
  _page as default
};
