# pi-htmldoc

**Free artifact publishing for Pi.** Pi writes the report, the plan, the
mockup. Say "share it" and you get a link anyone can open. No deploy, no
hosting, no repo.

```sh
pi install npm:pi-htmldoc
```

Then, in any Pi session:

> **You:** write a status report as HTML, then share it
>
> **Pi:** Here's your link: https://p.htmldoc.space/NO8JWj8cd57m. It expires
> 2026-11-12. Say "share again" after edits and the same link updates.

That link is a real page. [Open it.](https://p.htmldoc.space/NO8JWj8cd57m)

## Why

Agents are good at HTML: dashboards, reports, diagrams, mockups, plans with
tables. Getting that file in front of someone else is the clumsy part. You
attach it to a chat where it opens as source, or push it to a repo, or set up
hosting for one page.

pi-htmldoc makes it one step. The file goes to
[htmldoc.space](https://htmldoc.space), and you get an unlisted link that
renders it in any browser.

- **HTML** is served byte for byte. Scripts run, so charts, tabs, and
  collapsible sections work.
- **Markdown** is rendered to a clean page.
- **Re-share keeps the link.** Edit the file, say "share again", and the same
  link shows the new version. Nobody needs a new URL.

## What you get

- **`htmldoc_publish` tool.** Pi calls it whenever you ask to share, publish,
  or make a file shareable. The result carries the link, id, and expiry, and
  the link is clickable in your terminal.
- **`/share <file>`.** Publish yourself, without a model turn. `/share` alone
  re-shares the last file to the same link; `--new` makes a fresh one.
- **Last link in the footer**, with its expiry:
  `last published: https://p.htmldoc.space/… expires: 2026-11-12 (Pin to survive expiry)`.
- **Sign-in without leaving Pi.** The first share shows a GitHub approval
  link and opens it in your browser. Approve once, and Pi finishes the share.
  `/htmldoc-login` does it ahead of time.
- **Memory across sessions.** Pi remembers which link belongs to which file,
  so "share it again" updates the right page after you resume or branch.
- **A bundled skill** that tells the model when to publish and when to
  update.

## Free, with limits

htmldoc.space is free and run by one person.

| | |
|---|---|
| File types | `.html`, `.htm`, `.md`, `.markdown`, one file per link |
| Size | 2 MB HTML, 512 KB Markdown |
| Lifetime | 30 days, reset on every update; pin up to 5 pages on your dashboard to keep them |
| Live pages | 100 per account |
| Account | GitHub sign-in |

Links are unlisted and kept out of search engines, but not private: anyone
with the link can open it. Pages carry a small badge with a Report link and
nothing else: no ads, no analytics.

## Your key stays out of the conversation

The tool runs the bundled [`htmldoc-cli`](https://www.npmjs.com/package/htmldoc-cli),
which keeps your API key in `~/.config/htmldoc/`. The model never reads it,
never types it, and never runs login commands. The sign-in link goes to you
through Pi's UI, not through the chat. Signing in once also covers `htmldoc`
in your terminal.

## More

- The full tour: [htmldoc.space/pi](https://htmldoc.space/pi)
- Try it for one session without installing: `pi -e npm:pi-htmldoc`
- In Pi's print and JSON modes there is no UI for the approval link. Sign in
  once from a terminal with `npx htmldoc-cli login`.
- Already installed the generic `htmldoc` skill (`npx skills add ajaxray/htmldoc-skill`)?
  The two load side by side; this package's skill tells the model to use the
  tool. Remove the generic one if you want a single htmldoc skill in Pi's
  prompt.
- Your dashboard at [htmldoc.space/dashboard](https://htmldoc.space/dashboard)
  lists every link, with pin and delete.
- Bugs and ideas: [issues](https://github.com/ajaxray/pi-htmldoc/issues).

## Development

```sh
npm install --omit=peer
npm test
pi -e .
```

## License

MIT
