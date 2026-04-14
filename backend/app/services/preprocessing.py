"""
Prétraitement des images pour l'inférence
"""
import io
import torch
from PIL import Image
from torchvision import transforms


def preprocess_image(image_bytes: bytes, img_size: int = 224) -> torch.Tensor:
    """
    Prétraiter une image pour l'inférence.

    Args:
        image_bytes : Image en bytes (JPEG/PNG)
        img_size    : Taille de redimensionnement (224 brain/chest, 260 lung)

    Returns:
        Tensor [1, 3, img_size, img_size] normalisé ImageNet
    """
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

    transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),  # ✅ PIL direct, pas cv2
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    return transform(image).unsqueeze(0)  # [1, 3, H, W]


def validate_image(image_bytes: bytes) -> bool:
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()
        return True
    except Exception:
        return False