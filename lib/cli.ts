/**
 * Runs the bundled htmldoc-cli and reads its output contract: stdout carries
 * only the share URL or the --json payload, stderr carries everything a
 * person reads, and the exit code is 0 or 1. Nothing here imports Pi, so the
 * tests run on plain Node.
 */

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

export const NO_KEY = "no API key configured.";

/** Ten minutes, the same ceiling the approval page allows. */
export const SIGN_IN_TIMEOUT_SECONDS = 600;

export interface RunResult {
	code: number;
	stdout: string;
	stderr: string;
}

export interface Share {
	id: string;
	url: string;
	/** Null while the page is pinned on the dashboard. */
	expires_at: string | null;
}

export interface Pairing {
	link: string;
	code: string;
}

export interface SignedIn {
	login?: string;
	dashboard?: string;
}

/** The path of the `htmldoc` script inside the pinned htmldoc-cli dependency. */
export function resolveCliBin(): string {
	const require = createRequire(import.meta.url);
	const manifest = require.resolve("htmldoc-cli/package.json");
	const pkg = JSON.parse(readFileSync(manifest, "utf8")) as { bin: string | Record<string, string> };
	const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin.htmldoc;
	return join(dirname(manifest), bin);
}

/**
 * Run `htmldoc <args>` with the current Node. Inside a Bun-compiled Pi the
 * running binary is Pi itself, so fall back to `node` on the PATH there.
 * Rejects only when the process cannot start or is aborted.
 */
export function runCli(bin: string, args: string[], options: { cwd: string; signal?: AbortSignal }): Promise<RunResult> {
	const runtime = process.versions.bun ? "node" : process.execPath;
	return new Promise((resolve, reject) => {
		const child = spawn(runtime, [bin, ...args], {
			cwd: options.cwd,
			signal: options.signal,
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";
		child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
			stdout += chunk;
		});
		child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
			stderr += chunk;
		});
		child.on("error", reject);
		child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
	});
}

function lines(text: string): string[] {
	return text
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line !== "");
}

/** The --json line of a successful share, or undefined when stdout is not one. */
export function parseShare(stdout: string): Share | undefined {
	const last = lines(stdout).at(-1);
	if (last === undefined) return undefined;
	let data: unknown;
	try {
		data = JSON.parse(last);
	} catch {
		return undefined;
	}
	if (!data || typeof data !== "object") return undefined;
	const { id, url, expires_at } = data as Record<string, unknown>;
	if (typeof id !== "string" || typeof url !== "string") return undefined;
	return { id, url, expires_at: typeof expires_at === "string" ? expires_at : null };
}

/**
 * The stderr lines a person needs: drops the `using API at` notice an
 * overridden origin prints and the `note:` and `warning:` lines a share
 * prints before it fails, so the reason comes first.
 */
function reasonLines(stderr: string): string[] {
	return lines(stderr).filter((line) => !/^(note|warning):|^using API at /.test(line));
}

/** What a failed run says: the reason line and its hints. */
export function failure(result: RunResult): string {
	return reasonLines(result.stderr).join("\n") || `htmldoc exited with code ${result.code} and printed no reason`;
}

export function isMissingKey(result: RunResult): boolean {
	return result.code !== 0 && reasonLines(result.stderr)[0] === NO_KEY;
}

/** The earlier share the CLI remembers for this file, from its `note:` line. */
export function parsePreviousShare(stderr: string): { url: string; id: string } | undefined {
	const match = /^note: .* was shared before as (\S+); .* --update (\S+)$/m.exec(stderr);
	return match ? { url: match[1], id: match[2] } : undefined;
}

/** The approval link and code `htmldoc login --no-wait` prints. */
export function parsePairing(stderr: string): Pairing | undefined {
	const link = /^Open this link to approve: (\S+)$/m.exec(stderr)?.[1];
	const code = /^Code: (\S+)$/m.exec(stderr)?.[1];
	return link && code ? { link, code } : undefined;
}

/** The account and dashboard lines `htmldoc login --wait` prints on success. */
export function parseSignedIn(stderr: string): SignedIn {
	return {
		login: /^Logged in as @(\S+)$/m.exec(stderr)?.[1],
		dashboard: /^Dashboard: (\S+)$/m.exec(stderr)?.[1],
	};
}

/** `2026-11-04` for a dated page, `never (pinned)` for a pinned one. */
export function expiryLabel(share: Share): string {
	return share.expires_at === null ? "never (pinned)" : share.expires_at.slice(0, 10);
}

/**
 * The dashboard on the app host that serves a share link: the viewer runs on
 * the `p.` subdomain, so https://p.htmldoc.space/x maps to
 * https://htmldoc.space/dashboard.
 */
export function dashboardFor(shareUrl: string): string {
	const url = new URL(shareUrl);
	url.hostname = url.hostname.replace(/^p\./, "");
	return `${url.origin}/dashboard`;
}
