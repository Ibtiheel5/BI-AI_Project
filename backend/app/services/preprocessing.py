"""
Prétraitement des images pour l'inférence
Supporte img_size dynamique (224 pour ResNet50, 260 pour EfficientNet-B2)
"""
import io
import cv2
import numpy as np
import torch
from PIL import Image
from torchvision import transforms

from app.core.config import settings


def preprocess_image(image_bytes: bytes, img_size: int = 224) -> torch.Tensor:
    """
    Prétraiter une image pour le modèle

    Args:
        image_bytes : Image en bytes (JPEG/PNG)
        img_size    : Taille de sortie — 224 pour ResNet50, 260 pour EfficientNet-B2

    Returns:
        Tensor [1, 3, H, W]
    """
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img_array = np.array(image)
    img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    img_resized = cv2.resize(img_array, (img_size, img_size))
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)

    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    tensor = transform(img_rgb)
    return tensor.unsqueeze(0)


def validate_image(image_bytes: bytes) -> bool:
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()
        return True
    except Exception:
        return False