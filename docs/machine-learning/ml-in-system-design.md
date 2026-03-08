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

## Offline vs Online Evaluation

ML systems fail when teams optimize only for offline benchmark scores.

| Evaluation type | What it answers | Examples |
|-----------------|-----------------|----------|
| **Offline** | "Is the model better on historical labeled data?" | AUC, precision/recall, NDCG, RMSE |
| **Online** | "Does this improve user or business outcomes in production?" | CTR, conversion, retention, fraud caught, false decline rate |

### Rule of thumb

- Offline metrics decide **whether a model is worth testing**
- Online metrics decide **whether a model is worth shipping**

You need both. A better offline ranker can still hurt long-term engagement if it over-optimizes clickbait or ignores diversity.

---

## Feature Freshness & Training-Serving Skew

Two of the most important operational failure modes in ML systems are:

1. **Feature freshness issues**: serving uses stale features, such as "last transaction count" from 3 hours ago in fraud detection
2. **Training-serving skew**: training and serving compute the same feature differently

### Practical patterns

- Use an online feature store or low-latency cache for hot features
- Store feature timestamps and reject obviously stale values
- Version feature definitions and reuse the same transformation logic across batch and online paths
- Build point-in-time correct training data so future information never leaks backwards

---

## Deployment & Rollout Strategy

Never replace a production model in one step unless the blast radius is tiny.

| Strategy | What it does | Best for |
|----------|---------------|----------|
| **Shadow deployment** | New model receives live traffic but does not affect decisions | Validating latency, stability, prediction drift |
| **Canary** | Send a small percentage of traffic to new model | Safer rollout to real users |
| **Champion-Challenger** | Current model remains primary while challenger is compared continuously | Recommendation, ranking, fraud |
| **Blue-Green** | Switch full traffic between two environments | Simpler infra cutovers |

### Rollback rule

Rollback must be a product decision, not a debugging project:

- keep previous model artifact and serving config ready
- define guardrail metrics ahead of time
- auto-disable if latency, error rate, or business KPIs cross thresholds

---

## Monitoring, Drift & Retraining

Production ML is a monitoring problem as much as a modeling problem.

| Signal | What it means | Example response |
|--------|----------------|------------------|
| **Feature drift** | Input distribution changed | Recompute statistics, inspect upstream data |
| **Prediction drift** | Score distribution shifted | Check calibration, serving bugs, market change |
| **Label drift / concept drift** | Relationship between inputs and labels changed | Retrain, update features, revisit business logic |
| **Serving latency spike** | System too slow for SLA | Reduce feature calls, batch, fallback model |
| **Fallback rate increase** | Primary model or feature pipeline unhealthy | Investigate dependencies, degrade gracefully |

### Retraining triggers

- scheduled retraining (daily / weekly)
- threshold-based retraining on drift
- data volume milestone
- post-incident retraining after feature bug or bad labels

---

## Latency, Cost & Quality Trade-offs

The best model on paper is often the wrong production choice.

| Choice | Quality | Latency | Cost | Typical use |
|--------|---------|---------|------|-------------|
| **Heavier ranker** | Higher | Worse | Higher | Final ranking on a small candidate set |
| **Two-stage retrieval + rank** | High | Good | Medium | Recommendation, search, ads |
| **Rule-based fallback** | Lower | Best | Lowest | Degraded mode, cold start, incident response |
| **Batch scoring** | Medium | Excellent at request time | Low | Email recommendations, periodic risk scoring |

In interviews, explicitly say where you trade model quality for p95 latency or infrastructure cost.

---

## Recommended Default Architecture

For most ML system-design interviews:

1. **Offline training pipeline** with event logs, feature generation, model registry
2. **Feature store** with offline and online views
3. **Two-stage serving** when candidate space is large: retrieve first, rank second
4. **Champion-challenger or canary rollout**
5. **Fallback path** when model, features, or vector search are unavailable
6. **Monitoring** for data drift, model quality, latency, and business metrics

This default is practical, production-friendly, and easy to defend.

---

## Failure Modes

| Failure mode | What breaks | Mitigation |
|--------------|------------|-----------|
| Offline metric looks great, online KPI drops | Objective mismatch | Add guardrail metrics and online experiments |
| Feature store stale or unavailable | Bad predictions or timeout | TTLs, fallbacks, cached defaults |
| New model too slow | Misses serving SLA | Smaller model, two-stage pipeline, batching |
| Distribution shift after launch | Model confidence becomes meaningless | Drift monitors + rollback |
| Cold start | New users/items have no history | Popularity + content-based fallback |

---

## Metrics That Decide Ship / No-Ship

- Offline: AUC, precision/recall, NDCG, calibration error
- Online: CTR, conversion, retention, fraud catch rate, false positive rate
- System: p95 latency, timeout rate, fallback rate, feature freshness lag
- Operations: drift alerts, retraining frequency, model rollback count

---

## Interview Answer Sketch

I would separate the system into offline training and online serving. Offline, events flow into the feature pipeline, feature store, training jobs, and model registry. Online, the serving path retrieves fresh features from the online store, uses a two-stage pipeline if the candidate set is large, and returns predictions within a strict latency budget. I would ship new models through canary or champion-challenger rollout, measure both offline quality and online business metrics, and keep a rule-based or previous-model fallback for incidents. The hardest real-world issues are not training the model, but handling feature freshness, training-serving skew, drift, and safe rollback.

---

## Interview Talking Points

- "Two-stage pipeline: candidate generation (embedding similarity via FAISS, millions→500 candidates) + ranking (full feature model, 500→20 ranked recommendations). This pattern is used by YouTube, TikTok, Spotify."
- "Feature store solves training-serving skew. The same feature definitions used in offline training are also served in real-time. Without this, you'd have two codebases that drift apart."
- "A/B testing is how we validate ML changes. We never ship a new model without running it against the champion model for 2 weeks. Statistical significance AND practical significance both required."
- "Cold start problem: new users have no history. Fall back to content-based filtering (item attributes) + popularity-based recommendations. After 5 interactions, collaborative filtering kicks in."
