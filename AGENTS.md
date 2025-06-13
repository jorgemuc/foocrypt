# AGENT Instructions

- Run `npm test` before each commit.
- Keep the repository root tidy; remove stray files.
- Document progress in `PROGRESS.md` after each session (Updates for Completion/Metrics, Task Checklist, Files, Session Log).
- Document new tasks / bugs in `PROGRESS.md`.
- Do not install `xvfb` or `wine`; Windows builds run in GitHub Actions.

## Electron Development Policy
- **No Node.js modules in the renderer.** Use browser APIs only. File or OS access must be handled in the main process via IPC.
- **File operations only in the main process.** Parsing CSV/XLSX from `<input type="file">` is allowed in the renderer using libraries such as PapaParse or SheetJS.
- **Default security settings.** `nodeIntegration` should remain `false` and `contextIsolation` should be `true` unless explicitly required.
- **IPC for system tasks.** Provide whitelisted IPC functions if the renderer needs to trigger file saves or exports.
- **Keep the renderer code free of `require` for `fs`, `path`, or other Node modules.**

