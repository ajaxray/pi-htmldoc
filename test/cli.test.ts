import assert from "node:assert/strict";
import { chmod, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
	dashboardFor,
	expiryLabel,
	failure,
	isMissingKey,
	parsePairing,
	parsePreviousShare,
	parseShare,
	parseSignedIn,
	resolveCliBin,
	runCli,
} from "../lib/cli.ts";

test("parseShare reads the --json line", () => {
	const share = parseShare('{"id":"ab12cd34ef56","url":"https://p.htmldoc.space/ab12cd34ef56","expires_at":"2026-11-04T10:00:00Z"}\n');
	assert.deepEqual(share, {
		id: "ab12cd34ef56",
		url: "https://p.htmldoc.space/ab12cd34ef56",
		expires_at: "2026-11-04T10:00:00Z",
	});
});

test("parseShare keeps a pinned page's null expiry", () => {
	const share = parseShare('{"id":"x","url":"https://p.htmldoc.space/x","expires_at":null}');
	assert.equal(share?.expires_at, null);
	assert.equal(expiryLabel(share!), "never (pinned)");
});

test("parseShare rejects a plain URL or broken JSON", () => {
	assert.equal(parseShare("https://p.htmldoc.space/x\n"), undefined);
	assert.equal(parseShare('{"id":"x"}'), undefined);
	assert.equal(parseShare(""), undefined);
});

test("dashboardFor maps the viewer host to the app's dashboard", () => {
	assert.equal(dashboardFor("https://p.htmldoc.space/ab12cd34ef56"), "https://htmldoc.space/dashboard");
	assert.equal(dashboardFor("http://p.localhost:8000/x"), "http://localhost:8000/dashboard");
});

test("expiryLabel shows the date", () => {
	assert.equal(expiryLabel({ id: "x", url: "u", expires_at: "2026-11-04T10:00:00.000000Z" }), "2026-11-04");
});

test("isMissingKey matches the CLI's first stderr line on a failed run", () => {
	const stderr = "no API key configured.\nsign in with: npx htmldoc-cli login\n";
	assert.equal(isMissingKey({ code: 1, stdout: "", stderr }), true);
	assert.equal(isMissingKey({ code: 0, stdout: "", stderr }), false);
	assert.equal(isMissingKey({ code: 1, stdout: "", stderr: "file too large\n" }), false);
	assert.equal(isMissingKey({ code: 1, stdout: "", stderr: `using API at http://localhost:8000\n${stderr}` }), true);
});

test("failure drops note and warning lines and keeps the reason with its hints", () => {
	const stderr = [
		"note: /tmp/a.md was shared before as https://p.htmldoc.space/x; to update that page instead run: npx htmldoc-cli a.md --update x",
		"page not found",
		"check the id",
	].join("\n");
	assert.equal(failure({ code: 1, stdout: "", stderr }), "page not found\ncheck the id");
	assert.match(failure({ code: 1, stdout: "", stderr: "" }), /exited with code 1/);
});

test("parsePreviousShare reads the CLI's note", () => {
	const stderr =
		"note: /tmp/a.md was shared before as https://p.htmldoc.space/x1; to update that page instead run: npx htmldoc-cli a.md --update x1\nid: y  expires: 2026-11-04T00:00:00Z\n";
	assert.deepEqual(parsePreviousShare(stderr), { url: "https://p.htmldoc.space/x1", id: "x1" });
	assert.equal(parsePreviousShare("id: y  expires: never (pinned)\n"), undefined);
});

test("parsePairing and parseSignedIn read the login lines", () => {
	const start = [
		"htmldoc.space needs an account signed in with GitHub, so we're sending you there.",
		"Open this link to approve: https://htmldoc.space/connect/AbC123xYz789",
		"Code: AbC123xYz789",
		"After approving, run: npx htmldoc-cli login --wait",
	].join("\n");
	assert.deepEqual(parsePairing(start), { link: "https://htmldoc.space/connect/AbC123xYz789", code: "AbC123xYz789" });
	assert.equal(parsePairing("server unreachable"), undefined);

	const done = "Waiting for approval of code AbC123xYz789 (up to 600s)…\nLogged in as @octo\nDashboard: https://htmldoc.space/dashboard\n";
	assert.deepEqual(parseSignedIn(done), { login: "octo", dashboard: "https://htmldoc.space/dashboard" });
});

test("resolveCliBin finds the bundled htmldoc script and it runs", async () => {
	const bin = resolveCliBin();
	assert.match(bin, /htmldoc-cli[\\/]bin[\\/]htmldoc\.js$/);
	const result = await runCli(bin, ["--version"], { cwd: tmpdir() });
	assert.equal(result.code, 0);
	assert.match(result.stdout + result.stderr, /\d+\.\d+\.\d+/);
});

test("runCli returns stdout, stderr, and the exit code", async () => {
	const dir = await mkdtemp(join(tmpdir(), "pi-htmldoc-"));
	const script = join(dir, "fake.js");
	await writeFile(script, 'process.stdout.write("out\\n"); process.stderr.write(process.argv.slice(2).join(" ")); process.exitCode = 1;');
	await chmod(script, 0o755);
	const result = await runCli(script, ["a", "b"], { cwd: dir });
	assert.deepEqual(result, { code: 1, stdout: "out\n", stderr: "a b" });
});

test("runCli rejects when aborted", async () => {
	const dir = await mkdtemp(join(tmpdir(), "pi-htmldoc-"));
	const script = join(dir, "slow.js");
	await writeFile(script, "setTimeout(() => {}, 10000);");
	const controller = new AbortController();
	const running = runCli(script, [], { cwd: dir, signal: controller.signal });
	controller.abort();
	await assert.rejects(running, { name: "AbortError" });
});
