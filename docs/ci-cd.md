# CI/CD

GitHub Actions validates application changes on pushes and pull requests, checks the documentation on pull requests, and publishes the Material site from `main`.

## Workflows

<div class="wt-reference" markdown>

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | Push to `main`; pull request | Validate root workspaces, tvOS, and a browser screenshot |
| `test-macos.yml` | Push to `main`; pull request | Run root workspace tests on macOS |
| `docs-lint.yml` | Documentation pull request; manual run | Lint Markdown, build strictly, and check external links |
| `docs.yml` | Documentation push to `main` or `master`; manual run | Build and publish this site to GitHub Pages |

</div>

## Application CI

The `validate` job installs the root lockfile with Node.js 20, then runs linting, tests, and the workspace build on Ubuntu. The `tvos-build` job waits for validation, builds `@adsb/shared`, installs the independent `apps/tvos` lockfile, and runs tvOS type checking and tests on macOS.

The `screenshot` job builds the web app, starts its Vite preview server, and uses Playwright to upload a `tvos-ui-preview` artifact for 30 days. It depends on the root validation job.

## macOS tests

`test-macos.yml` installs the root lockfile and runs `npm run test` on `macos-latest`. This confirms the root unit tests behave on the platform used for native Apple builds.

## Documentation

This site is built by reusable workflows in [willtheorangeguy/mkdocs](https://github.com/willtheorangeguy/mkdocs). The callers in this repository define triggers and permissions; the shared repository owns the Material theme, strict build, link checker, artifact upload, and Pages deployment.

Documentation deploys only when paths relevant to the site change. Pull requests touching those paths run the non-deploying lint workflow.

## Releases

The repository has no automated release or package-publishing workflow. Application CI validates the source but does not create a tvOS archive or publish a registry package.

{{ support() }}
