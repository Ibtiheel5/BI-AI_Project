"""
patch_lung_cancer_checkpoint.py
================================
Fixes the broken class names in final_lung_cancer_model.pth
WITHOUT retraining.

The original checkpoint has:
  class_names = ['Test cases', 'The IQ-OTHNCCD lung cancer dataset']

This script remaps them to clinically meaningful names and saves a
corrected checkpoint.

Usage:
  python patch_lung_cancer_checkpoint.py

Output:
  saved_models/final_lung_cancer_model_patched.pth

⚠️  IMPORTANT — read before running:
  This patch only makes sense if the two original dataset folders
  genuinely correspond to distinct pathological classes.
  
  The IQ-OTH/NCCD dataset has 3 classes in most Kaggle versions:
    • Malignant  (~561 CT images)
    • Benign     (~120 CT images)  
    • Normal     (~416 CT images)

  BUT the broken model only saw 2 folders, which means it may have
  been trained on a re-upload where the dataset was split differently.
  Check the mapping below and correct if needed BEFORE running.
  
  Also note: 100% test accuracy on 2 classes is suspicious and likely
  means the model memorised dataset-split artefacts, not real pathology.
  Retraining with the fixed notebook is strongly recommended.
"""

import torch
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────────────────

CHECKPOINT_IN  = Path("saved_models/final_lung_cancer_model.pth")
CHECKPOINT_OUT = Path("saved_models/final_lung_cancer_model_patched.pth")

# Map old (wrong) class names → correct clinical names.
# The order must be preserved — index 0 stays 0, index 1 stays 1.
# Adjust the mapping below if your dataset used different folders.
CLASS_REMAP = {
    "Test cases"                        : "Benign",    # index 0 → Benign
    "The IQ-OTHNCCD lung cancer dataset": "Malignant", # index 1 → Malignant
    # Add more rows here if needed
}

# ── Load ───────────────────────────────────────────────────────────────────

if not CHECKPOINT_IN.exists():
    raise FileNotFoundError(
        f"Checkpoint not found: {CHECKPOINT_IN}\n"
        f"Run this script from your backend/ directory."
    )

print(f"Loading: {CHECKPOINT_IN}")
ckpt = torch.load(str(CHECKPOINT_IN), map_location="cpu", weights_only=False)

old_names = ckpt.get("class_names") or ckpt.get("class_labels", [])
print(f"\nOriginal class_names : {old_names}")
print(f"num_classes          : {ckpt.get('num_classes')}")
print(f"test_metrics         : {ckpt.get('test_metrics')}")

# ── Remap ──────────────────────────────────────────────────────────────────

new_names = []
for name in old_names:
    mapped = CLASS_REMAP.get(name)
    if mapped is None:
        print(f"\n⚠️  No mapping found for '{name}'. Keeping as-is.")
        print("   Add it to CLASS_REMAP in this script before patching.")
        mapped = name
    new_names.append(mapped)
    print(f"  '{name}' → '{mapped}'")

# ── Sanity check ───────────────────────────────────────────────────────────

if new_names == old_names:
    print("\n⚠️  No changes were made (all names already correct or unmapped).")
    print("   Either the checkpoint is already fixed, or CLASS_REMAP needs updating.")
else:
    print(f"\nNew class_names : {new_names}")

# ── Save patched checkpoint ────────────────────────────────────────────────

ckpt["class_names"] = new_names
ckpt["num_classes"] = len(new_names)

# Keep class_labels in sync if it exists
if "class_labels" in ckpt:
    ckpt["class_labels"] = new_names

# Mark the patch in metadata
ckpt["patched"] = True
ckpt["patch_note"] = (
    f"class_names patched from {old_names} to {new_names} "
    f"by patch_lung_cancer_checkpoint.py. "
    f"Model weights unchanged. "
    f"NOTE: retraining is recommended for production use."
)

torch.save(ckpt, str(CHECKPOINT_OUT))

size_mb = CHECKPOINT_OUT.stat().st_size / (1024 * 1024)
print(f"\n✅ Patched checkpoint saved: {CHECKPOINT_OUT}")
print(f"   Size        : {size_mb:.1f} MB")
print(f"   class_names : {new_names}")
print(f"   num_classes : {len(new_names)}")

# ── Verify ─────────────────────────────────────────────────────────────────

v = torch.load(str(CHECKPOINT_OUT), map_location="cpu", weights_only=False)
assert v["class_names"] == new_names, "Verification failed: class_names mismatch"
assert v["num_classes"] == len(new_names), "Verification failed: num_classes mismatch"
print("\n✅ Verification passed")

print(f"""
Next steps
──────────
Option A — Use the patched checkpoint (quick but not ideal):
  1. Rename the file:
       mv saved_models/final_lung_cancer_model_patched.pth \\
          saved_models/final_lung_cancer_model.pth
  2. Restart your backend (uvicorn).
  3. The model will now predict 'Benign' / 'Malignant' instead of
     the broken dataset folder names.
  ⚠️  The weights are unchanged — if the model memorised folder artefacts
     (likely given 100% test accuracy), predictions may not be reliable.

Option B — Retrain properly (recommended):
  1. Upload kaggle_lung_cancer_fixed.ipynb to Kaggle.
  2. Add the IQ-OTH/NCCD dataset and run all cells.
  3. Download final_lung_cancer_model.pth and copy it to saved_models/.
""")