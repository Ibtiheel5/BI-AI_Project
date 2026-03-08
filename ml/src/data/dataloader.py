"""
Création des DataLoaders PyTorch
"""
from torch.utils.data import DataLoader
from .dataset import ChestXrayDataset
from .transforms import get_train_transforms, get_val_transforms, get_test_transforms


def create_dataloaders(
    root_dir,
    batch_size=32,
    img_size=224,
    num_workers=4,
    task='classification',
    seed=42
):
    """
    Créer les DataLoaders pour train/val/test
    
    Args:
        root_dir: Chemin vers dataset_by_disease/
        batch_size: Taille du batch
        img_size: Taille des images (après resize)
        num_workers: Nombre de workers pour chargement
        task: 'classification' ou 'segmentation'
        seed: Seed pour reproductibilité
    
    Returns:
        train_loader, val_loader, test_loader, class_names
    """
    
    print("\n" + "="*60)
    print("🔄 CRÉATION DES DATALOADERS")
    print("="*60)
    
    # Créer les datasets
    train_dataset = ChestXrayDataset(
        root_dir=root_dir,
        split='train',
        transform=get_train_transforms(img_size),
        task=task,
        seed=seed
    )
    
    val_dataset = ChestXrayDataset(
        root_dir=root_dir,
        split='val',
        transform=get_val_transforms(img_size),
        task=task,
        seed=seed
    )
    
    test_dataset = ChestXrayDataset(
        root_dir=root_dir,
        split='test',
        transform=get_test_transforms(img_size),
        task=task,
        seed=seed
    )
    
    # Créer les DataLoaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )
    
    # Distribution des classes
    print("\n📊 Distribution des classes:")
    train_dist = train_dataset.get_class_distribution()
    for idx, count in sorted(train_dist.items()):
        class_name = train_dataset.idx_to_class[idx]
        print(f"  {class_name}: {count} images")
    
    print("\n✅ DataLoaders créés avec succès!")
    print(f"  Train: {len(train_dataset)} images ({len(train_loader)} batches)")
    print(f"  Val: {len(val_dataset)} images ({len(val_loader)} batches)")
    print(f"  Test: {len(test_dataset)} images ({len(test_loader)} batches)")
    
    return train_loader, val_loader, test_loader, train_dataset.classes