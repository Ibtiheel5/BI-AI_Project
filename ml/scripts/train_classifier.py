"""
Script d'entraînement optimisé pour dataset_500
"""
import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm
import time
import copy

# Ajouter le chemin src/
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.data.dataloader import create_dataloaders
from src.models.classifier import create_model
from src.training.metrics import calculate_metrics, get_confusion_matrix

# ========== OPTIMISATIONS CPU ==========
torch.set_num_threads(4)
torch.backends.cudnn.enabled = False


def plot_training_history(history, save_path='outputs/plots/training_curves.png'):
    """Tracer les courbes d'entraînement"""
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    fig, axes = plt.subplots(1, 2, figsize=(15, 5))
    
    # Loss
    axes[0].plot(history['train_loss'], label='Train Loss', linewidth=2, color='#3498db')
    axes[0].plot(history['val_loss'], label='Val Loss', linewidth=2, color='#e74c3c')
    axes[0].set_xlabel('Epoch', fontsize=12)
    axes[0].set_ylabel('Loss', fontsize=12)
    axes[0].set_title('Training and Validation Loss', fontsize=14, fontweight='bold')
    axes[0].legend(fontsize=11)
    axes[0].grid(True, alpha=0.3)
    
    # Accuracy
    axes[1].plot([acc*100 for acc in history['train_acc']], label='Train Acc', linewidth=2, color='#3498db')
    axes[1].plot([acc*100 for acc in history['val_acc']], label='Val Acc', linewidth=2, color='#e74c3c')
    axes[1].set_xlabel('Epoch', fontsize=12)
    axes[1].set_ylabel('Accuracy (%)', fontsize=12)
    axes[1].set_title('Training and Validation Accuracy', fontsize=14, fontweight='bold')
    axes[1].legend(fontsize=11)
    axes[1].grid(True, alpha=0.3)
    
    # Ligne du meilleur score
    best_val_acc = max(history['val_acc'])
    axes[1].axhline(y=best_val_acc*100, color='green', linestyle='--', alpha=0.5, 
                    label=f'Best: {best_val_acc*100:.2f}%')
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"Courbes sauvegardées: {save_path}")
    plt.close()


def plot_confusion_matrix(cm, class_names, accuracy, save_path='outputs/plots/confusion_matrix.png'):
    """Tracer la matrice de confusion"""
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    plt.figure(figsize=(14, 12))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=class_names,
                yticklabels=class_names,
                cbar_kws={'label': 'Count'})
    plt.title(f'Confusion Matrix - Test Accuracy: {accuracy*100:.2f}%', 
              fontsize=16, fontweight='bold', pad=20)
    plt.ylabel('True Label', fontsize=12)
    plt.xlabel('Predicted Label', fontsize=12)
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"Matrice de confusion sauvegardée: {save_path}")
    plt.close()


def train_epoch(model, loader, criterion, optimizer, device, accumulation_steps=4):
    """Entraîner une epoch avec gradient accumulation"""
    model.train()
    running_loss = 0.0
    running_corrects = 0
    total = 0
    
    optimizer.zero_grad()
    
    pbar = tqdm(loader, desc="Training", ncols=100)
    for i, (inputs, labels) in enumerate(pbar):
        inputs = inputs.to(device)
        labels = labels.to(device)
        
        # Forward
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss = loss / accumulation_steps
        
        # Backward
        loss.backward()
        
        # Update weights every N steps
        if (i + 1) % accumulation_steps == 0:
            optimizer.step()
            optimizer.zero_grad()
        
        # Stats
        _, preds = torch.max(outputs, 1)
        running_loss += loss.item() * inputs.size(0) * accumulation_steps
        running_corrects += torch.sum(preds == labels.data)
        total += labels.size(0)
        
        pbar.set_postfix({
            'loss': f'{loss.item() * accumulation_steps:.4f}',
            'acc': f'{100. * running_corrects.double() / total:.2f}%'
        })
    
    return running_loss / total, (running_corrects.double() / total).item()


def validate(model, loader, criterion, device):
    """Valider le modèle"""
    model.eval()
    running_loss = 0.0
    running_corrects = 0
    total = 0
    
    with torch.no_grad():
        pbar = tqdm(loader, desc="Validation", ncols=100)
        for inputs, labels in pbar:
            inputs = inputs.to(device)
            labels = labels.to(device)
            
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            _, preds = torch.max(outputs, 1)
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)
            total += labels.size(0)
            
            pbar.set_postfix({
                'loss': f'{loss.item():.4f}',
                'acc': f'{100. * running_corrects.double() / total:.2f}%'
            })
    
    return running_loss / total, (running_corrects.double() / total).item()


def main():
    # ========== CONFIGURATION ==========
    CONFIG = {
        'data_dir': r'C:\Users\asus\Desktop\dataset_500',  # ← DATASET 500
        'batch_size': 16,
        'img_size': 224,
        'num_workers': 2,
        'num_epochs': 30,  # 30 époques suffisent avec 500 img/classe
        'learning_rate': 0.001,
        'weight_decay': 0.0001,
        'dropout': 0.5,
        'pretrained': True,
        'device': 'cpu',
        'seed': 42,
        'gradient_accumulation_steps': 4
    }
    
    print("\n" + "="*70)
    print("ENTRAINEMENT CLASSIFICATEUR - 500 IMAGES/CLASSE")
    print("="*70)
    print("\nConfiguration:")
    for key, value in CONFIG.items():
        print(f"  {key}: {value}")
    print("\nTemps estimé: 4-6 heures")
    print("Accuracy attendue: 83-86%")
    print()
    
    # Vérifier que le dataset existe
    if not os.path.exists(CONFIG['data_dir']):
        print(f"\nERRRUR: Dataset introuvable!")
        print(f"Chemin: {CONFIG['data_dir']}")
        print("\nAssurez-vous d'avoir créé le dataset_500 avec le script de réduction.")
        return
    
    # Seed
    torch.manual_seed(CONFIG['seed'])
    
    # ========== DONNÉES ==========
    print("\nChargement des données...")
    train_loader, val_loader, test_loader, class_names = create_dataloaders(
        root_dir=CONFIG['data_dir'],
        batch_size=CONFIG['batch_size'],
        img_size=CONFIG['img_size'],
        num_workers=CONFIG['num_workers'],
        task='classification',
        seed=CONFIG['seed']
    )
    
    num_classes = len(class_names)
    total_images = len(train_loader.dataset)
    
    print(f"\nDataset chargé:")
    print(f"  Classes: {num_classes}")
    print(f"  Images totales: {total_images:,}")
    print(f"  Images/classe: ~{total_images // num_classes}")
    print(f"  Classes: {class_names}")
    
    # ========== MODÈLE ==========
    print("\nCréation du modèle...")
    model = create_model(
        num_classes=num_classes,
        pretrained=CONFIG['pretrained'],
        dropout=CONFIG['dropout'],
        device=CONFIG['device']
    )
    
    # Fine-tuning partiel (geler backbone)
    print("Fine-tuning partiel (gel du backbone)")
    for param in model.backbone.parameters():
        param.requires_grad = False
    for param in model.backbone.fc.parameters():
        param.requires_grad = True
    
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"Paramètres totaux: {total_params:,}")
    print(f"Paramètres entraînables: {trainable_params:,} ({trainable_params/total_params*100:.1f}%)")
    
    # ========== TRAINING SETUP ==========
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=CONFIG['learning_rate'],
        weight_decay=CONFIG['weight_decay']
    )
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer,
        mode='min',
        patience=3,
        factor=0.5
    )
    
    # ========== ENTRAÎNEMENT ==========
    print("\n" + "="*70)
    print("DÉBUT ENTRAÎNEMENT")
    print("="*70)
    print("Laissez tourner sans interruption")
    print()
    
    history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': []}
    best_val_acc = 0.0
    best_model_wts = None
    
    start_time = time.time()
    
    for epoch in range(CONFIG['num_epochs']):
        print(f"\n{'='*70}")
        print(f"Epoch {epoch+1}/{CONFIG['num_epochs']}")
        print(f"{'='*70}")
        
        # Train
        train_loss, train_acc = train_epoch(
            model, train_loader, criterion, optimizer,
            CONFIG['device'], CONFIG['gradient_accumulation_steps']
        )
        
        # Validation
        val_loss, val_acc = validate(model, val_loader, criterion, CONFIG['device'])
        
        # Scheduler
        scheduler.step(val_loss)
        
        # Historique
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)
        
        current_lr = optimizer.param_groups[0]['lr']
        
        # Affichage
        print(f"\nRésultats Epoch {epoch+1}:")
        print(f"  Train Loss: {train_loss:.4f} | Train Acc: {train_acc*100:.2f}%")
        print(f"  Val Loss:   {val_loss:.4f}   | Val Acc:   {val_acc*100:.2f}%")
        print(f"  Learning Rate: {current_lr:.6f}")
        
        # Sauvegarder meilleur
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_wts = copy.deepcopy(model.state_dict())
            os.makedirs('outputs/models', exist_ok=True)
            torch.save(model.state_dict(), 'outputs/models/best_model.pth')
            print(f"  Nouveau meilleur modèle! Val Acc: {val_acc*100:.2f}%")
        
        # Estimation temps
        elapsed = time.time() - start_time
        avg_time = elapsed / (epoch + 1)
        remaining = avg_time * (CONFIG['num_epochs'] - epoch - 1)
        print(f"  Temps écoulé: {elapsed/3600:.1f}h | Restant: {remaining/3600:.1f}h")
    
    total_time = time.time() - start_time
    
    print("\n" + "="*70)
    print("ENTRAÎNEMENT TERMINÉ!")
    print("="*70)
    print(f"Temps total: {total_time/3600:.1f}h ({total_time/60:.0f} min)")
    print(f"Meilleure Val Acc: {best_val_acc*100:.2f}%")
    
    # Charger meilleur modèle
    model.load_state_dict(best_model_wts)
    
    # ========== VISUALISATIONS ==========
    print("\nGénération des graphiques...")
    plot_training_history(history)
    
    # ========== ÉVALUATION FINALE ==========
    print("\n" + "="*70)
    print("ÉVALUATION FINALE SUR TEST SET")
    print("="*70)
    
    print("\nCalcul des métriques...")
    metrics = calculate_metrics(model, test_loader, CONFIG['device'])
    
    print("\nRésultats:")
    print(f"  Accuracy:  {metrics['accuracy']*100:.2f}%")
    print(f"  Precision: {metrics['precision']*100:.2f}%")
    print(f"  Recall:    {metrics['recall']*100:.2f}%")
    print(f"  F1-Score:  {metrics['f1']*100:.2f}%")
    
    # Performance par classe
    print("\nPerformance par classe:")
    from sklearn.metrics import classification_report
    report = classification_report(
        metrics['labels'], 
        metrics['predictions'], 
        target_names=class_names,
        digits=2
    )
    print(report)
    
    # Matrice de confusion
    cm = get_confusion_matrix(metrics['labels'], metrics['predictions'], class_names)
    plot_confusion_matrix(cm, class_names, metrics['accuracy'])
    
    # ========== SAUVEGARDE FINALE ==========
    final_checkpoint = {
        'model_state_dict': model.state_dict(),
        'class_names': class_names,
        'num_classes': num_classes,
        'config': CONFIG,
        'history': history,
        'test_metrics': {
            'accuracy': metrics['accuracy'],
            'precision': metrics['precision'],
            'recall': metrics['recall'],
            'f1': metrics['f1']
        },
        'training_time_hours': total_time / 3600
    }
    
    os.makedirs('outputs/models', exist_ok=True)
    final_model_path = 'outputs/models/final_model_500_complete.pth'
    torch.save(final_checkpoint, final_model_path)
    print(f"\nModèle final sauvegardé: {final_model_path}")
    
    # ========== RÉSUMÉ FINAL ==========
    print("\n" + "="*70)
    print("TOUT EST TERMINÉ!")
    print("="*70)
    print(f"\nFichiers générés:")
    print(f"  outputs/models/final_model_500_complete.pth (~90 MB)")
    print(f"  outputs/models/best_model.pth (~90 MB)")
    print(f"  outputs/plots/training_curves.png")
    print(f"  outputs/plots/confusion_matrix.png")
    print(f"\nPerformance finale:")
    print(f"  Test Accuracy: {metrics['accuracy']*100:.2f}%")
    print(f"  Temps total: {total_time/3600:.1f}h")
    print(f"  Meilleure Val Acc: {best_val_acc*100:.2f}%")
    print(f"\nProchaine étape:")
    print(f"  Copier final_model_500_complete.pth vers backend/saved_models/")
    print(f"  Lancer le backend: cd backend && python main.py")
    print("="*70)
    
    print("\nEntraînement terminé avec succès!")


if __name__ == '__main__':
    main()