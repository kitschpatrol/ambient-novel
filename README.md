# Ambient Novel

Uses [`dust`](https://github.com/bootandy/dust) in the `build-report` NPM script. Install from brew if needed:

```bash
brew install dust
```

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
- Information gathered in the above steps is merged with data from `/data/book.json` to tield the final `/src/lib/data`

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
# whisperx doesn't care about specific versions, but safari does
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
whisperx ./static/speech/0-78.mp3 --device mps --model tiny --language en --verbose True --fp16 Fals
conda deactivate
```

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
