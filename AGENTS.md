# Conventions for this repo

Notes for anyone — human or agent — writing code here. Each entry exists
because getting it wrong already cost us something.

## Layout bugs are not caught by any test we have

jsdom has no layout engine, so `vitest` can tell you a component rendered
and never that it is wider than the window.

A headless-browser harness was built for this and then deleted. It measured
the real components, in the real chrome, at four widths — and passed every
check while the Data panel was visibly broken on screen. Twice it passed by
rendering nothing at all. A check that reports green on a broken page is
worse than no check, because it is consulted instead of looking.

If you rebuild it, the two things that made it useless were: a copy of a
container's markup is not the container (it reproduces what you remember
writing), and a page that fails to mount passes everything. Guard both, and
verify it by putting a known bug back and watching it fail.

Until then: **look at the UI at a narrow window.**

## min-w-0 lets a box shrink; it does not stop it growing

A flex item defaults to `min-width: auto` and will not shrink below its
content, so `truncate` on a flex child without `min-w-0` does nothing. That
is the fix for text that should elide.

It is *not* the fix for an element that sizes itself larger than its
parent. Those are different problems and `min-w-0` only addresses the first.

- Text that should elide: `min-w-0 truncate`.
- Must keep its size: `shrink-0` plus `max-w-[…] truncate`, or it overflows
  a narrow pane instead.
- `<input>` has an intrinsic minimum width from its default `size`
  attribute. `min-w-0` will not shrink it; `size={1}` or its own row will.
- `<pre>` has a min-content width equal to its longest line. Wrap it
  (`whitespace-pre-wrap break-words`).

## Content that sizes itself needs a container that does not

An `<iframe>` takes its width from its container: nothing inside it can
push outward. A `<table>` is the opposite — auto layout treats
`width: 100%` as a preference and takes more when its columns want more.

That is why the App view of the app panel never broke and the Schema and
Data views did. The clamps (`max-w-full`, `overflow-hidden`) fight it after
the fact; what actually removes the mechanism is taking the element out of
content-driven sizing:

```jsx
<div className="relative min-h-0 w-full min-w-0 flex-1">
  <div className="absolute inset-0 flex flex-col overflow-hidden">
```

An absolutely positioned element is sized by its containing block, so width
flows strictly downward and a wide table can only scroll inside its own box.

## Artifact frames: the sandbox pairings are inverse, and load-bearing

Slides keep `allow-same-origin` and therefore forbid scripts, because the
canvas edits the document. Apps and websites take `allow-scripts` **without**
`allow-same-origin`: the page is written by a model, so it runs in an opaque
origin where it cannot read this app's storage, cookies or DOM.

Taking both permissions at once is the one combination that must never
happen. A page with both can call the platform API as the signed-in user.

A consequence: an app in an opaque origin holds no credential and cannot
fetch its own data. The generated client posts each call to the host, which
makes the authenticated request — see `useAppApiBridge`. The host checks the
message came from its own frame and that the path is a path.

## Every window message listener sees the app's traffic

`window.parent.postMessage` reaches every listener in the host, so a
generated app making API calls delivers one message per call to all of
them. Check the message *shape* before anything else; `LoginDialog` used to
warn about an unexpected origin on every row a table loaded.

## An artifact panel needs two ways to find its subject

`appId` and `appSlug` arrive on the stream; a reloaded conversation has no
stream, and a brand-new one has no mission id on the client, because the
mission is created server-side mid-request. Both lookups exist in
`useMessageStreaming`, and removing either leaves a panel that is empty in
one of those two cases.
