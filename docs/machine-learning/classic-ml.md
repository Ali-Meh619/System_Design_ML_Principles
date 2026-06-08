# Classic Machine Learning

> The foundation for ML interviews: bias-variance tradeoff, tree ensembles, evaluation at scale, class imbalance, feature engineering, and data leakage. Understand the *why*, not just the API calls.

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

### Bagging vs Boosting — The Core Difference

Understanding the distinction between these two ensemble strategies is one of the most common ML interview topics.

| Dimension | Bagging | Boosting |
|-----------|---------|---------|
| **Build order** | Parallel — independent models | Sequential — each model learns from previous errors |
| **Goal** | Reduce **variance** | Reduce **bias** |
| **Data sampling** | Bootstrap (random with replacement) | Weighted — misclassified samples get higher weight |
| **Combining** | Uniform average / majority vote | Weighted vote (better models count more) |
| **Overfitting risk** | Low — averaging smooths noise | Higher — can overfit noisy data |
| **Best for** | High-variance models (deep trees) | High-bias models (shallow trees / stumps) |
| **Main algorithm** | Random Forest | AdaBoost, Gradient Boosting, XGBoost |

**Intuition:** Bagging is like asking 100 independent experts and taking a majority vote — outlier opinions cancel out. Boosting is like having each new expert focus specifically on the cases the previous experts got wrong.

```
Bagging:
Data → [Sample 1] → Tree 1 ─┐
     → [Sample 2] → Tree 2 ─┤→ Average/Vote → Final prediction
     → [Sample 3] → Tree 3 ─┘

Boosting:
Data → Tree 1 → Find errors → reweight
     → Tree 2 (focuses on errors of Tree 1) → Find errors → reweight
     → Tree 3 (focuses on errors of Trees 1+2) → ...
     → Weighted combination → Final prediction
```

**AdaBoost in brief:** After each weak learner, increase weights of misclassified samples exponentially. Each learner's vote is weighted by `0.5 · ln((1-error)/error)` — better learners get larger voting weights.

**Why does boosting reduce bias?** Each sequential model explicitly targets the residual error of the current ensemble. The final model can capture complex patterns that a single high-bias model cannot.

---

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

## 5. Naive Bayes

A probabilistic classifier based on Bayes' theorem with the **naive** assumption that features are conditionally independent given the class.

```
P(y|x₁,...,xₙ) ∝ P(y) · ∏ P(xᵢ|y)
```

### Why "Naive"?

The independence assumption is almost never true in practice (e.g., word frequencies in text are correlated), yet Naive Bayes works surprisingly well because:
- Classification only needs the **most probable class**, not calibrated probabilities
- Errors in individual feature probabilities often cancel out
- With limited data, fewer parameters to estimate = lower variance

### Variants

| Variant | Distribution assumed | Use case |
|---------|---------------------|----------|
| **Gaussian NB** | Features are continuous, normally distributed | Real-valued features |
| **Multinomial NB** | Features are counts (word frequencies) | Text classification (bag-of-words, TF-IDF) |
| **Bernoulli NB** | Features are binary (word present/absent) | Short text, binary features |
| **Complement NB** | Corrects for imbalanced classes | Imbalanced text classification |

### When Naive Bayes Shines

- **Text classification** (spam detection, sentiment) — the classic use case
- **Very fast** training and inference: O(n·d) where n = samples, d = features
- Works well with **high-dimensional sparse data** (thousands of features, few samples)
- Strong baseline that's hard to beat with small datasets

### When It Fails

- Highly correlated features violate the independence assumption badly
- Cannot learn feature interactions (unlike trees or neural networks)
- Probability estimates are poorly calibrated (confidences are extreme)

**Interview tip:** Naive Bayes is the go-to answer for "What's a simple baseline for text classification?" It's also a great example of a high-bias, low-variance model — complements the bias-variance discussion.

---

## 6. K-Nearest Neighbors (KNN)

A non-parametric, instance-based algorithm: store all training data, classify new points by majority vote of their k nearest neighbors.

```
1. Compute distance from query point to all training points
2. Select k nearest neighbors
3. Classification: majority vote    |    Regression: average of k values
```

### Distance Metrics

| Metric | Formula | Use case |
|--------|---------|----------|
| **Euclidean** | `√(Σ(xᵢ - yᵢ)²)` | Default; continuous features |
| **Manhattan** | `Σ|xᵢ - yᵢ|` | High-dimensional or sparse data |
| **Cosine** | `1 - (x·y)/(‖x‖·‖y‖)` | Text/embeddings (direction matters, not magnitude) |
| **Minkowski** | `(Σ|xᵢ-yᵢ|^p)^(1/p)` | Generalization of Euclidean (p=2) and Manhattan (p=1) |

### Key Properties

- **No training phase** — all computation at inference ("lazy learning")
- **Feature scaling is critical** — features with larger ranges dominate distance calculations
- **Curse of dimensionality** — in high dimensions, all points become equidistant; KNN breaks down
- **Choosing k:** Small k → low bias, high variance (noisy). Large k → high bias, low variance (smooth). Use cross-validation. Odd k avoids ties in binary classification.

### When to Use KNN

- Small datasets where simplicity matters
- Non-linear decision boundaries
- As a baseline before trying complex models
- When interpretability via examples matters ("here are the 5 most similar cases")

### When NOT to Use KNN

- Large datasets (inference is O(n·d) per query)
- High-dimensional data (curse of dimensionality)
- When features are on different scales (unless you scale first)

**Optimization:** KD-Trees or Ball Trees reduce search from O(n) to O(log n) in low dimensions. For high-dimensional approximate search, use ANN algorithms (FAISS, HNSW).

---

## 7. Support Vector Machines (SVM)

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

## 8. Logistic Regression

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

## 9. K-Means Clustering

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

## 10. Dimensionality Reduction: PCA

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

## 11. Cross-Validation

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

## 12. Class Imbalance

Real-world datasets are often skewed (e.g., fraud detection: 0.1% positive).

| Strategy | How | When to use |
|---------|-----|-------------|
| **Class weights** | Penalize minority errors more in loss: `weight = n_majority / n_minority` | Always try first — zero cost |
| **Oversampling (SMOTE)** | Synthesize new minority samples by interpolating between existing ones | Moderate imbalance; avoid for high-dimensional data |
| **Undersampling** | Randomly remove majority samples | When majority class is huge; risks losing information |
| **Threshold tuning** | Move decision boundary from 0.5 to optimize precision/recall | Any probabilistic classifier |
| **Focal Loss** | Down-weight easy examples so training focuses on hard ones | Neural networks with severe imbalance (object detection, fraud) |
| **Use PR-AUC / F1** | ROC-AUC hides imbalance problems | Always with imbalanced data |

**SMOTE in brief:** For each minority sample, find k nearest minority neighbors, generate synthetic sample along the connecting line segment.

**Focal Loss in depth:** Standard cross-entropy treats all examples equally. With a 99:1 imbalance, the model learns to predict "majority" for everything and still achieves low loss — the minority signal drowns out.

```
Standard CE:  L = -log(p)
Focal Loss:   L = -α · (1 - p)^γ · log(p)
```

- `p` = predicted probability for the correct class
- `(1 - p)^γ` = modulating factor — when `p` is high (easy example, already well-classified), this term → 0, effectively ignoring it
- `γ` (focusing parameter, typically 2): higher γ = stronger down-weighting of easy examples
- `α` (class weight): balances frequency difference, same as `class_weight` in sklearn

**Concrete effect:** With γ = 2, an easy example with p = 0.9 gets loss weight `(1-0.9)² = 0.01` — 100× less than a hard example with p = 0.1. The network spends its gradient budget learning the hard, rare cases.

Originally introduced in **RetinaNet** for object detection (background vastly outnumbers foreground objects). Works for any neural network loss function — not available for tree models.

---

## 13. Feature Engineering

Often more impactful than algorithm choice.

### Encoding Categorical Variables

| Method | How | Use case |
|--------|-----|----------|
| **One-Hot Encoding** | Binary column per category | Low cardinality (< 20 categories), linear models |
| **Label Encoding** | Map category to integer | Tree models only (they handle arbitrary orderings) |
| **Target Encoding** | Replace category with mean target value | High cardinality; use with regularization to avoid leakage |
| **Hashing** | Map to fixed-size vector via hash function | Very high cardinality, online learning |

### Handling Missing Values

The mechanism of missingness matters as much as the strategy.

**Missing data mechanisms:**
- **MCAR (Missing Completely At Random):** Missingness is unrelated to any variable — a sensor randomly fails. Safe to impute simply.
- **MAR (Missing At Random):** Missingness depends on *observed* variables — older people skip income questions, but given age, the missingness is random. Can impute using other features.
- **MNAR (Missing Not At Random):** Missingness depends on the *missing value itself* — rich people hide income. Simple imputation is biased; need domain knowledge or model the missingness.

| Strategy | How | When |
|---------|-----|------|
| **Mean imputation** | Replace with column mean | MCAR numeric; fast baseline; distorts distribution |
| **Median imputation** | Replace with column median | MCAR numeric with outliers — more robust than mean |
| **Mode imputation** | Replace with most frequent value | MCAR categorical |
| **KNN imputation** | Use k nearest neighbors' values | MAR; preserves local relationships; slow at scale |
| **Iterative imputation (MICE)** | Regress each missing column on others; iterate | MAR; best quality; expensive |
| **Model imputation** | Train a model to predict missing column | MNAR; complex but powerful |
| **Add indicator column** | Binary flag: `col_missing = 1 if NaN` | When missingness itself is predictive (often is) |
| **Drop rows** | Remove rows with missing values | Only if < 1-5% missing AND MCAR AND you have enough data |
| **Tree-native handling** | XGBoost/LightGBM learn optimal direction for NaN | Best for tree models — don't impute, just pass NaN |

**Critical rule:** Fit imputers on **training data only**, then apply to validation/test. Fitting on the full dataset leaks test distribution — a subtle form of data leakage.

```python
# Correct
imputer.fit(X_train)
X_train_imp = imputer.transform(X_train)
X_val_imp   = imputer.transform(X_val)   # use train statistics only

# Wrong — data leakage
imputer.fit(X_all)   # sees test data statistics
```

### Feature Scaling

- **StandardScaler:** Zero mean, unit variance. Required for: SVM, logistic regression, PCA, KNN.
- **MinMaxScaler:** Scale to [0,1]. Use when data has bounded range or for neural networks.
- **RobustScaler:** Uses median and IQR. Use when outliers are present.
- **Trees don't need scaling** — splits are monotone-invariant.

---

## 14. Data Leakage

**Data leakage** occurs when information from outside the training window "leaks" into the model, producing optimistically biased evaluation metrics that don't hold in production. It's one of the most common and costly mistakes in applied ML.

### Types of Leakage

**1. Target Leakage (most common)**
A feature that is a direct consequence of the target — it's only available *after* the outcome is known.

```
Example: Predicting loan default
Leaked feature: "loan_was_restructured" (only happens after default)
Without it: model seems mediocre
With it: model gets 99% accuracy in training; 50% in production
```

**2. Train-Test Contamination**
Test data influences the training pipeline in any way.

| Leaky practice | Why it's wrong | Fix |
|----------------|---------------|-----|
| `StandardScaler.fit(X_all)` | Test mean/std leaks into train scaling | Fit on train only |
| `imputer.fit(X_all)` | Test distribution leaks into imputation | Fit on train only |
| Feature selection on full dataset | Model "knows" test feature variance | Select inside CV fold |
| Hyperparameter search on test set | Overfits test set | Use held-out validation |
| SMOTE on full dataset before split | Synthetic samples from test in training | SMOTE only on train fold |

**3. Temporal Leakage**
Using future data to predict the past — extremely common with time-series.

```
Example: Predicting stock price tomorrow using a moving average
Leaky:    7-day moving average includes days after prediction date
Correct:  Only use data strictly before prediction timestamp
```

**4. Group Leakage**
Data from the same entity appears in both train and test.

```
Example: Medical image classification
Leaky:   5 images from same patient in both train and test
Correct: Split by patient_id, not by image
```

### How to Detect Leakage

- **Suspiciously high validation accuracy** (> 99% on a hard problem)
- **Feature importance dominated by a single feature** you wouldn't have at prediction time
- **Temporal patterns:** feature timestamp is *after* event timestamp
- **Drop feature → big accuracy drop:** strong sign it's leaky
- **Shuffle test labels → still high accuracy:** model learned from index/order, not features

### Prevention Checklist

```
□ Split train/test BEFORE any preprocessing
□ Fit all transformers (scaler, imputer, encoder) on train fold only
□ For time-series: always split by time, not randomly
□ For groups (patients, users): split by group_id
□ Ask for every feature: "Is this available at prediction time?"
□ Wrap preprocessing in a Pipeline to enforce train-only fitting
□ SMOTE/oversampling only inside training fold
```

---

## 15. High-Dimensional Features

When your dataset has many features (p >> n, or p in the thousands), naive ML breaks down.

### Problems with High Dimensionality

- **Curse of dimensionality:** In high-dim space, all points become equidistant → KNN, clustering, distance-based methods fail
- **Overfitting:** More features than samples → model memorizes training data
- **Multicollinearity:** Highly correlated features → unstable coefficient estimates for linear models
- **Computational cost:** Training and inference slow down
- **Irrelevant features:** Noise features can hurt performance more than they help

### Strategy 1: Filter Methods (Before Training)

Remove features before any model is trained. Fast, model-agnostic.

| Method | How | Best for |
|--------|-----|---------|
| **Variance threshold** | Remove near-zero variance features | Any — quick cleanup |
| **Correlation filter** | Remove one of any two features with \|corr\| > 0.95 | Linear models |
| **Chi-squared test** | For categorical features vs categorical target | Text, categoricals |
| **Mutual Information** | Non-linear dependency between feature and target | Any type |
| **ANOVA F-test** | Linear association between numeric feature and target | Numeric features |

### Strategy 2: Wrapper Methods (Model-in-the-Loop)

Use a model's performance to select features. More accurate but expensive.

| Method | How |
|--------|-----|
| **RFE (Recursive Feature Elimination)** | Train model, remove lowest-importance feature, repeat |
| **Forward selection** | Start with 0 features, add one at a time (best gain) |
| **Backward elimination** | Start with all features, remove one at a time |

### Strategy 3: Embedded Methods (During Training)

Feature selection is part of the model fitting.

| Method | How |
|--------|-----|
| **L1 Regularization (Lasso)** | Drives irrelevant feature weights to exactly 0 |
| **Tree-based importance** | Random Forest / XGBoost: use feature importance scores |
| **ElasticNet** | L1 + L2 — sparse but handles correlated features |

### Strategy 4: Dimensionality Reduction

Transform features into a smaller set of derived features.

| Method | Type | Use case |
|--------|------|---------|
| **PCA** | Linear | Remove multicollinearity; speed up linear models |
| **t-SNE** | Non-linear | **Visualization only** — not for preprocessing |
| **UMAP** | Non-linear | Visualization + preprocessing; faster than t-SNE |
| **Autoencoders** | Deep learning | Complex non-linear structure; image/text features |
| **TruncatedSVD (LSA)** | Linear | Sparse matrices (text/TF-IDF); memory-efficient |

### Practical Decision Flowchart

```
p > 10,000 features?
    ├── Yes → Start with variance threshold + correlation filter (fast wins)
    │         → Then L1 / RFE / tree importance
    │         → PCA as last resort (loses interpretability)
    └── No  → Tree-based importance + SHAP for selection
              → Correlation filter if linear model

n < p (more features than samples)?
    ├── Use regularized models (Ridge, Lasso, ElasticNet)
    ├── PCA to reduce to n < p before any model
    └── Never use unregularized logistic regression or OLS
```

---

## 16. Hyperparameter Tuning

| Method | How | Pros/Cons |
|--------|-----|-----------|
| **Grid Search** | Try every combination | Exhaustive; exponential in dimensionality |
| **Random Search** | Sample random combinations | Surprisingly effective; more efficient than grid for >3 params |
| **Bayesian Optimization** | Build surrogate model of objective, sample where improvement expected | Most sample-efficient; use Optuna or Hyperopt |
| **Halving / Successive Elimination** | Early-stop bad configs | Fast; built into scikit-learn |

**Rule of thumb:** Random search beats grid search in high-dimensional parameter spaces (Bergstra & Bengio, 2012). Use Bayesian optimization when evaluation is expensive.

---

## 17. Model Interpretability: SHAP & LIME

Understanding *why* a model makes a prediction is increasingly critical — for debugging, regulatory compliance, and stakeholder trust. This is one of the hottest ML interview topics.

### Feature Importance vs Explainability

| Method | Scope | How it works | Pros | Cons |
|--------|-------|-------------|------|------|
| **Impurity-based importance** | Global | Mean decrease in Gini/entropy across all splits | Fast; built into sklearn | Biased toward high-cardinality features |
| **Permutation importance** | Global | Shuffle feature, measure accuracy drop | Model-agnostic; unbiased | Misleading with correlated features |
| **SHAP (SHapley Additive exPlanations)** | Local + Global | Game-theory: contribution of each feature to each prediction | Mathematically grounded; consistent | Expensive for large models |
| **LIME (Local Interpretable Model-Agnostic Explanations)** | Local | Fit a simple model (linear/tree) on perturbed samples near the point | Fast; intuitive | Explanations can be unstable |
| **Partial Dependence Plots (PDP)** | Global | Show marginal effect of a feature on prediction | Easy to understand | Assumes feature independence |
| **ICE (Individual Conditional Expectation)** | Local | PDP for individual instances | Shows heterogeneity | Can be noisy with many lines |

### SHAP — The Gold Standard

SHAP values are based on **Shapley values** from cooperative game theory. For each prediction, each feature gets a value representing its contribution to the difference between the prediction and the average prediction.

```
f(x) = base_value + SHAP(feature₁) + SHAP(feature₂) + ... + SHAP(featureₙ)

Example (loan approval):
  Base prediction: 65% approval
  + Income:        +20% (high income helps)
  + Credit score:  +10% (good score helps)
  + Debt ratio:    -15% (high debt hurts)
  = Final:          80% approval
```

**Key properties:**
- **Additivity:** SHAP values sum to the difference between prediction and mean
- **Consistency:** If a feature's contribution increases, its SHAP value never decreases
- **Local accuracy:** The explanation exactly matches the model output

**TreeSHAP:** Optimized O(TLD²) algorithm for tree models (vs exponential for exact Shapley). Built into XGBoost and LightGBM.

### LIME — Quick Local Explanations

```
1. Pick instance to explain
2. Generate perturbed samples around it
3. Get model predictions for perturbed samples
4. Fit a simple interpretable model (weighted by proximity)
5. The simple model's coefficients = explanation
```

**When to use LIME over SHAP:** When you need fast, approximate explanations for black-box models (neural nets, APIs) and SHAP is too expensive.

**Interview tip:** "For tree models, I'd use TreeSHAP (fast, exact). For neural networks or black-box APIs, I'd use LIME or KernelSHAP. For global understanding, I'd plot SHAP summary plots (beeswarm). For regulatory compliance, SHAP's mathematical guarantees (consistency, additivity) are stronger than LIME."

---

## 18. Probability Calibration

A model's predicted probability should match the true frequency. If a model predicts 80% confidence for 1000 samples, roughly 800 should actually be positive. Many models are **not** well-calibrated out of the box.

### Why Calibration Matters

- **Decision thresholds:** If probabilities are miscalibrated, tuning the classification threshold produces unexpected results
- **Risk scoring:** In medical, fraud, or insurance applications, probabilities directly drive decisions
- **Model combination:** Ensembling requires calibrated scores to weight models properly
- **Ranking is not enough:** A model can rank well (high AUC) but have terrible probability estimates

### Which Models Are Well-Calibrated?

| Model | Calibration quality | Why |
|-------|-------------------|-----|
| **Logistic Regression** | Good (inherently calibrated) | Optimizes log loss directly |
| **Random Forest** | Poor — overconfident near 0/1 | Votes are discrete fractions |
| **XGBoost / GBMs** | Moderate — depends on objective | Log loss objective helps |
| **Neural Networks** | Often overconfident | Modern NNs tend to be miscalibrated |
| **SVM** | No probabilities by default | Needs Platt scaling to output probs |
| **Naive Bayes** | Very poor — extreme probabilities | Independence assumption distorts |

### Calibration Methods

| Method | How it works | When to use |
|--------|-------------|-------------|
| **Platt Scaling** | Fit a logistic regression on model outputs vs true labels | Binary classification; works well with sigmoid-shaped distortions |
| **Isotonic Regression** | Fit a non-decreasing step function | More flexible; needs more data (~1000+ samples) |
| **Temperature Scaling** | Divide logits by learned T before softmax | Neural networks; single parameter; multiclass |

### Measuring Calibration

- **Reliability diagram:** Plot predicted probability vs observed frequency in bins. Perfect calibration = diagonal line.
- **Expected Calibration Error (ECE):** Weighted average of |predicted_prob - observed_freq| across bins. Lower = better.
- **Brier Score:** `mean((predicted - actual)²)` — combines calibration and discrimination.

```
Reliability Diagram:
Observed freq
     1.0 |          ·  /
         |        ·  /
     0.5 |    ·   /       ← well-calibrated (near diagonal)
         |  ·  /
     0.0 |·/
         └────────────
          0.0       1.0
         Predicted probability
```

**Interview tip:** "I'd check calibration with a reliability diagram and ECE. If the model is overconfident (most are), I'd apply Platt scaling for binary or temperature scaling for multiclass. Calibration is essential when probabilities drive business decisions — 'is this user 90% likely to churn?' needs to actually mean 90%."

---

## 19. Active Learning And Selective Prediction

When labels are expensive, do not sample randomly forever. Active learning selects examples that improve the model or reduce production risk.

### Active Learning Selection Signals

| Signal | Meaning | Example use |
|--------|---------|-------------|
| **High uncertainty** | Model confidence is low near a decision boundary | Label ambiguous classifications first. |
| **Model disagreement** | Ensembles, prompts, or reruns choose different labels | Find brittle regions of the input space. |
| **High-impact cases** | Rare mistakes are costly even if aggregate frequency is low | Over-sample fraud, safety, compliance, or churn-risk edge cases. |
| **Production failures** | User correction, review override, or tool failure indicates missing supervision | Turn incidents into training examples. |
| **Distribution shift** | New product, region, policy, or behavior changes input mix | Label fresh data from changed segments. |
| **Slice underperformance** | A subgroup has worse metrics than aggregate | Target the failing slice rather than collecting generic data. |

### Selective Prediction

Selective prediction means the model predicts only when confidence is high enough; otherwise it abstains, asks for more information, or routes to review.

| Mechanism | How it works | Trade-off |
|-----------|--------------|-----------|
| **Risk-tier thresholds** | Higher threshold for higher-impact decisions | Reduces harmful false positives but increases abstention. |
| **Reject option** | Model returns "unknown" below confidence threshold | Needs a fallback path. |
| **Conformal prediction** | Returns a set of plausible labels with statistical coverage under assumptions | Useful when multiple labels remain plausible. |
| **Calibrated probability** | Uses Platt, isotonic, or temperature scaling before thresholding | Thresholds only mean what they say if probabilities are calibrated. |

**Interview tip:** If the model is uncertain and the action is high-impact, the correct system behavior may be to abstain, ask, or escalate, not to force a low-confidence prediction.

---

## 20. Stacking & Advanced Ensembles

Beyond bagging and boosting, **stacking** (stacked generalization) is a powerful ensemble technique that uses a meta-learner to combine base model predictions.

### How Stacking Works

```
Training:
  Fold 1: Train Models A,B,C on folds 2-5 → predict on fold 1
  Fold 2: Train Models A,B,C on folds 1,3-5 → predict on fold 2
  ...
  Result: out-of-fold predictions from each base model

  Meta-learner: Train on [pred_A, pred_B, pred_C] → final prediction

Inference:
  Input → Model A prediction ─┐
        → Model B prediction ─┤→ Meta-learner → final prediction
        → Model C prediction ─┘
```

**Key rules:**
- Base models should be **diverse** (e.g., Random Forest + XGBoost + Logistic Regression + Neural Net)
- Use **out-of-fold predictions** for meta-learner training to avoid data leakage
- Meta-learner is typically simple (logistic regression, ridge regression) to avoid overfitting
- Can stack multiple levels (but diminishing returns after 2)

### Stacking vs Bagging vs Boosting

| | Bagging | Boosting | Stacking |
|-|---------|---------|---------|
| Base models | Same type, different data | Same type, sequential | Different types |
| Training | Parallel | Sequential | Two-stage |
| Reduces | Variance | Bias | Both (via diversity) |
| Example | Random Forest | XGBoost | RF + XGB + LR → meta |

### Blending (Simplified Stacking)

Use a simple holdout set (instead of cross-validation) for meta-learner training. Faster but wastes data.

**Interview tip:** Stacking typically wins Kaggle competitions but adds complexity in production. In interviews, mention it to show depth but note the operational trade-off.

---

## 21. Learning Curves & Diagnosing Model Performance

Learning curves plot model performance vs training set size or training iterations. They're the primary diagnostic tool for bias-variance analysis.

### Training Size Learning Curve

```
Error
  │
  │  ─── Training error (rises as data grows — harder to memorize)
  │  
  │  ─── Validation error (drops as data grows — better generalization)
  │
  │            Gap = variance
  └─────────────────────────── Training set size

High Bias (underfitting):         High Variance (overfitting):
Error                              Error
  │  val ──────────────             │  val ──────────
  │                                 │        \        ← large gap
  │  train ────────────             │           train ──
  │  ↑ both high, close gap         │  ↑ small train err, big gap
  └──────────────────               └──────────────────
   Training set size                 Training set size
```

### What Learning Curves Tell You

| Pattern | Diagnosis | Action |
|---------|-----------|--------|
| Both errors high, converging | **High bias** | More features, bigger model, less regularization |
| Train low, val high, not converging | **High variance** | More data, regularization, simpler model |
| Both errors low, converging | **Good fit** | Deploy |
| Train error increasing with data | Normal — harder to memorize more data | Not a problem |
| Val error not improving with more data | Model has learned all it can from this feature set | Better features, different algorithm |

### Practical Usage

```python
from sklearn.model_selection import learning_curve
train_sizes, train_scores, val_scores = learning_curve(
    model, X, y, train_sizes=np.linspace(0.1, 1.0, 10), cv=5
)
```

**Interview tip:** When asked "how would you debug a model that's performing poorly?", learning curves should be your first tool. They tell you whether you need more data (variance problem) or a better model (bias problem).

---

## 22. Interview Quick-Reference

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

**"What is data leakage and how do you prevent it?"**
→ Leakage = information from outside the training window contaminates the model. Types: target leakage (feature only available after the event), train-test contamination (scaler/imputer fit on all data), temporal leakage (using future data), group leakage (same user in train and test). Prevention: split first, then fit transformers on train only, wrap in Pipeline, always ask "is this feature available at prediction time?"

**"You have 50,000 features. What do you do?"**
→ First, remove near-zero variance features and high-correlation pairs (fast filter). Then L1 regularization to get sparse weights, or tree-based importance to rank and prune. Use PCA to reduce to manageable dimensions if linear model needed. Never use unregularized models when p >> n.

**"Bagging vs Boosting — what does each reduce?"**
→ Bagging reduces variance by averaging independent models (Random Forest). Boosting reduces bias by sequentially fixing errors (XGBoost). Bagging is parallelizable; Boosting is sequential. Use Random Forest as a fast robust baseline; use XGBoost when you need maximum accuracy on tabular data.

**"When would you use Naive Bayes?"**
→ Text classification (spam, sentiment) with bag-of-words/TF-IDF features. It's fast (O(n·d) training), works well with high-dimensional sparse data, and gives a strong baseline that's surprisingly hard to beat on small text datasets. Fails when features are highly correlated.

**"Explain KNN and its limitations"**
→ Store all training data. Classify by majority vote of k nearest neighbors. No training phase (lazy learning). Main limitations: O(n·d) inference, curse of dimensionality makes distances meaningless in high dimensions, requires feature scaling. Use KD-trees for speedup. Good for small datasets and when you want example-based explanations.

**"How do you explain your model's predictions?"**
→ For tree models: TreeSHAP (fast, exact Shapley values). For any model: permutation importance (global) or LIME (local). SHAP is the gold standard — each feature gets a value representing its contribution, values are additive and consistent. For regulatory compliance, SHAP's mathematical guarantees are strongest.

**"Your model has good AUC but bad real-world performance"**
→ Likely a calibration problem. Good AUC means the model ranks well, but the predicted probabilities may not be trustworthy. Check with a reliability diagram. Apply Platt scaling (binary) or temperature scaling (multiclass). Calibration matters when probabilities drive business decisions (loan risk, insurance pricing).
