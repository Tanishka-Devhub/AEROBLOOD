<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep imported AEROBLOOD feature screens and their API interactions in `src/features/aeroblood`; this preserves the upstream operational workflows.
- Use TanStack portal parent routes that render Outlet, with index and child file routes plus the shared navigation adapter; this preserves all original URLs and makes nested screens reliably accessible.
- Define all clinical presentation colors and typography in `src/styles.css`; shared semantic tokens keep every portal visually consistent.
- Preserve the original external API configuration instead of adding a replacement service; this task changes presentation, not clinical business logic.
- Keep blood-transfer visuals in the shared AEROBLOOD presentation components; real receipt animations follow fulfilled request records, while explicitly labeled demos never modify clinical data.
