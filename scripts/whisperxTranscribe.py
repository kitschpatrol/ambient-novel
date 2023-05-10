import whisperx
import json
import argparse

parser = argparse.ArgumentParser(description='Takes an audio file and returns a JSON transcript')
parser.add_argument('--audio_file', help='Path to audio file')
args = parser.parse_args()

# device = "cuda" # much much faster on windows
# device = "mps" # not ready yet for transcribe function...
device = "cpu" 
batch_size = 16 # reduce if low on GPU mem, was 16
# compute_type = "float16" # change to "int8" if low on GPU mem (may reduce accuracy)
compute_type = "int8"

# model_name = "large-v2"
model_name = "tiny"

model = whisperx.load_model(model_name, device, compute_type=compute_type, language="en")

audio = whisperx.load_audio(args.audio_file)
result = model.transcribe(audio, batch_size=batch_size, max_line_width=42, max_line_count=2)

print(json.dumps(result["segments"]))


# delete model if low on GPU resources
# import gc; gc.collect(); torch.cuda.empty_cache(); del model_a