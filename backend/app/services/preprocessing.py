"""
Prétraitement des images pour l'inférence
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
        image_bytes: Image en bytes (JPEG/PNG)
        img_size: Taille de sortie (default: 224)
        
    Returns:
        Tensor [1, 3, H, W]
    """
    # Charger l'image depuis les bytes
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    
    # Convertir en numpy array (OpenCV format)
    img_array = np.array(image)
    img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    
    # Redimensionner
    img_resized = cv2.resize(img_array, (img_size, img_size))
    
    # Convertir en RGB pour le modèle
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    
    # Normalisation ImageNet
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    
    # Appliquer les transformations
    tensor = transform(img_rgb)
    
    # Ajouter dimension batch [1, C, H, W]
    tensor = tensor.unsqueeze(0)
    
    return tensor


def validate_image(image_bytes: bytes) -> bool:
    """
    Valider que les bytes représentent une image valide
    
    Args:
        image_bytes: Bytes à vérifier
        
    Returns:
        True si image valide
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()
        return True
    except Exception:
        return False