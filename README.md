# Ambient Novel

## Updating the content

Certain data and assets are generated from the source data in `/data` and ouput to `/static` and `/src/lib/data-generated`.

To install dependencies, run:

```bash
brew tap homebrew-ffmpeg/ffmpeg
brew install homebrew-ffmpeg/ffmpeg/ffmpeg --with-fdk-aacbrew tap homebrew-ffmpeg/ffmpeg
```

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

## Transcript Alignment

This is sketchy.

Runs on an M1.

To set up the environment:

```bash
# install ffmpeg if you haven't already
# whisperx doesn't care about specific versions, but safari does
# and we also use ffmpeg in the data generation step
brew tap homebrew-ffmpeg/ffmpeg
brew install homebrew-ffmpeg/ffmpeg/ffmpeg --with-fdk-aacbrew tap homebrew-ffmpeg/ffmpeg

brew install miniconda
conda init zsh

# restart terminal
conda create --name whisperx python=3.10
conda activate whisperx
pip install argparse torch torchaudio torchvision
pip install git+https://github.com/m-bain/whisperx.git

# overwrite previously installed torch with nightlies for mps / m1 support
pip install --pre --force-reinstall torch torchaudio torchvision --index-url https://download.pytorch.org/whl/nightly/cpu

# pip will complain about missmatched dependencies, but ignore this
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
