# Ambient Novel

## Overview

The "Ambient Novel" website was created as a home or Scott Wayne Indiana's book _The Valentine Mob_. After several iterations, an interface approach that allows for simultaneous playack, scrubbing of multiple narrated audio tracks.

## Updating the content

Certain data and assets are generated from the source data in `/data` and ouput to `/static`, `/data-generated` and `/src/lib/data`.

Takes about half an hour on my M1 Air to generate everything from scratch.

The content generator does a number of things depending on the config object in `/data/book.json`.

- Generates voice audio files to narrate each chapter if no recordings are provided.
- Compresses the voice audio to a number of formats.
- Transcribes the voice files using a speech-to-text to a transcript with line-level timings
- Aligns the transcription output to the text of the book, preserving the line-level timings
- Runs a word-level timing inference on the modified transcript against the original voice over file
- Compresses the ambient music to a number of formats.
- Information gathered in the above steps is merged with data from `/data/book.json` to yield the final `/src/lib/data`

To install dependencies for the content generation process, run:

To update the generated data, run:

```bash
 npm run generateData
```

Note that this will overwrite existing data.

Note special cards with embedded html (1-indexed):

- 1: Has a color span
- 19: Has a list
- 54: Has a color span
- 83: Has a color span

## Transcript Alignment and Text to Speech

This is sketchy.

Runs on an M1.

To set up the environment:

```bash
# install brew if you haven't already
# install ffmpeg with fddk-aac
# whisperx doesn't care about specific encoder implementations, but safari does
# and we also use ffmpeg in the data generation step
# TODO does this install ffprobe as well?
brew tap homebrew-ffmpeg/ffmpeg
brew install homebrew-ffmpeg/ffmpeg/ffmpeg --with-fdk-aacbrew tap homebrew-ffmpeg/ffmpeg
brew install miniconda
conda init zsh

# restart terminal

# install whisperx
conda create --name whisperx python=3.10
conda activate whisperx
pip install argparse torch torchaudio torchvision
pip install git+https://github.com/m-bain/whisperx.git

# overwrite previously installed torch with nightlies for mps / m1 support
pip install --pre --force-reinstall torch torchaudio torchvision --index-url https://download.pytorch.org/whl/nightly/cpu

# pip will complain about missmatched dependencies, but ignore this
conda deactivate

# install tts
# https://github.com/coqui-ai/TTS/discussions/2177
conda create --name coqui python=3.9
conda activate coqui
git clone https://github.com/coqui-ai/TTS.git
brew install mecab
brew install espeak
conda install numpy scipy scikit-learn Cython
pip install -e .
make install
conda deactivate
```

To test... currently does NOT work, but the alignment-only model in whisperx does that's called by alignTranscriptToAudio.py does:

```bash
conda activate whisperx
export PYTORCH_ENABLE_MPS_FALLBACK=1
whisperx ./static/speech/0-78.`mp3` --device mps --model tiny --language en --verbose True --fp16 Fals
conda deactivate
```

## Developing

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```

## Deployment

The app is deployed via a GitHub action to Scott's DreamHost server, which runs automatically on deployment to the `main` or `develop` branches. Each branch deploys to a different subdirectory on the server. Configuration and secrets are stored in the GitHub repo settings.

**Required GitHub [secrets](https://github.com/kitschpatrol/ambient-novel/settings/secrets/actions):**

- `SERVER_HOST`  
  DreamHost server host name

- `SERVER_USERNAME`  
  DreamHost server SSH user

- `SERVER_PASSWORD`  
  DreamHost server SSH password

**Required GitHub [variables](https://github.com/kitschpatrol/ambient-novel/settings/variables/actions):**

- `BASE_PATH_PRODUCTION`  
  Name of subfolder to copy the site to. During the build process, this variable is also used in `svelte.config.js`. copied. Must start with `/` and end without `/`.  
  Example: `/thevalentinemob`

- `BASE_PATH_STAGING`  
  As above, but for the develop branch.  
  Example: `/thevalentinemob-staging`

- `SERVER_PATH`  
  DreamHost server path, this is prepended to the base path when files are copied. Must start with `/` and end without `/`.  
  Example: `/home/someuser/somefolder`

## Dev notes

No bundle size advantage to moving content preprocessing deps only to their own package.json.

To use the `build-report` npm script, insteall [`dust`](https://github.com/bootandy/dust) via homebrew if needed.

```bash
brew install dust
```

### Known issues

- Scrolling issue on mobile safari, no touch up events during inertial scroll animations

### Scrolling

- https://github.com/studio-freight/lenis
- https://github.com/Adoratorio/hades

Suppressing Stylelint Tailwind @apply etc. directive errors:

- https://stackoverflow.com/a/76984634/2437832

Deployment server MUST support HTTP 206 range requests to successfuly set `currentTime` on audio elements on chrome.

Currently deployed to:
https://39forks.com/thevalentinemob-staging
https://39forks.com/thevalentinemob-production-tbd

### PWA

- https://stackoverflow.com/questions/76007716/how-do-i-use-workbox-range-requests-plugin-with-vite-pwa
- https://github.com/userquin/sveltesociety.dev/tree/pwa
- https://www.sarcevic.dev/offline-first-installable-pwa-sveltekit-workbox-precaching
- https://github.com/daffinm/audio-cache-test

Tried @vite-pwa/sveltekit, but too many issues getting correct behavior around range requests.

## License

The website's code and the book's text are shared under different licenses:

### Website

The Ambient Novel website project is licensed under the [MIT License][https://opensource.org/license/mit/]. See [`license.txt`](./license.txt).

### Book

The text of The Valentine Mob book (e.g. [`/data/book.json`](./data/book.json) and its derivatives throughout the project) is ©39forks Publishing USA 2023 All Rights Reserved. See [`/data/license.txt`](./data/license.txt).
