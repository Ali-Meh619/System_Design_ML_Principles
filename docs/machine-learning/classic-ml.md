# Classic Machine Learning

> The foundation for ML interviews: bias-variance tradeoff, tree ensembles, evaluation at scale, class imbalance, and feature engineering. Understand the *why*, not just the API calls.

---

## 1. Bias-Variance Tradeoff

The single most important framework for diagnosing model problems.

| Term | What it means | Symptom |
|------|--------------|---------|
| **Bias** | Model too simple to capture the pattern | High training error **and** high validation error |
| **Variance** | Model too sensitive to training data noise | Low training error, high validation error (overfitting) |
| **Irreducible error** | Noise in the data itself — cannot be reduced | A floor on any model's error |

**The tradeoff:** Reducing bias typically increases variance and vice versa. The goal is to find the sweet spot.

```
Error
  │
  │ Total Error = Bias² + Variance + Irreducible
  │
  │      ↑ Bias²
  │       \        ← sweet spot →   ↗ Variance
  │        \___________________________/
  │
  └─────────────────────────────────────── Model Complexity
   (underfit)                            (overfit)
```

**In interviews:** When asked "your model performs badly," always diagnose:
- Both train/val bad → bias problem → more features, bigger model, less regularization
- Train good/val bad → variance problem → more data, regularization, simpler model

---

## 2. Regularization

Techniques to prevent overfitting by penalizing model complexity.

| Technique | How it works | Effect | Use case |
|-----------|-------------|--------|----------|
| **L2 (Ridge)** | Add `λ·Σw²` to loss | Shrinks all weights toward zero, never to zero | Default choice; handles correlated features well |
| **L1 (Lasso)** | Add `λ·Σ\|w\|` to loss | Drives many weights to exactly zero (sparse) | Feature selection; when you suspect many irrelevant features |
| **Elastic Net** | L1 + L2 combined | Sparse + grouped selection | High-dimensional data with correlated features |
| **Dropout** | Randomly zero out neurons during training | Ensemble effect, prevents co-adaptation | Neural networks |
| **Early stopping** | Stop when validation loss stops improving | Implicit regularization | Any iterative training |

**Key insight:** L1 is sparsity-inducing because the gradient of `|w|` is ±1 regardless of w's magnitude — it applies the same force whether w = 0.001 or w = 10. L2's gradient `2λw` goes to zero as w approaches zero, so it never fully eliminates weights.

---

## 3. Evaluation Metrics

Choosing the wrong metric is as bad as choosing the wrong model.

### Classification Metrics

| Metric | Formula | When to use |
|--------|---------|-------------|
| **Accuracy** | (TP+TN)/(Total) | Balanced classes only; misleading otherwise |
| **Precision** | TP/(TP+FP) | When false positives are costly (spam filter — don't flag legit emails) |
| **Recall** | TP/(TP+FN) | When false negatives are costly (cancer detection — don't miss disease) |
| **F1-Score** | 2·(P·R)/(P+R) | Balance precision and recall; imbalanced classes |
| **ROC-AUC** | Area under ROC curve | Model ranking ability across all thresholds; good for imbalanced |
| **PR-AUC** | Area under Precision-Recall curve | Better than ROC-AUC for *severely* imbalanced datasets |
| **Log Loss** | -Σ y·log(p) | When calibrated probabilities matter (e.g., click-through rate) |

### The Confusion Matrix

```
                  Predicted
              Positive | Negative
Actual Pos |    TP    |    FN    ← recall = TP/(TP+FN)
Actual Neg |    FP    |    TN
                ↑
          precision = TP/(TP+FP)
```

### Regression Metrics

| Metric | Formula | Notes |
|--------|---------|-------|
| **MAE** | mean(\|y - ŷ\|) | Robust to outliers; same units as target |
| **RMSE** | sqrt(mean((y-ŷ)²)) | Penalizes large errors more; sensitive to outliers |
| **R²** | 1 - SS_res/SS_tot | Fraction of variance explained; 1.0 is perfect |
| **MAPE** | mean(\|y-ŷ\|/y)·100 | Percentage error; fails when y=0 |

**Interview tip:** Always ask "what's the cost of each error type?" before picking a metric.

---

## 4. Decision Trees & Ensembles

### Decision Trees

Trees split data by the feature/threshold that maximizes **information gain** (classification) or minimizes **MSE** (regression).

- **Splitting criteria:**
  - **Gini impurity:** `1 - Σp²ᵢ` — computationally cheaper
  - **Information Gain / Entropy:** `-Σpᵢ·log(pᵢ)` — slightly better splits
- **Overfitting control:** `max_depth`, `min_samples_leaf`, `min_samples_split`

### Random Forests

Bagging (Bootstrap Aggregating) + random feature selection = Random Forest.

```
Training data
     │  Bootstrap sample (with replacement) × n_estimators
     ▼
[Tree 1]  [Tree 2]  ...  [Tree N]   ← each trained on ~63% of data
     │        │               │        each split: random subset of features
     └────────┴───────────────┘
                   │
              Majority vote (classification) / Average (regression)
```

- **Key hyperparameters:** `n_estimators`, `max_features` (sqrt for classification, log2 or all for regression), `max_depth`
- **Out-of-bag (OOB) error:** ~37% of data not used per tree → free validation signal
- **Feature importance:** Mean decrease in impurity across all trees

### Gradient Boosting (XGBoost / LightGBM)

Boosting builds trees **sequentially**, each one correcting the errors of the previous ensemble.

```
F₀(x) = base prediction (e.g., mean)
F₁(x) = F₀(x) + η·h₁(x)    ← h₁ fits residuals of F₀
F₂(x) = F₁(x) + η·h₂(x)    ← h₂ fits residuals of F₁
...
```

Where `η` = learning rate (shrinkage).

| | Random Forest | Gradient Boosting |
|-|--------------|-------------------|
| Training | Parallel | Sequential |
| Speed | Faster to train | Slower; XGBoost/LightGBM are highly optimized |
| Performance | Good baseline | Usually wins on tabular data |
| Overfitting | Hard to overfit | Can overfit; needs careful tuning |
| Key params | `n_estimators`, `max_features` | `n_estimators`, `learning_rate`, `max_depth`, `subsample` |

**XGBoost vs LightGBM:**

| | XGBoost | LightGBM |
|-|---------|----------|
| Split strategy | Level-wise (breadth-first) | Leaf-wise (best-first) |
| Speed | Solid | Faster for large datasets |
| Memory | Higher | Lower (histogram binning) |
| Best for | General purpose | Large datasets, high cardinality categoricals |

---

## 5. Support Vector Machines (SVM)

SVMs find the **maximum-margin hyperplane** separating classes. The margin is the gap between the plane and the nearest data points (support vectors).

```
         ○ ○ ○
          ○  ←── Support vectors
    ─────────────  ← optimal hyperplane (max margin)
          ●  ←── Support vectors
         ● ● ●
```

### The Kernel Trick

Real data is rarely linearly separable. Kernels map data to higher dimensions without computing the transformation explicitly.

| Kernel | Formula | Use case |
|--------|---------|----------|
| **Linear** | `x·x'` | Linearly separable data; text classification (high-dim sparse) |
| **RBF (Gaussian)** | `exp(-γ‖x-x'‖²)` | Most common; non-linear; sensitive to feature scaling |
| **Polynomial** | `(γx·x'+r)^d` | Image features, NLP |

**Key hyperparameters:**
- `C`: Regularization. High C → hard margin (low bias, high variance). Low C → soft margin (high bias, low variance).
- `γ` (RBF): High γ → small influence radius → complex boundaries (overfit). Low γ → smoother.

**When to use SVM:** Small-to-medium datasets, high-dimensional data (text), when interpretability is not required.

---

## 6. Logistic Regression

Despite the name, it's a **classification** algorithm. The output is a probability via the sigmoid function.

```
P(y=1|x) = σ(w·x + b) = 1 / (1 + exp(-(w·x + b)))
```

- **Loss:** Binary Cross-Entropy = `-y·log(p) - (1-y)·log(1-p)`
- **Multiclass:** Softmax extends this: `P(y=k|x) = exp(wₖ·x) / Σⱼ exp(wⱼ·x)`

**Why use it?**
- Highly interpretable: coefficient = log-odds change per unit increase in feature
- Fast, scales to millions of samples
- Calibrated probabilities out of the box
- Strong baseline for any classification problem

**Assumptions:** Linearly separable classes (in feature space), no multicollinearity, features roughly scaled.

---

## 7. K-Means Clustering

Unsupervised algorithm that partitions n observations into k clusters by minimizing within-cluster variance.

**Algorithm:**
```
1. Initialize k centroids randomly (or K-means++ for better initialization)
2. Assign each point to nearest centroid
3. Recompute centroids as mean of assigned points
4. Repeat 2-3 until convergence
```

**Choosing k — The Elbow Method:**
Plot inertia (within-cluster sum of squares) vs k. The "elbow" is where adding more clusters gives diminishing returns. Also use **Silhouette Score** (−1 to 1, higher = better separation).

**Limitations:**
- Assumes spherical, equal-sized clusters
- Sensitive to outliers (consider K-Medoids instead)
- Must specify k upfront
- Fails on non-convex cluster shapes (use DBSCAN for those)

---

## 8. Dimensionality Reduction: PCA

PCA finds the directions (**principal components**) of maximum variance in the data and projects data onto them.

```
Original features (high-dim) → PCA transformation → New axes (lower-dim)
```

**How it works:**
1. Standardize features (zero mean, unit variance)
2. Compute covariance matrix
3. Eigen-decompose to get eigenvectors (principal components) and eigenvalues (variance explained)
4. Keep top-k components

**Key concepts:**
- **Explained variance ratio:** How much total variance does each component capture? Choose k where cumulative variance ≥ 95%.
- **Linear transformation only:** PCA cannot capture non-linear structure (use t-SNE / UMAP for visualization)

**When to use:** Remove multicollinearity before linear models, speed up training, reduce storage. Not great for interpretability.

---

## 9. Cross-Validation

Robust way to estimate generalization performance without wasting data.

| Method | How it works | Use case |
|--------|-------------|----------|
| **k-Fold CV** | Split into k folds; train on k-1, test on 1; repeat | Standard; k=5 or 10 |
| **Stratified k-Fold** | Preserve class distribution in each fold | Imbalanced classification |
| **Leave-One-Out (LOO)** | k = n; expensive but lowest bias | Very small datasets |
| **Time-Series Split** | Only use past data to predict future | Any temporal data — critical to avoid leakage |

**Train / Validation / Test split philosophy:**
- Train: model learns from this
- Validation: hyperparameter tuning, model selection
- Test: final unbiased evaluation — touch it **once**

---

## 10. Class Imbalance

Real-world datasets are often skewed (e.g., fraud detection: 0.1% positive).

| Strategy | How | When to use |
|---------|-----|-------------|
| **Class weights** | Penalize minority errors more in loss: `weight = n_majority / n_minority` | Always try first — zero cost |
| **Oversampling (SMOTE)** | Synthesize new minority samples by interpolating between existing ones | Moderate imbalance; avoid for high-dimensional data |
| **Undersampling** | Randomly remove majority samples | When majority class is huge; risks losing information |
| **Threshold tuning** | Move decision boundary from 0.5 to optimize precision/recall | Any probabilistic classifier |
| **Use PR-AUC / F1** | ROC-AUC hides imbalance problems | Always with imbalanced data |

**SMOTE in brief:** For each minority sample, find k nearest minority neighbors, generate synthetic sample along the connecting line segment.

---

## 11. Feature Engineering

Often more impactful than algorithm choice.

### Encoding Categorical Variables

| Method | How | Use case |
|--------|-----|----------|
| **One-Hot Encoding** | Binary column per category | Low cardinality (< 20 categories), linear models |
| **Label Encoding** | Map category to integer | Tree models only (they handle arbitrary orderings) |
| **Target Encoding** | Replace category with mean target value | High cardinality; use with regularization to avoid leakage |
| **Hashing** | Map to fixed-size vector via hash function | Very high cardinality, online learning |

### Handling Missing Values

| Strategy | When |
|---------|------|
| **Mean/Median imputation** | MCAR (missing completely at random); fast baseline |
| **Mode imputation** | Categorical features |
| **Model imputation** | Missing Not At Random; use other features to predict |
| **Add indicator column** | When "missingness" itself is informative |
| **Drop** | Only if < 5% missing and MCAR |

### Feature Scaling

- **StandardScaler:** Zero mean, unit variance. Required for: SVM, logistic regression, PCA, KNN.
- **MinMaxScaler:** Scale to [0,1]. Use when data has bounded range or for neural networks.
- **RobustScaler:** Uses median and IQR. Use when outliers are present.
- **Trees don't need scaling** — splits are monotone-invariant.

---

## 12. Hyperparameter Tuning

| Method | How | Pros/Cons |
|--------|-----|-----------|
| **Grid Search** | Try every combination | Exhaustive; exponential in dimensionality |
| **Random Search** | Sample random combinations | Surprisingly effective; more efficient than grid for >3 params |
| **Bayesian Optimization** | Build surrogate model of objective, sample where improvement expected | Most sample-efficient; use Optuna or Hyperopt |
| **Halving / Successive Elimination** | Early-stop bad configs | Fast; built into scikit-learn |

**Rule of thumb:** Random search beats grid search in high-dimensional parameter spaces (Bergstra & Bengio, 2012). Use Bayesian optimization when evaluation is expensive.

---

## Interview Quick-Reference

**"Your model is overfitting, what do you do?"**
→ More training data → add regularization (L2) → reduce model complexity → dropout / early stopping → feature selection to remove noise

**"Your model has high bias, what do you do?"**
→ More features / better features → bigger model → reduce regularization → add polynomial/interaction terms

**"How do you handle imbalanced data?"**
→ class_weight='balanced' first → tune threshold → SMOTE if needed → use F1/PR-AUC metrics

**"Explain XGBoost vs Random Forest"**
→ RF: parallel bagging, each tree independent, robust, slower to improve with more trees. XGBoost: sequential boosting, each tree fixes previous errors, usually higher accuracy on tabular data, more hyperparameters to tune.

**"What feature importance methods exist?"**
→ Tree-based (mean decrease impurity — fast but biased toward high cardinality), Permutation importance (model-agnostic, unbiased), SHAP values (local + global, most reliable).
