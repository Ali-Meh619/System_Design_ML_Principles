# Machine Learning in System Design

> Recommendation systems (Netflix, Spotify), ranking (Google, Twitter feed), fraud detection, content moderation — all require ML infrastructure as a first-class system design concern.

---

## The ML System Architecture

A production ML system has two independent pipelines: the **training pipeline** (offline, runs periodically) and the **serving pipeline** (online, serves real-time predictions). These are intentionally separate because they have different performance requirements — training needs massive compute for hours; serving needs sub-10ms response for millions of users.

**Training Pipeline Components**

| Component | Purpose | Tools |
|-----------|---------|-------|
| **Data Collection** | Log user interactions (clicks, watch time, purchases, skips) to event stream | Kafka, Kinesis, Snowplow |
| **Feature Engineering** | Transform raw events into model features (user age, item popularity, time-of-day, etc.) | Apache Spark, dbt, Feast |
| **Feature Store** | Central storage for computed features — offline store for training, online store for real-time serving | Feast, Tecton, Databricks Feature Store |
| **Model Training** | Train model on historical feature/label data | PyTorch, TensorFlow, XGBoost, SageMaker |
| **Model Registry** | Versioned storage for trained models with metadata (accuracy, training date, dataset) | MLflow, Weights & Biases, SageMaker Model Registry |

---

## Feature Store — The Most Important ML Infrastructure

The **feature store** solves the "training-serving skew" problem: the same feature computation logic must be used both for training (offline, batch) and serving (online, real-time). Without a feature store, teams write the same feature code twice — once in Spark for training, once in Python for serving — and they inevitably diverge. A feature store provides a single definition that works in both contexts.

**Feature Store: Offline vs Online**

| Store Type | Storage | Used for | Access speed |
|-----------|---------|---------|-------------|
| **Offline store** | S3/GCS + Parquet files or data warehouse | Training data retrieval with point-in-time correctness (no data leakage) | Batch — minutes to hours |
| **Online store** | Redis, DynamoDB, Cassandra | Real-time feature lookup during inference (user's last 10 searches) | Sub-millisecond — must not add latency to predictions |

---

## Recommendation System Architecture

Every major platform (Netflix, Spotify, YouTube, Amazon) uses a **two-stage recommendation pipeline**: (1) **Candidate Generation** (fast, approximate, narrow millions to hundreds) followed by (2) **Ranking** (slow, accurate, order the hundreds by final score). Running the expensive ranking model on all 50 million items would take minutes; running it on 500 pre-screened candidates takes milliseconds.

**Candidate Generation Methods**

| Method | How it works | Best for |
|--------|-------------|---------|
| **Collaborative Filtering** | "Users similar to you also liked X." Build a user-item matrix of ratings, find similar users (cosine similarity), recommend what they liked. | Finding non-obvious but relevant recommendations. Core of Netflix, Spotify. |
| **Content-Based Filtering** | "You liked a jazz album → recommend other jazz albums with similar audio features." | New users (cold start problem) where no collaborative signal exists. New items without ratings. |
| **Two-Tower Neural Network** | Train separate embedding networks for users and items. At serving time, retrieve items with embeddings nearest to user's embedding using ANN search. | State of the art at scale. Used by YouTube, TikTok, Pinterest. Embeddings stored in vector database (FAISS, Pinecone). |
| **Matrix Factorization (ALS, SVD)** | Decompose the user-item rating matrix into low-rank user and item matrices. Their dot product predicts ratings. | When you have explicit ratings. Core algorithm of Netflix Prize winning solution. |

---

## Recommendation System Template (Spotify, Netflix, YouTube)

**Full end-to-end architecture:**

1. **Event logging:** Log all user interactions (plays, skips, likes, session time) → Kafka → Spark batch job → training dataset
2. **Candidate generation:** Two-tower model produces user embedding daily. Precompute nearest 500 items using FAISS ANN index. Store as Redis list per user.
3. **Feature computation:** At request time, enrich 500 candidates with real-time features: item freshness, user's recent history (last 10 plays), contextual features (time of day, device)
4. **Ranking:** Feed enriched 500 candidates to ranking model (LightGBM, neural ranker). Returns sorted list in under 50ms.
5. **Business rules layer:** Apply post-ranking rules: diversity injection (don't recommend same artist 3 times in a row), content moderation filter, A/B test variant assignment
6. **A/B testing:** Split traffic into experiment groups. Measure against metrics: click-through rate, session length, 7-day retention. Statistical significance gate before full rollout.

---

## Model Serving Infrastructure

| Service | Best For | Key Features |
|---------|----------|--------------|
| **TorchServe** | PyTorch model serving | Official PyTorch serving framework. Handles model loading, request batching, multiple model management. GPU-accelerated. |
| **Triton Inference Server** | Multi-framework, GPU | NVIDIA's serving framework. Supports PyTorch, TensorFlow, ONNX. Dynamic batching, model ensembles. Used at hyperscale. |
| **AWS SageMaker** | Managed ML platform | Managed training, deployment, monitoring. Auto-scaling. A/B testing built-in. Full MLOps platform. |
| **FAISS / Pinecone** | Vector similarity search | Find the N nearest embedding vectors in milliseconds among billions of items. Essential for two-tower recommendation and semantic search. |

---

## Fraud Detection Architecture

Real-time fraud detection requires sub-100ms decisions:

```
Payment request arrives
    ↓
Feature extraction (real-time):
  - User's last 10 transactions (Redis)
  - Device fingerprint match (Redis)
  - IP geolocation risk score (Redis)
  - Transaction velocity (count in last 1 hour)
    ↓
ML model inference (<10ms):
  - Gradient boosting (XGBoost/LightGBM)
  - Fraud probability score: 0.0 - 1.0
    ↓
Decision:
  - Score < 0.3: Allow
  - Score 0.3-0.7: Request additional verification (2FA)
  - Score > 0.7: Decline
    ↓
Async:
  - Log decision to data warehouse
  - Update user's risk profile
  - Feed decision back as training signal
```

---

## A/B Testing Infrastructure

Every ML model change requires experimentation:

```
User arrives at recommendation endpoint
    ↓
Experiment assignment service:
  - Hash(user_id + experiment_id) → variant A or B
  - Consistent: same user always gets same variant
    ↓
Variant A: Current production model
Variant B: New candidate model
    ↓
Log: {user_id, variant, recommendations, timestamp}
    ↓
Analysis (after N days, N users):
  - Primary metric: 7-day retention rate
  - Guard metrics: CTR, session length, skip rate
  - Statistical test: t-test, p < 0.05
  - Decision: ship if improvement is statistically significant AND practically significant (>1% lift)
```

---

## Interview Talking Points

- "Two-stage pipeline: candidate generation (embedding similarity via FAISS, millions→500 candidates) + ranking (full feature model, 500→20 ranked recommendations). This pattern is used by YouTube, TikTok, Spotify."
- "Feature store solves training-serving skew. The same feature definitions used in offline training are also served in real-time. Without this, you'd have two codebases that drift apart."
- "A/B testing is how we validate ML changes. We never ship a new model without running it against the champion model for 2 weeks. Statistical significance AND practical significance both required."
- "Cold start problem: new users have no history. Fall back to content-based filtering (item attributes) + popularity-based recommendations. After 5 interactions, collaborative filtering kicks in."
