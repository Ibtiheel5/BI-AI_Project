"""
Classe Trainer pour entraînement du modèle
"""
import torch
import torch.nn as nn
import torch.optim as optim
from tqdm import tqdm
import time
import copy


class Trainer:
    """Classe pour gérer l'entraînement du modèle"""
    
    def __init__(
        self,
        model,
        train_loader,
        val_loader,
        criterion,
        optimizer,
        scheduler=None,
        device='cuda',
        num_epochs=50,
        save_dir='outputs/models'
    ):
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.criterion = criterion
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.device = device
        self.num_epochs = num_epochs
        self.save_dir = save_dir
        
        # Historique
        self.history = {
            'train_loss': [],
            'train_acc': [],
            'val_loss': [],
            'val_acc': [],
            'lr': []
        }
        
        self.best_val_acc = 0.0
        self.best_model_wts = None
    
    def train_epoch(self):
        """Entraîner une epoch"""
        self.model.train()
        running_loss = 0.0
        running_corrects = 0
        total = 0
        
        pbar = tqdm(self.train_loader, desc="Training")
        for inputs, labels in pbar:
            inputs = inputs.to(self.device)
            labels = labels.to(self.device)
            
            # Forward
            self.optimizer.zero_grad()
            outputs = self.model(inputs)
            loss = self.criterion(outputs, labels)
            
            # Backward
            loss.backward()
            self.optimizer.step()
            
            # Statistiques
            _, preds = torch.max(outputs, 1)
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)
            total += labels.size(0)
            
            # Update progress bar
            pbar.set_postfix({
                'loss': f'{loss.item():.4f}',
                'acc': f'{100. * running_corrects.double() / total:.2f}%'
            })
        
        epoch_loss = running_loss / total
        epoch_acc = running_corrects.double() / total
        
        return epoch_loss, epoch_acc.item()
    
    def validate(self):
        """Valider le modèle"""
        self.model.eval()
        running_loss = 0.0
        running_corrects = 0
        total = 0
        
        with torch.no_grad():
            pbar = tqdm(self.val_loader, desc="Validation")
            for inputs, labels in pbar:
                inputs = inputs.to(self.device)
                labels = labels.to(self.device)
                
                outputs = self.model(inputs)
                loss = self.criterion(outputs, labels)
                
                _, preds = torch.max(outputs, 1)
                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)
                total += labels.size(0)
                
                pbar.set_postfix({
                    'loss': f'{loss.item():.4f}',
                    'acc': f'{100. * running_corrects.double() / total:.2f}%'
                })
        
        epoch_loss = running_loss / total
        epoch_acc = running_corrects.double() / total
        
        return epoch_loss, epoch_acc.item()
    
    def train(self):
        """Entraîner le modèle pour num_epochs"""
        print("\n" + "="*60)
        print("🚀 DÉBUT DE L'ENTRAÎNEMENT")
        print("="*60)
        
        start_time = time.time()
        
        for epoch in range(self.num_epochs):
            print(f"\nEpoch {epoch+1}/{self.num_epochs}")
            print("-" * 60)
            
            # Train
            train_loss, train_acc = self.train_epoch()
            
            # Validation
            val_loss, val_acc = self.validate()
            
            # Scheduler
            if self.scheduler:
                if isinstance(self.scheduler, optim.lr_scheduler.ReduceLROnPlateau):
                    self.scheduler.step(val_loss)
                else:
                    self.scheduler.step()
            
            # Sauvegarder historique
            current_lr = self.optimizer.param_groups[0]['lr']
            self.history['train_loss'].append(train_loss)
            self.history['train_acc'].append(train_acc)
            self.history['val_loss'].append(val_loss)
            self.history['val_acc'].append(val_acc)
            self.history['lr'].append(current_lr)
            
            # Affichage
            print(f"\nTrain Loss: {train_loss:.4f} | Train Acc: {train_acc*100:.2f}%")
            print(f"Val Loss:   {val_loss:.4f} | Val Acc:   {val_acc*100:.2f}%")
            print(f"LR: {current_lr:.6f}")
            
            # Sauvegarder meilleur modèle
            if val_acc > self.best_val_acc:
                self.best_val_acc = val_acc
                self.best_model_wts = copy.deepcopy(self.model.state_dict())
                self.save_checkpoint(f'{self.save_dir}/best_model.pth', epoch, is_best=True)
                print(f"✅ Nouveau meilleur modèle! Val Acc: {val_acc*100:.2f}%")
            
            # Sauvegarder checkpoint régulier
            if (epoch + 1) % 5 == 0:
                self.save_checkpoint(f'{self.save_dir}/checkpoint_epoch_{epoch+1}.pth', epoch)
        
        time_elapsed = time.time() - start_time
        print("\n" + "="*60)
        print("🎉 ENTRAÎNEMENT TERMINÉ")
        print("="*60)
        print(f"Temps total: {time_elapsed//60:.0f}m {time_elapsed%60:.0f}s")
        print(f"Meilleure Val Acc: {self.best_val_acc*100:.2f}%")
        
        # Charger meilleur modèle
        self.model.load_state_dict(self.best_model_wts)
        
        return self.history
    
    def save_checkpoint(self, path, epoch, is_best=False):
        """Sauvegarder un checkpoint"""
        import os
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'best_val_acc': self.best_val_acc,
            'history': self.history
        }
        
        if self.scheduler:
            checkpoint['scheduler_state_dict'] = self.scheduler.state_dict()
        
        torch.save(checkpoint, path)
        
        if not is_best:
            print(f"💾 Checkpoint sauvegardé: {path}")