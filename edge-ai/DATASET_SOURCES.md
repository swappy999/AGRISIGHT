# AgriSight Edge AI — Dataset Sources & Licensing

## Phase 1 Dataset: Crop vs Non-Crop Binary Classifier

### CROP Class

| Source | License | Usage |
|--------|---------|-------|
| [PlantVillage Dataset](https://github.com/spMohanty/PlantVillage-Dataset) | CC BY 4.0 | Leaf images of 14+ crops — tomato, potato, corn, grape, etc. |
| [PlantDoc](https://github.com/pratikkayal/PlantDoc-Dataset) | MIT | Real-field plant disease images |
| Open Images v7 (plants subset) | CC BY 4.0 | Additional in-field crop photos |

**Crop images include:** single leaves, whole plants, crop fields, healthy and diseased specimens, various backgrounds.

### NON_CROP Class (AgriSight Non-Crop Dataset)

| Category | Source | License |
|----------|--------|---------|
| People / Faces / Selfies | Open Images v7 (person subset) | CC BY 4.0 |
| Animals | Open Images v7 (animal subset) | CC BY 4.0 |
| Cars / Vehicles | Open Images v7 | CC BY 4.0 |
| Electronics (phones, laptops) | Open Images v7 | CC BY 4.0 |
| Rooms / Buildings | Open Images v7 | CC BY 4.0 |
| Documents / Text | Open Images v7 | CC BY 4.0 |
| Food (non-plant) | Open Images v7 | CC BY 4.0 |
| Random objects / scenery | Open Images v7 | CC BY 4.0 |

### Download Script

All images downloaded programmatically via `edge-ai/scripts/download_dataset.py`.  
Run `python scripts/download_dataset.py` to reproduce the dataset.

### Dataset Statistics (filled after preprocessing)

```
Total images    : TBD
Crop images     : TBD
Non-crop images : TBD
Train set       : TBD (70%)
Validation set  : TBD (15%)
Test set        : TBD (15%)
```

### Important Notes

- Raw training data is **not** included in the production web assets (`frontend/public/`).
- Only the exported ONNX model is included in the production build.
- All source datasets allow derivative model weights under their respective licenses.
