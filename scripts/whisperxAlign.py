import whisperx
import json
import argparse

parser = argparse.ArgumentParser(description='Takes an audio file and a hand-written transcript, and returns JSON annotating the timing of each transcript word in the audio file')
parser.add_argument('--audio_file', help='Path to audio file')
parser.add_argument('--transcript', help='Single string of transcript')
parser.add_argument('--start_time', help='Start of alignment window, float seconds')
parser.add_argument('--end_time', help='End of alignment window, float seconds')
args = parser.parse_args()

# device = "cuda" 
# device = "cpu" 
device = "mps" 

audio = whisperx.load_audio(args.audio_file)
knownTranscript = [{'text': args.transcript, 'start': float(args.start_time), 'end': float(args.end_time)}]

model_a, metadata = whisperx.load_align_model(language_code="en", device=device)
result = whisperx.align(knownTranscript, model_a, metadata, audio, device, return_char_alignments=False)

print(json.dumps(result["segments"]))

# delete model if low on GPU resources
# import gc; gc.collect(); torch.cuda.empty_cache(); del model_a