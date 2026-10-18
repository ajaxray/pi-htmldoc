import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";

register("./stubs/loader.mjs", import.meta.url);

/**
 * Pi's BUILTIN_SLASH_COMMANDS in @earendil-works/pi-coding-agent 1.2.0
 * (dist/core/slash-commands.js). Pi runs a built-in before any extension
 * command of the same name and hides the extension's from autocomplete, so
 * none of ours may use one of these. Hard-coded because the peer dependency
 * is not installed here.
 */
const PI_BUILTIN_COMMANDS = [
	"settings", "model", "tree", "thinking", "scoped-models", "export", "import", "share",
	"bug", "copy", "name", "session", "changelog", "hotkeys", "fork", "clone", "trust",
	"login", "logout", "new", "compact", "resume", "reload", "quit",
];

async function loadExtension() {
	const commands: string[] = [];
	const tools: string[] = [];
	const pi = {
		registerCommand: (name: string) => commands.push(name),
		registerTool: (tool: { name: string }) => tools.push(tool.name),
		on: () => {},
		sendMessage: () => {},
	};
	const { default: extension } = await import("../extensions/htmldoc.ts");
	extension(pi);
	return { commands, tools };
}

test("the extension registers /publish and /htmldoc-login and the htmldoc_publish tool", async () => {
	const { commands, tools } = await loadExtension();
	assert.deepEqual(commands, ["publish", "htmldoc-login"]);
	assert.deepEqual(tools, ["htmldoc_publish"]);
});

test("no command shadows one of Pi's built-ins", async () => {
	const { commands } = await loadExtension();
	for (const name of commands) {
		assert.ok(!PI_BUILTIN_COMMANDS.includes(name), `/${name} is a Pi built-in command`);
	}
});
