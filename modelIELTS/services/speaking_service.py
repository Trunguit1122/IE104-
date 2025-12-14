"""
Speaking Service Module
=======================
Standalone service for IELTS Speaking scoring (from text transcript).
Uses CEFR level classification and maps to IELTS band.

Model: RoBERTa-base fine-tuned on ICNALE + CEFR-Explorer (3,200+ samples)
Performance: 87.1% exact accuracy, 99.4% within 1 CEFR level

NOTE: Model is loaded lazily on first use.
      Train the model first using train_speaking_level.py
"""

import os
import torch
import numpy as np

MODEL_DIR = "./speaking-cefr-roberta"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# CEFR labels and mapping
CEFR_LABELS = ["A1", "A2", "B1", "B2", "C1", "C2"]
ID2LABEL = {i: lbl for i, lbl in enumerate(CEFR_LABELS)}
CEFR_TO_IELTS = {
    "A1": 2.5,
    "A2": 3.5,
    "B1": 5.0,
    "B2": 6.5,
    "C1": 7.5,
    "C2": 8.5,
}

# Lazy loading - model and tokenizer
_model = None
_tokenizer = None


def _load_model():
    """Lazy load model and tokenizer on first use."""
    global _model, _tokenizer
    
    if _model is not None:
        return _model, _tokenizer
    
    # Check if model exists
    if not os.path.exists(MODEL_DIR):
        raise FileNotFoundError(
            f"Speaking model not found at '{MODEL_DIR}'.\n"
            f"Please train the model first using: python train_speaking_level.py"
        )
    
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    
    print(f"📝 Loading Speaking Model from {MODEL_DIR}...")
    _tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    _model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR).to(device)
    _model.eval()
    print(f"   ✅ Model loaded successfully on {device}")
    
    return _model, _tokenizer


def predict_cefr_and_band(text: str) -> tuple[str, float]:
    """
    Predict CEFR level and approximate IELTS Speaking band.
    
    Args:
        text: The speaking transcript to score
        
    Returns:
        Tuple of (cefr_level, ielts_band)
    """
    model, tokenizer = _load_model()
    
    enc = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=128,
        padding="max_length",
    ).to(device)

    with torch.no_grad():
        outputs = model(**enc)
        logits = outputs.logits.detach().cpu().numpy()
        pred_id = int(np.argmax(logits, axis=-1)[0])

    cefr = ID2LABEL[pred_id]
    band = CEFR_TO_IELTS.get(cefr, 0.0)
    return cefr, band


def get_cefr_probabilities(text: str) -> dict:
    """
    Get probability distribution over CEFR levels.
    
    Args:
        text: The speaking transcript
        
    Returns:
        Dictionary mapping CEFR levels to probabilities
    """
    model, tokenizer = _load_model()
    
    enc = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=128,
        padding="max_length",
    ).to(device)

    with torch.no_grad():
        outputs = model(**enc)
        logits = outputs.logits.detach().cpu().numpy()[0]
        # Apply softmax
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / exp_logits.sum()

    return {CEFR_LABELS[i]: float(probs[i]) for i in range(len(CEFR_LABELS))}


def build_speaking_feedback(cefr: str, band: float) -> dict:
    """
    Generate feedback based on CEFR level and band.
    
    Args:
        cefr: The predicted CEFR level
        band: The approximate IELTS band
        
    Returns:
        Dictionary with feedback for 4 Speaking criteria
    """
    if band < 5.0:
        return {
            "fluency_coherence": "Tốc độ nói còn chậm với nhiều lần dừng. Hãy luyện nói liên tục hơn về các chủ đề quen thuộc.",
            "vocabulary": "Vốn từ còn hạn chế. Cần học thêm các cụm diễn đạt hàng ngày và từ vựng theo chủ đề.",
            "grammar": "Còn nhiều lỗi ngữ pháp cơ bản. Tập trung luyện các thì hiện tại, quá khứ và tương lai đơn.",
            "pronunciation": "Phát âm có thể gây khó hiểu cho người nghe. Luyện tập phát âm từng âm và trọng âm từ."
        }
    elif band < 6.5:
        return {
            "fluency_coherence": "Bạn có thể duy trì bài nói về chủ đề quen thuộc với một chút do dự. Sử dụng thêm các từ nối.",
            "vocabulary": "Vốn từ tốt cho các chủ đề quen thuộc. Mở rộng thêm các cụm diễn đạt và collocations.",
            "grammar": "Kiểm soát tốt các cấu trúc đơn giản. Luyện thêm câu phức và câu điều kiện.",
            "pronunciation": "Phát âm khá rõ ràng. Cần cải thiện ngữ điệu và cách nối âm."
        }
    else:
        return {
            "fluency_coherence": "Bạn nói trôi chảy, chỉ thỉnh thoảng do dự. Sử dụng tuyệt vời các từ nối.",
            "vocabulary": "Vốn từ phong phú với việc sử dụng tốt thành ngữ và collocations.",
            "grammar": "Kiểm soát nhất quán các cấu trúc phức tạp, chỉ thỉnh thoảng có lỗi nhỏ.",
            "pronunciation": "Phát âm rõ ràng, tự nhiên với việc kiểm soát tốt trọng âm và ngữ điệu."
        }


def score_speaking(text: str, include_probabilities: bool = False) -> dict:
    """
    Complete scoring function that returns CEFR, band, and feedback.
    
    Args:
        text: The speaking transcript to score
        include_probabilities: Whether to include CEFR probability distribution
        
    Returns:
        Dictionary with cefr_level, approx_ielts_band, feedback, and optionally probabilities
    """
    cefr, band = predict_cefr_and_band(text)
    feedback = build_speaking_feedback(cefr, band)
    
    result = {
        "cefr_level": cefr,
        "approx_ielts_band": band,
        "feedback": feedback
    }
    
    if include_probabilities:
        result["cefr_probabilities"] = get_cefr_probabilities(text)
    
    return result


# ============= CLI Testing =============
if __name__ == "__main__":
    print(f"Using device: {device}")
    
    sample_text = """
Well, I think technology has changed our lives in many significant ways,
both positive and negative. On the positive side, smartphones and the
internet have made communication incredibly easy. We can now connect with
friends and family anywhere in the world instantly through video calls or
messaging apps. Also, access to information has become much more convenient.

However, I also believe there are some drawbacks. Many people spend too
much time scrolling through social media instead of having meaningful
face-to-face conversations. This can lead to feelings of isolation and
anxiety, particularly among young people.

Overall, I think technology is a powerful tool that can enhance our lives
if we use it wisely and maintain a healthy balance.
    """.strip()

    print("\n" + "="*50)
    print("Testing Speaking Service")
    print("="*50)
    
    result = score_speaking(sample_text, include_probabilities=True)
    print(f"\n📊 CEFR Level: {result['cefr_level']}")
    print(f"📊 Approx IELTS Band: {result['approx_ielts_band']}")
    
    print("\n📊 CEFR Probabilities:")
    for level, prob in result['cefr_probabilities'].items():
        bar = "█" * int(prob * 50)
        print(f"  {level}: {prob:.2%} {bar}")
    
    print("\n📋 Feedback:")
    for key, value in result['feedback'].items():
        print(f"  • {key}: {value}")
