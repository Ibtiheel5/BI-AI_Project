"""
Dataset PyTorch pour radiographies thoraciques
"""
import os
import cv2
import numpy as np
import torch
from torch.utils.data import Dataset


class ChestXrayDataset(Dataset):
    """
    Dataset pour classification/segmentation de radiographies thoraciques
    """
    
    def __init__(self, root_dir, split='train', transform=None, task='classification', seed=42):
        """
        Args:
            root_dir: Chemin vers dataset_by_disease/
            split: 'train', 'val', ou 'test'
            transform: Transformations Albumentations
            task: 'classification' ou 'segmentation'
            seed: Seed pour reproductibilité
        """
        self.root_dir = root_dir
        self.transform = transform
        self.task = task
        self.samples = []
        
        # Définir les classes selon la tâche
        if task == 'segmentation':
            self.classes = ['COVID', 'Lung_Opacity', 'Normal', 'Viral_Pneumonia']
        else:
            # Toutes les classes sauf celles de segmentation
            all_dirs = [d for d in os.listdir(root_dir) 
                       if os.path.isdir(os.path.join(root_dir, d)) 
                       and not d.startswith('.')]
            self.classes = sorted([d for d in all_dirs 
                                  if d not in ['COVID', 'Lung_Opacity', 'Normal', 'Viral_Pneumonia']])
        
        # Mapping classe -> index
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.classes)}
        self.idx_to_class = {idx: cls for cls, idx in self.class_to_idx.items()}
        
        print(f"\n📊 Chargement du dataset - Split: {split}, Task: {task}")
        print(f"Classes détectées: {self.classes}")
        
        # Charger les échantillons
        self._load_samples(split, seed)
        
        print(f"✅ {len(self.samples)} images chargées")
    
    def _load_samples(self, split, seed):
        """Charger les chemins des images selon le split"""
        np.random.seed(seed)
        
        for classe in self.classes:
            class_path = os.path.join(self.root_dir, classe)
            images_dir = os.path.join(class_path, "images")
            
            # Vérifier si le dossier images/ existe
            if not os.path.isdir(images_dir):
                print(f"⚠️  Dossier images/ manquant pour {classe}, ignoré")
                continue
            
            # Lister toutes les images
            images = [f for f in os.listdir(images_dir) 
                     if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            
            if len(images) == 0:
                print(f"⚠️  Aucune image trouvée pour {classe}")
                continue
            
            # Mélanger et split (70% train, 15% val, 15% test)
            np.random.shuffle(images)
            n = len(images)
            
            if split == 'train':
                selected_images = images[:int(0.7 * n)]
            elif split == 'val':
                selected_images = images[int(0.7 * n):int(0.85 * n)]
            else:  # test
                selected_images = images[int(0.85 * n):]
            
            # Ajouter les échantillons
            masks_dir = os.path.join(class_path, "masks")
            has_masks = os.path.isdir(masks_dir) and self.task == 'segmentation'
            
            for img_name in selected_images:
                img_path = os.path.join(images_dir, img_name)
                mask_path = os.path.join(masks_dir, img_name) if has_masks else None
                
                self.samples.append({
                    'image': img_path,
                    'mask': mask_path,
                    'class': classe,
                    'label': self.class_to_idx[classe]
                })
            
            print(f"  {classe}: {len(selected_images)} images")
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        sample = self.samples[idx]
        
        # Charger l'image
        img = cv2.imread(sample['image'])
        if img is None:
            raise ValueError(f"Impossible de charger l'image: {sample['image']}")
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Charger le masque si segmentation
        mask = None
        if self.task == 'segmentation' and sample['mask'] is not None:
            mask = cv2.imread(sample['mask'], cv2.IMREAD_GRAYSCALE)
            if mask is None:
                # Créer un masque vide si manquant
                mask = np.zeros(img.shape[:2], dtype=np.uint8)
        
        # Appliquer les transformations
        if self.transform:
            if mask is not None:
                transformed = self.transform(image=img, mask=mask)
                img = transformed['image']
                mask = transformed['mask']
            else:
                transformed = self.transform(image=img)
                img = transformed['image']
        
        label = sample['label']
        
        # Retourner selon la tâche
        if self.task == 'segmentation':
            if mask is not None:
                mask = torch.from_numpy(mask).unsqueeze(0).float() / 255.0
            else:
                mask = torch.zeros(1, img.shape[1], img.shape[2])
            return img, mask, label
        else:
            return img, label
    
    def get_class_distribution(self):
        """Obtenir la distribution des classes"""
        from collections import Counter
        labels = [s['label'] for s in self.samples]
        return Counter(labels)