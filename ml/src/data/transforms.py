"""
Transformations Albumentations pour les images
"""
import albumentations as A
from albumentations.pytorch import ToTensorV2


def get_train_transforms(img_size=224):
    """Transformations pour l'entraînement"""
    return A.Compose([
        A.Resize(img_size, img_size),
        
        # Augmentations optimales pour radiographies
        A.RandomBrightnessContrast(brightness_limit=0.15, contrast_limit=0.15, p=0.6),
        A.CLAHE(clip_limit=2.0, tile_grid_size=(8, 8), p=0.4),
        A.GaussianBlur(blur_limit=3, p=0.15),
        A.GaussNoise(p=0.2),
        A.RandomGamma(gamma_limit=(80, 120), p=0.3),
        
        # Normalisation ImageNet
        A.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        ),
        ToTensorV2()
    ])


def get_val_transforms(img_size=224):
    """Transformations pour validation/test"""
    return A.Compose([
        A.Resize(img_size, img_size),
        A.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        ),
        ToTensorV2()
    ])


def get_test_transforms(img_size=224):
    """Transformations pour test (identique à val)"""
    return get_val_transforms(img_size)