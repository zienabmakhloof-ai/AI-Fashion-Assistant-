from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import traceback
import torch
from diffusers import StableDiffusionPipeline, DiffusionPipeline, DPMSolverMultistepScheduler
from diffusers.utils import export_to_video
import time
from pyngrok import ngrok
import numpy as np
import openai
from huggingface_hub import login
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# App initialization
app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app, resources={
    r"/api/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Folder configuration
UPLOAD_FOLDER = 'uploads'
GENERATED_MEDIA_FOLDER = 'generated_media'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(GENERATED_MEDIA_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Model globals
image_pipe = None
video_pipe = None

# HuggingFace login
HF_TOKEN = os.getenv("HF_TOKEN")
if HF_TOKEN:
    login(token=HF_TOKEN)
else:
    print("Warning: HF_TOKEN not set. Some models may not be accessible.")


def load_models():
    """Load image and video generation models."""
    global image_pipe, video_pipe

    # Load image generation model
    if image_pipe is None:
        print("Loading image generation model...")
        try:
            dtype = torch.float16 if torch.cuda.is_available() else torch.float32
            image_pipe = DiffusionPipeline.from_pretrained(
                "runwayml/stable-diffusion-v1-5",
                torch_dtype=dtype
            )
            device = "cuda" if torch.cuda.is_available() else "cpu"
            image_pipe = image_pipe.to(device)
            print("Image model loaded successfully.")
        except Exception as e:
            print(f"Error loading image model: {e}")
            image_pipe = None

    # Load video generation model
    if video_pipe is None:
        print("Loading video generation model...")
        try:
            dtype = torch.float16 if torch.cuda.is_available() else torch.float32
            video_pipe = DiffusionPipeline.from_pretrained(
                "cerspense/zeroscope_v2_576w",
                torch_dtype=dtype
            )
            video_pipe.scheduler = DPMSolverMultistepScheduler.from_config(
                video_pipe.scheduler.config
            )
            if torch.cuda.is_available():
                video_pipe.enable_model_cpu_offload()
            else:
                video_pipe = video_pipe.to("cpu")
            print("Video model loaded successfully.")
        except Exception as e:
            print(f"Error loading video model: {e}")
            video_pipe = None


# Load models at startup
load_models()


def generate_fashion_advice(preferences: dict) -> str:
    """Generate personalized fashion advice using OpenRouter."""
    prompt = f"""
    أنا مساعد ذكاء اصطناعي لإنشاء نصائح موضة مخصصة.
    المستخدم هو/هي {preferences.get('gender', 'غير محدد')} في فئة {preferences.get('ageGroup', 'غير محدد')}.
    الأنماط المفضلة: {', '.join(preferences.get('styles', []))}.
    الألوان المفضلة: {', '.join(preferences.get('colors', []))}.
    الرجاء تقديم 3 نصائح موضة مخصصة باللغة العربية.
    """

    try:
        openai.api_base = "https://openrouter.ai/api/v1"
        openai.api_key = os.getenv("OPENROUTER_API_KEY")
        response = openai.ChatCompletion.create(
            model=os.getenv("LLM_MODEL", "deepseek/deepseek-chat-v3-0324:free"),
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating fashion advice: {e}")
        return "عذراً، حدث خطأ أثناء توليد النصائح. يرجى المحاولة لاحقاً."


@app.route('/')
def home():
    return render_template('index.html', api_base_url=app.config.get('NGROK_URL', ''))


@app.route('/api/generate', methods=['POST'])
def generate_recommendations():
    try:
        data = request.json
        preferences = data.get('preferences', {})

        if not preferences:
            return jsonify({"success": False, "error": "بيانات التفضيلات مطلوبة"}), 400

        # Generate advice
        advice = generate_fashion_advice(preferences)

        # Build image prompt
        image_prompt = f"""
        Fashion model ({preferences.get('gender', 'unspecified')}) wearing:
        - Styles: {', '.join(preferences.get('styles', []))}
        - Colors: {', '.join(preferences.get('colors', []))}
        - Clean white background
        - High quality and detailed
        - Modest fashion
        - Professional photography
        """

        image_urls = []
        if image_pipe:
            for i in range(3):
                try:
                    device = "cuda" if torch.cuda.is_available() else "cpu"
                    generator = torch.Generator(device=device).manual_seed(i)
                    image = image_pipe(
                        image_prompt,
                        guidance_scale=7.5,
                        generator=generator
                    ).images[0]
                    filename = f"fashion_{int(time.time())}_{i}.png"
                    filepath = os.path.join(GENERATED_MEDIA_FOLDER, filename)
                    image.save(filepath)
                    image_urls.append(f"/generated_media/{filename}")
                except Exception as e:
                    print(f"Error generating image {i}: {e}")
                    continue
        else:
            print("Image model not available.")

        # Generate video from generated images
        video_url = None
        if image_urls:
            try:
                frames = []
                transition_frames = 5

                images = []
                for img_url in image_urls:
                    img_path = os.path.join(GENERATED_MEDIA_FOLDER, img_url.split('/')[-1])
                    img = Image.open(img_path).convert('RGB')
                    img = img.resize((576, 576))
                    images.append(np.array(img))

                for i in range(len(images)):
                    for _ in range(16):
                        frames.append(images[i])

                    if i < len(images) - 1:
                        for t in range(transition_frames):
                            alpha = t / transition_frames
                            blended = (images[i] * (1 - alpha) + images[i + 1] * alpha)
                            frames.append(blended.astype(np.uint8))

                # Zoom effect
                zoomed_frames = []
                for frame in frames:
                    for z in [1.0, 1.02, 1.05, 1.02, 1.0]:
                        h, w = frame.shape[:2]
                        zoomed = Image.fromarray(frame).resize((int(w * z), int(h * z)))
                        zoomed = np.array(zoomed.crop((
                            (zoomed.width - w) // 2,
                            (zoomed.height - h) // 2,
                            (zoomed.width + w) // 2,
                            (zoomed.height + h) // 2
                        )))
                        zoomed_frames.append(zoomed)
                frames = zoomed_frames

                # Overlay text
                for i in range(len(frames)):
                    if i % 30 == 0:
                        try:
                            frame = Image.fromarray(frames[i])
                            draw = ImageDraw.Draw(frame)
                            try:
                                font = ImageFont.truetype("arial.ttf", 30)
                            except Exception:
                                font = ImageFont.load_default()
                            text = "أحدث صيحات الموضة"
                            text_width = draw.textlength(text, font=font)
                            draw.rectangle([(10, 10), (20 + text_width, 50)], fill=(0, 0, 0, 128))
                            draw.text((15, 15), text, fill=(255, 255, 255), font=font)
                            frames[i] = np.array(frame)
                        except Exception as e:
                            print(f"Error adding text overlay: {e}")
                            continue

                filename = f"fashion_ad_{int(time.time())}.mp4"
                filepath = os.path.join(GENERATED_MEDIA_FOLDER, filename)
                export_to_video(np.array(frames), filepath, fps=8)
                video_url = f"/generated_media/{filename}"

            except Exception as e:
                print(f"Error generating video: {e}")
                traceback.print_exc()
        else:
            print("No images available for video generation.")

        return jsonify({
            "success": True,
            "advice": advice,
            "outfits": image_urls,
            "video": video_url
        })

    except Exception as e:
        print(f"Error generating recommendations: {e}")
        traceback.print_exc()
        return jsonify({"success": False, "error": "حدث خطأ داخلي في الخادم"}), 500


@app.route('/generated_media/<filename>')
def serve_generated_media(filename):
    return send_from_directory(GENERATED_MEDIA_FOLDER, filename)


if __name__ == '__main__':
    ngrok_token = os.getenv("NGROK_TOKEN")
    if ngrok_token:
        ngrok.set_auth_token(ngrok_token)
        public_url = ngrok.connect(5000).public_url
        print(f" * ngrok tunnel: {public_url}")
        app.config['NGROK_URL'] = public_url
    else:
        print("Warning: NGROK_TOKEN not set. Running locally only.")

    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    app.run(host="0.0.0.0", port=5000)
