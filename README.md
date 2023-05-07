# Ambient Novel

## Updating the content

Certain data and assets are generated from the source data in `/data` and ouput to `/static` and `/src/lib/data-generated`.

To update the generated data, run:

```bash
 npm run generate-data
```

Note that this will overwrite existing data.

Note special cards with embedded html (1-indexed):

- 1: Has a color span
- 19: Has a list
- 54: Has a color span
- 83: Has a color span

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.
