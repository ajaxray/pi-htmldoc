# pi-htmldoc

A [Pi](https://github.com/earendil-works/pi) package that publishes a local
HTML or Markdown file to an unlisted [htmldoc.space](https://htmldoc.space)
share link. Say "share this plan" and Pi answers with the link.

Links live 30 days unless you pin them on your dashboard, and can be updated
in place: re-sharing a file keeps its link.

## Install

```sh
pi install npm:pi-htmldoc
```

Try it for one session without installing:

```sh
pi -e npm:pi-htmldoc
```

## What you get

- **`htmldoc_publish` tool.** The model calls it with a file path (and the id
  of an earlier page to update it). The result carries the link, id, and
  expiry, and Pi shows the link as clickable.
- **Sign-in inside Pi.** The first share opens htmldoc.space's GitHub
  approval page in your browser and shows the link and code in Pi. The tool
  waits up to 10 minutes for your click, then publishes. The model never runs
  login commands and never sees your API key.
- **`/share <file>`.** Publish without a model turn. `/share` alone re-shares
  the last file to the same link; `/share <file> --new` makes a new link.
- **`/htmldoc-login`.** Sign in ahead of time, or switch accounts.
- **Status line.** The footer shows the last link you shared.
- **The `pi-htmldoc` skill**, tuned for the tool, so the model knows when to share
  and when to update.

Shares are kept in the session, so "share it again" still updates the right
link after you resume or branch a session.

## How it works

The package depends on [`htmldoc-cli`](https://www.npmjs.com/package/htmldoc-cli)
and runs its pinned copy; nothing is fetched at run time. Your API key lives
in the CLI's config (`~/.config/htmldoc/`), the same one `htmldoc` uses in
your terminal, so signing in once covers both.

In Pi's print and JSON modes there is no UI to show the approval link, so a
missing key fails with a hint. Sign in once from a terminal:

```sh
npx htmldoc-cli login
```

## Already using the htmldoc skill?

The bundled skill is named `pi-htmldoc`, so it loads alongside the generic
`htmldoc` skill from `npx skills add ajaxray/htmldoc-skill` without a name
clash. It tells the model to use the tool instead of running the CLI in a
shell. You can keep both, or remove the generic one so only one htmldoc skill
sits in Pi's prompt.

## Development

```sh
npm install --omit=peer
npm test
pi -e .
```

## License

MIT
