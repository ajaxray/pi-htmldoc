// Resolves Pi's host packages to small stubs, so a test can load the real
// extension without the peer dependencies installed.
const STUBS = {
	"@earendil-works/pi-tui": new URL("./pi-tui.mjs", import.meta.url).href,
	typebox: new URL("./typebox.mjs", import.meta.url).href,
};

export async function resolve(specifier, context, next) {
	if (specifier in STUBS) return { url: STUBS[specifier], shortCircuit: true };
	return next(specifier, context);
}
