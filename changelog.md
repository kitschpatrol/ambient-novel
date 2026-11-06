# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Preserve content when unwrapping nested HTML tags and insert replacement text literally during content generation.
- Report MP3 metadata-writing failures correctly and preserve the underlying error.

### Documentation

- Clarify architecture notes and link content-generation prerequisites to the FFmpeg, WhisperX, and Coqui installation instructions.

### Maintenance

- Refresh application and content-generation dependencies, including SvelteKit, Zod 4, and node-html-parser 9.
- Upgrade contributor tooling to Node.js `^24.16.0 || >=26.3.0`, pnpm 12, TypeScript 6, and shared-config 8, and update installation and cleanup scripts.
- Replace unused Playwright setup with Vitest tests covering HTML transformations, emoji handling, text matching, and hashed media filenames.
- Add weekly repository and website link checks and monthly automated dependency-update pull requests.
- Update release automation to validate tags against the repository’s default branch and publish using the triggering tag.
- Pin Vite 5’s Rollup dependency to 4.64.5 to avoid `$state is not defined` errors during Svelte 4 prerendering.
- Restrict HTTPS certificate setup to local development and preview servers, and set browser build targets aligned with Tailwind CSS 4.
- Validate generated book data in the loader and tighten TypeScript checking across application and content scripts.
- Remove unused open-source credit enumeration and generated license-data code.

## [2.1.3] - 2026-05-18

### Documentation

- Remove obsolete bundle-size reporting instructions and correct the README license link.

### Maintenance

- Refresh SvelteKit, Tailwind CSS, Workbox, and content-processing dependency requirements.
- Adopt pnpm 11 and Node.js 22.22.2+ for development, migrate dependency-build approvals, and refresh contributor tools and CI actions.
- Use cross-platform file commands and remove the unused `build-report` script.
- Allow release automation to handle version tags with or without a leading `v`.

## [2.1.2] - 2026-04-07

### Documentation

- Add license and CI status badges to the README.

### Maintenance

- Refresh SvelteKit, Tailwind CSS, Lodash, and content-processing dependency requirements.
- Update shared-config 7, pnpm, Wrangler, and contributor tooling, and declare Node.js 22.18+ for development.
- Add Linux, macOS, and Windows CI builds, linting, and test-command checks, with Windows-compatible metadata quoting and certificate setup disabled in CI.
- Pin checkout actions, declare workflow permissions explicitly, and disable retained checkout credentials.

## [2.1.1] - 2026-03-12

### Documentation

- Explain SvelteKit build warnings about optional Svelte 5 exports when using Svelte 4.

### Maintenance

- Refresh SvelteKit, Tailwind CSS, and content-processing dependency requirements.
- Update shared-config 6, pnpm, Wrangler, GitHub Actions, and editor tooling, and resolve file-hashing type compatibility.

## [2.1.0] - 2026-02-02

### Added

- Introduce a responsive ten-chapter reader with narration, ambient music, synchronized scrolling text, word highlighting, and animated intro/outro starfields.
- Allow chapters to play independently or together, with mouse, touch, and trackpad scrubbing and per-chapter play/pause and reset controls.
- Provide Play Through, Lucky Blend, Pause all, and Reset all controls, including randomized chapter positions and smaller blends on mobile.
- Add a text-only reading page with a linked table of contents and chapter anchors.
- Offer a free complete audiobook MP3 with album art and metadata, alongside links to paperback and deluxe editions.
- Cache chapter audio on demand for offline listening, including support for cached HTTP range responses.
- Provide version and cache diagnostics, cache-clearing and service-worker removal controls, and `/version.json` build metadata.
- Provide a content pipeline for PDF text extraction, optional synthesized narration, WhisperX word alignment, and MP3/M4A generation.
- Include a full-screen web app manifest and mobile home-screen icons.

### Documentation

- Add listening guidance, project background, credits, and browser-support notes.
- Document the architecture, content-generation workflow, FFmpeg/WhisperX/Coqui prerequisites, and Cloudflare Workers deployment.
- Document MIT licensing for website code and separate all-rights-reserved terms for the book.

### Maintenance

- Set up Node.js 22+/pnpm development, SvelteKit 2 and Tailwind CSS 4 builds, shared linting, and Cloudflare Workers deployment and release tooling.

[Unreleased]: https://github.com/kitschpatrol/ambient-novel/compare/v2.1.3...HEAD
[2.1.0]: https://github.com/kitschpatrol/ambient-novel/releases/tag/v2.1.0
[2.1.1]: https://github.com/kitschpatrol/ambient-novel/compare/v2.1.0...v2.1.1
[2.1.2]: https://github.com/kitschpatrol/ambient-novel/compare/v2.1.1...v2.1.2
[2.1.3]: https://github.com/kitschpatrol/ambient-novel/compare/v2.1.2...v2.1.3
