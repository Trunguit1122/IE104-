"""
================================================================================
Writing Service Module - IELTS Writing Band Prediction
================================================================================
Service for scoring IELTS Writing essays using fine-tuned RoBERTa model.
Uses 12-class classification approach for band prediction (3.5 - 9.0).

Model Performance:
    - Exact Match: 35.23%
    - Within ±0.5 Band: 70.47%
    - Within ±1.0 Band: 87.98%
================================================================================
"""

import json
import os
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Model directory (default to Docker volume /models, fallback to local)
BASE_MODEL_DIR = os.getenv("MODEL_DIR", "/models")
MODEL_DIR = os.path.join(BASE_MODEL_DIR, "ielts-writing-v3-classification")

# Setup device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load model, tokenizer, and band mapping
print(f"📝 Loading Writing Model from {MODEL_DIR}...")

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR).to(device)
    model.eval()
    
    # Load band mapping
    with open(f"{MODEL_DIR}/band_mapping.json") as f:
        band_mapping = json.load(f)
    
    BAND_CLASSES = band_mapping["band_classes"]
    IDX_TO_BAND = {int(k): v for k, v in band_mapping["idx_to_band"].items()}
    
    print(f"   ✅ Model loaded successfully on {device}")
    print(f"   📋 Band classes: {BAND_CLASSES}")

except Exception as e:
    print(f"   ❌ Failed to load model: {e}")
    raise


def predict_writing_band(essay: str) -> dict:
    """
    Predict IELTS Writing band score from essay text.
    
    Args:
        essay: The essay text to score
        
    Returns:
        dict with:
            - band: Predicted band score (3.5 - 9.0)
            - confidence: Model confidence (0.0 - 1.0)
            - top_predictions: List of top 3 predictions with probabilities
    """
    # Tokenize
    inputs = tokenizer(
        essay,
        return_tensors="pt",
        truncation=True,
        max_length=512,
        padding="max_length",
    ).to(device)

    # Predict
    with torch.no_grad():
        outputs = model(**inputs)
        probabilities = F.softmax(outputs.logits, dim=-1)[0]
    
    # Get top 3 predictions
    top_k = 3
    top_indices = torch.argsort(probabilities, descending=True)[:top_k]
    
    top_predictions = []
    for idx in top_indices:
        band = IDX_TO_BAND[idx.item()]
        prob = probabilities[idx].item()
        top_predictions.append({"band": band, "probability": round(prob, 4)})
    
    # Best prediction
    best_idx = top_indices[0].item()
    best_band = IDX_TO_BAND[best_idx]
    confidence = probabilities[best_idx].item()
    
    return {
        "band": best_band,
        "confidence": round(confidence, 4),
        "top_predictions": top_predictions
    }


def build_writing_feedback(band: float) -> dict:
    """
    Generate detailed feedback based on predicted band score.
    
    Args:
        band: The predicted band score
        
    Returns:
        Dictionary with feedback for 4 IELTS Writing criteria
    """
    if band < 5.0:
        return {
            "task_response": "Bài viết chưa trả lời đầy đủ yêu cầu đề bài. Hãy tập trung hiểu rõ câu hỏi và đưa ra các ý chính liên quan.",
            "coherence_cohesion": "Cấu trúc bài cần cải thiện. Sử dụng các đoạn văn rõ ràng với câu chủ đề và từ nối.",
            "vocabulary": "Vốn từ vựng còn hạn chế. Cần học thêm từ vựng theo chủ đề và các cụm từ cố định (collocations).",
            "grammar": "Nhiều lỗi ngữ pháp ảnh hưởng đến ý nghĩa. Cần luyện tập các cấu trúc câu cơ bản và các thì phổ biến.",
            "level": "Cần cải thiện nhiều",
            "suggestion": "Tập trung vào việc hiểu đề bài, xây dựng cấu trúc bài viết rõ ràng, và luyện tập ngữ pháp cơ bản."
        }
    elif band < 6.0:
        return {
            "task_response": "Bạn đã trả lời được yêu cầu cơ bản nhưng cần phát triển ý tưởng sâu hơn với ví dụ cụ thể.",
            "coherence_cohesion": "Bài viết có tổ chức tương đối nhưng cần cải thiện cách liên kết ý. Sử dụng đa dạng từ nối hơn.",
            "vocabulary": "Vốn từ đủ dùng cho bài viết. Hãy thử dùng từ ngữ đa dạng hơn và tránh lặp từ.",
            "grammar": "Có một số lỗi ngữ pháp nhưng không ảnh hưởng nhiều đến ý nghĩa. Cần luyện thêm câu phức.",
            "level": "Đạt yêu cầu cơ bản",
            "suggestion": "Phát triển ý tưởng chi tiết hơn, học thêm từ vựng học thuật, và đa dạng hóa cấu trúc câu."
        }
    elif band < 7.0:
        return {
            "task_response": "Bài viết trả lời tốt yêu cầu đề bài với các ý được phát triển khá rõ ràng.",
            "coherence_cohesion": "Bài viết có logic tốt với việc sử dụng hiệu quả các phương tiện liên kết.",
            "vocabulary": "Vốn từ khá phong phú, sử dụng được một số từ vựng học thuật và collocations.",
            "grammar": "Ngữ pháp khá tốt với đa dạng cấu trúc câu. Có một số lỗi nhỏ không đáng kể.",
            "level": "Khá tốt",
            "suggestion": "Để đạt band cao hơn, cần sử dụng từ vựng tinh tế hơn và đa dạng cấu trúc ngữ pháp phức tạp."
        }
    elif band < 8.0:
        return {
            "task_response": "Bài viết phát triển tốt với quan điểm rõ ràng và các ý tưởng mở rộng, có chiều sâu.",
            "coherence_cohesion": "Tổ chức logic xuất sắc với việc sử dụng linh hoạt các phương tiện liên kết.",
            "vocabulary": "Vốn từ phong phú, sử dụng linh hoạt và chính xác các từ vựng học thuật.",
            "grammar": "Sử dụng đa dạng cấu trúc ngữ pháp một cách chính xác và tự nhiên.",
            "level": "Tốt",
            "suggestion": "Bài viết đã ở mức cao. Để hoàn thiện hơn, chú ý đến các chi tiết nhỏ và sự tinh tế trong diễn đạt."
        }
    else:
        return {
            "task_response": "Bài viết xuất sắc với phân tích sâu sắc và lập luận thuyết phục, đáp ứng hoàn hảo yêu cầu đề.",
            "coherence_cohesion": "Tổ chức hoàn hảo, mạch lạc tự nhiên, các ý được liên kết một cách tinh tế.",
            "vocabulary": "Vốn từ phong phú và tinh tế, sử dụng chính xác các từ vựng học thuật và idiomatic expressions.",
            "grammar": "Ngữ pháp hoàn hảo với đa dạng cấu trúc phức tạp, gần như không có lỗi.",
            "level": "Xuất sắc",
            "suggestion": "Bài viết đạt mức độ rất cao. Tiếp tục duy trì và phát triển phong cách viết của bạn."
        }


def score_writing(essay: str) -> dict:
    """
    Complete scoring function that returns band, confidence, and feedback.
    
    Args:
        essay: The essay text to score
        
    Returns:
        Dictionary with overall_band, confidence, top_predictions, and feedback
    """
    # Get prediction
    prediction = predict_writing_band(essay)
    band = prediction["band"]
    
    # Get feedback
    feedback = build_writing_feedback(band)
    
    return {
        "overall_band": band,
        "confidence": prediction["confidence"],
        "top_predictions": prediction["top_predictions"],
        "feedback": feedback
    }


# ================================================================================
# CLI Testing
# ================================================================================

if __name__ == "__main__":
    print(f"\n🔧 Device: {device}")
    
    sample_essay = """
In today's competitive world, many individuals prioritise their careers,
often spending long hours at work to gain promotions or higher salaries.
While career success is undeniably important for financial stability and
personal achievement, I believe that maintaining strong relationships with
family and friends is equally, if not more, essential for overall well-being.

On one hand, a successful career provides numerous benefits. It ensures
financial security, which allows individuals to meet their basic needs and
enjoy a comfortable lifestyle. Moreover, professional achievements can boost
self-esteem and provide a sense of purpose and fulfillment.

On the other hand, family and friends form the foundation of our emotional
support system. During challenging times, it is often our loved ones who
provide comfort and encouragement. Research has consistently shown that
strong social connections are linked to better mental health and longevity.

In conclusion, while career success is important, it should not come at the
expense of meaningful relationships. A balanced approach that values both
professional growth and personal connections is likely to lead to the most
fulfilling life.
    """.strip()

    print("\n" + "=" * 60)
    print("🧪 TESTING WRITING SERVICE")
    print("=" * 60)
    
    result = score_writing(sample_essay)
    
    print(f"\n📊 Predicted Band: {result['overall_band']}")
    print(f"🎯 Confidence: {result['confidence']*100:.1f}%")
    
    print("\n📈 Top Predictions:")
    for pred in result['top_predictions']:
        print(f"   • Band {pred['band']}: {pred['probability']*100:.1f}%")
    
    print(f"\n📋 Level: {result['feedback']['level']}")
    print("\n💡 Feedback:")
    for key in ['task_response', 'coherence_cohesion', 'vocabulary', 'grammar']:
        print(f"   • {key}: {result['feedback'][key]}")
    
    print(f"\n📝 Suggestion: {result['feedback']['suggestion']}")
    print("=" * 60)
