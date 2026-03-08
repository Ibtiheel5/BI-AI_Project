# On utilise une image officielle PyTorch (qui contient déjà Python et CUDA)
FROM pytorch/pytorch:2.2.0-cuda12.1-cudnn8-runtime

WORKDIR /app

# Installation des dépendances système pour OpenCV
RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# On copie le reste du code
COPY . .

# Commande par défaut
CMD ["python", "scripts/train_classifier.py"]