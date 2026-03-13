"""
Modèle de classification basé sur ResNet50
Compatible avec le checkpoint Kaggle (19 classes NIH ou 4 classes COVID)
"""
import torch
import torch.nn as nn
import torchvision.models as models


class ChestXrayClassifier(nn.Module):
    """
    Classificateur de radiographies thoraciques — ResNet50 backbone.
    Supporte N classes dynamiquement (4 ou 19 selon le checkpoint chargé).
    """

    def __init__(self, num_classes: int, pretrained: bool = True, dropout: float = 0.5):
        super().__init__()

        # ── Backbone ResNet50 ────────────────────────────────────────────
        if pretrained:
            weights = models.ResNet50_Weights.IMAGENET1K_V1
        else:
            weights = None

        self.backbone = models.resnet50(weights=weights)

        # ── Remplacer la tête de classification ─────────────────────────
        in_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(in_features, num_classes)
        )

        self._num_classes = num_classes

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)

    @property
    def num_classes(self) -> int:
        return self._num_classes

    def count_parameters(self) -> int:
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

    def freeze_backbone(self):
        """Gèle toutes les couches sauf la tête FC (fine-tuning partiel)."""
        for param in self.backbone.parameters():
            param.requires_grad = False
        for param in self.backbone.fc.parameters():
            param.requires_grad = True

    def unfreeze_backbone(self):
        """Dégèle tout le réseau."""
        for param in self.parameters():
            param.requires_grad = True


def create_model(
    num_classes: int,
    pretrained: bool = True,
    dropout: float = 0.5,
    device: str = 'cpu'
) -> ChestXrayClassifier:
    """Factory — crée et place le modèle sur le bon device."""
    model = ChestXrayClassifier(
        num_classes=num_classes,
        pretrained=pretrained,
        dropout=dropout
    )
    return model.to(device)