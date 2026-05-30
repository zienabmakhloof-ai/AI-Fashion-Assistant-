# 🎨 AI Fashion Assistant | مساعد الموضة بالذكاء الاصطناعي

<div align="center">

![Python](https://img.shields.io/badge/Python-3.9%2B-blue?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-2.3%2B-green?style=flat-square&logo=flask)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-red?style=flat-square&logo=pytorch)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![Language](https://img.shields.io/badge/Language-Arabic%20%7C%20English-purple?style=flat-square)

**A full-stack AI-powered fashion assistant that generates personalized outfit recommendations, AI-generated images, and promotional videos.**

[العربية](#-نظرة-عامة) · [English](#-overview)

</div>

---


## 🌐 Overview

AI Fashion Assistant is a full-stack web application powered by generative AI models:

- 👗 **Personalized fashion advice** based on gender, age group, preferred styles and colors
- 🖼️ **AI-generated outfit images** using Stable Diffusion v1.5
- 🎬 **Auto-generated promo video** with transition effects between images
- 💬 **Smart fashion tips** powered by DeepSeek via OpenRouter API

---

## 🏗️ Project Structure

```
AI-Fashion-Assistant/
├── main.py                  # Flask backend — API routes & model logic
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variables template
├── run.ipynb                # Jupyter notebook for Colab / experimentation
├── static/
│   ├── script.js            # Frontend JavaScript (API calls, UI logic)
│   └── styles.css           # Styling (RTL Arabic support)
├── templates/
│   ├── index.html           # Main UI (Arabic RTL)
│   ├── upload-icon.svg      # UI asset
│   └── download.jpeg        # Hero image
├── uploads/                 # User uploaded files (git-ignored)
└── generated_media/         # AI-generated images & videos (git-ignored)
```

---

## ⚙️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Flask + Flask-CORS |
| Image Generation | Stable Diffusion v1.5 (via Diffusers) |
| Video Generation | Frame blending + zoom effects (PIL + NumPy) |
| LLM (Fashion Advice) | DeepSeek via OpenRouter API |
| Frontend | Vanilla JS + CSS (RTL/Arabic) |
| GPU Support | PyTorch (CUDA / CPU fallback) |
| Tunneling | ngrok (for Colab / cloud environments) |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/zienabmakhloof-ai/AI-Fashion-Assistant-.git
cd AI-Fashion-Assistant-
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
source venv/bin/activate        # Linux / macOS
# venv\Scripts\activate         # Windows
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

> **Note:** For GPU support, install PyTorch with CUDA:
> ```bash
> pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
> ```

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Then open `.env` and fill in your API keys:

```env
HF_TOKEN=your_huggingface_token
OPENROUTER_API_KEY=your_openrouter_key
NGROK_TOKEN=your_ngrok_token        # Only needed for Colab / cloud
```

### 5. Run the App

```bash
python main.py
```

Open your browser at: **http://localhost:5000**

---

## ☁️ Running on Google Colab

Open `run.ipynb` in Google Colab for a ready-to-run notebook with GPU acceleration.  
Set your secrets in Colab's **Secrets** panel (🔑 icon) instead of a `.env` file:

| Secret Name | Value |
|-------------|-------|
| `HF_TOKEN` | Your HuggingFace token |
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `NGROK_TOKEN` | Your ngrok auth token |

---

---

## ✨ Generated Results

### 🖼️ AI-Generated Outfit Images 

<div align="center">

| 👩 Female — Casual | 👩 Female — Formal | 👩 Female — Streetwear |
|:---:|:---:|:---:|
| ![](assets/examples/female_casual.png) | ![](assets/examples/female_formal.png) | ![](assets/examples/female_street.png) |

| 👨 Male — Casual | 👨 Male — Formal | 👨 Male — Streetwear |
|:---:|:---:|:---:|
| ![](assets/examples/male_casual.png) | ![](assets/examples/male_formal.png) | ![](assets/examples/male_street.png) |

</div>

---

### 🎬 Demo Video 

<div align="center">

https://github.com/zienabmakhloof-ai/AI-Fashion-Assistant-/assets/Demo.mp4

> *The app automatically generates a promotional video combining all outfit images with smooth transition effects.*
</div>

---

### 🖥️ App Interface | واجهة التطبيق

<div align="center">

| Input Form | Generating... | Final Results |
|:---:|:---:|:---:|
| ![](assets/screenshots/input_form.png) | ![](assets/screenshots/generating.png) | ![](assets/screenshots/results.png) |

</div>

-----

## 🔑 API Keys — Where to Get Them

| Key | Link |
|-----|------|
| `HF_TOKEN` | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `NGROK_TOKEN` | [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken) |

---

## 📡 API Reference

### `POST /api/generate`

Generate fashion recommendations, images, and video.

**Request Body:**
```json
{
  "preferences": {
    "gender": "female",
    "ageGroup": "18-25",
    "styles": ["casual", "modern"],
    "colors": ["blue", "white"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "advice": "نصائح الموضة المخصصة...",
  "outfits": [
    "/generated_media/fashion_1234_0.png",
    "/generated_media/fashion_1234_1.png",
    "/generated_media/fashion_1234_2.png"
  ],
  "video": "/generated_media/fashion_ad_1234.mp4"
}
```

---

## 🧠 Models Used

| Model | Purpose | Source |
|-------|---------|--------|
| `runwayml/stable-diffusion-v1-5` | Image generation | HuggingFace |
| `cerspense/zeroscope_v2_576w` | Video generation (optional) | HuggingFace |
| `deepseek/deepseek-chat-v3-0324:free` | Fashion advice (LLM) | OpenRouter |

---

## ⚠️ Important Notes

- **GPU recommended:** Image generation on CPU is very slow (several minutes per image). A GPU (NVIDIA with CUDA) will reduce this to seconds.
- **First run:** Models will be downloaded automatically (~4-8 GB). This takes time once, then they are cached.
- **Generated files:** Images and videos are saved to `generated_media/` and are excluded from Git.

---

## 🛡️ Security

- **Never commit your `.env` file.** It is already listed in `.gitignore`.
- All API keys must be stored in `.env` (locally) or in your cloud provider's secret manager (Colab Secrets, GitHub Actions Secrets, etc.).
- Rotate any key that was previously exposed in source code.


## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

<div align="center">
Made with ❤️ using Flask, PyTorch, and Diffusers
</div>
