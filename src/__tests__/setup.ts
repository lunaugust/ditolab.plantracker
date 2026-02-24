// Setup file for Vitest + jsdom environment
// jest-dom matchers are not compatible with Vitest 4.x scoped expect.
// Using native Vitest matchers (toBeTruthy, toBeDefined, etc.) instead.

if (!window.matchMedia) {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: (query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => undefined,
			removeListener: () => undefined,
			addEventListener: () => undefined,
			removeEventListener: () => undefined,
			dispatchEvent: () => false,
		}),
	});
}

