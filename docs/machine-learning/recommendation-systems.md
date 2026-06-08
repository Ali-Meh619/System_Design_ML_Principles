# Recommendation Systems

> A recommendation system is a production decision engine: define the surface and objective, log exposure correctly, retrieve candidates cheaply, rank with rich features, rerank the final slate, evaluate without leakage, and launch through experiments.

---

## 1. Interview Answer Spine

When the interviewer says "design a recommendation system," do not start with a model. Start with the product decision.

1. **Surface:** home feed, product carousel, video queue, email, search-adjacent suggestions, notification, or next-best action.
2. **Entities:** user, item, context, session, candidate source, creator/seller/provider, and action.
3. **Objective:** click, conversion, watch time, long-term retention, revenue quality, safety, trust, or a weighted utility.
4. **Data:** impressions, positions, candidate sources, scores, model versions, features, and delayed outcomes.
5. **Architecture:** candidate generation -> filtering -> ranking -> reranking -> logging -> feedback loop.
6. **Models:** start with baselines, then choose collaborative filtering, matrix factorization, two-tower retrieval, sequence models, graph models, GBDT/neural ranking, or multi-task models based on data and constraints.
7. **Evaluation:** offline Recall@K/NDCG/MAP/MRR/calibration plus online A/B tests with business and guardrail metrics.
8. **Operations:** feature store, ANN index refresh, model registry, rollout, monitoring, bias checks, exploration, and rollback.

### Strong Spoken Answer

I would define the recommendation surface, user, item, context, and product objective first. Then I would make sure we log impressions, rank position, candidate source, model version, feature values, and delayed outcomes, because recommendation labels are biased by what the old system exposed. I would use a multi-stage architecture: high-recall candidate generation, eligibility filtering, richer ranking, and final reranking for diversity, freshness, policy, fatigue, and business constraints. Offline I would evaluate retrieval recall, ranking quality, calibration, coverage, diversity, and segment health. Online I would ship only through A/B tests with a primary product metric, guardrails, and rollback.

---

## 2. Data, Labels, And Interaction Metrics

Recommendation data is not just "user clicked item." The system only observes outcomes for items it showed, so logging exposure is mandatory.

### Business And Interaction Metrics

$$
CTR = \frac{\text{clicks}}{\text{impressions}}
$$

$$
CVR_{click} = \frac{\text{conversions}}{\text{clicks}},
\qquad
CVR_{imp} = \frac{\text{conversions}}{\text{impressions}}
$$

$$
CTCVR = P(\text{click}\mid x)P(\text{conversion}\mid \text{click}, x)
$$

$$
\overline{T}_{dwell} = \frac{1}{N}\sum_{n=1}^{N}T_n
$$

$$
U = w_c\cdot click + w_d\cdot dwell + w_p\cdot purchase - w_h\cdot hide - w_r\cdot report
$$

| Metric | Use | Warning |
|--------|-----|---------|
| Impression | Item was displayed to the user. | Without impressions, missing means "unknown," not "disliked." |
| CTR | Immediate interest. | Can reward clickbait. |
| Dwell/watch time | Depth of engagement. | Long time is not always satisfaction. |
| Conversion | Business outcome. | Delayed and sparse. |
| Hide/report/skip | Negative feedback. | Must be weighted strongly for safety and trust. |
| Retention | Long-term product health. | Slower feedback loop. |

### What To Log

| Field | Why it matters |
|-------|----------------|
| `request_id`, `user_id`, `session_id` | Joins request, impression, click, and later labels. |
| `item_id`, `creator_id`, `seller_id` | Enables item and provider metrics. |
| `surface`, `slot`, `position` | Corrects for position and surface bias. |
| `candidate_source` | Debugs retrieval quality and source mix. |
| `retrieval_score`, `ranking_score`, `final_score` | Debugs score transformations. |
| `model_version`, `feature_version`, `index_version` | Enables replay and rollback analysis. |
| `features_snapshot` or feature references | Enables training-serving skew checks. |
| `experiment_id`, `variant_id` | Required for A/B analysis. |
| `impression_time`, `event_time`, `label_time` | Handles delayed labels and temporal splits. |

### Explicit vs Implicit Feedback

| Feedback | Examples | Strength | Weakness |
|----------|----------|----------|----------|
| Explicit | ratings, likes/dislikes, surveys | Clearer intent | Sparse and biased toward motivated users. |
| Implicit | clicks, views, purchases, dwell, skips | Abundant | Ambiguous and exposure-biased. |

Implicit data is usually the main production signal, but it must be interpreted as noisy preference evidence, not ground truth.

---

## 3. Production Architecture

Most large systems are staged because scoring every item with an expensive model is impossible.

```text
User request
  -> request/context feature extraction
  -> candidate generation from multiple retrieval sources
  -> eligibility filtering and deduplication
  -> ranking model scores hundreds/thousands of candidates
  -> reranking applies diversity, freshness, fatigue, policy, business constraints
  -> final list returned
  -> impressions and downstream actions logged
  -> training/evaluation/monitoring feedback loop
```

### Stage Responsibilities

| Stage | Goal | Typical candidate count | Latency target |
|-------|------|-------------------------|----------------|
| Retrieval / candidate generation | High recall from huge catalog. | millions -> 100-5000 | 5-50 ms depending on surface. |
| Filtering | Remove invalid or unsafe candidates. | 100-5000 -> fewer valid candidates | Low single-digit ms. |
| Ranking | Precise utility scoring with rich features. | hundreds/thousands -> ordered list | 10-100 ms. |
| Reranking | Optimize the final slate. | top hundreds -> final K | Low single-digit to tens of ms. |
| Logging | Capture exposure and outcomes. | all shown items | Async, durable. |

### Retrieval Features vs Ranking Features

| Stage | Features | Reason |
|-------|----------|--------|
| Retrieval | user/session embedding, item embedding, seed items, category, language, region, popularity, freshness, hard eligibility | Searches many items, so features must be cheap and often precomputed. |
| Ranking | long-term user profile, short-term session intent, item quality, historical CTR/CVR, user-item affinity, price distance, candidate source, context, predicted negative feedback | Scores a smaller candidate set, so it can use richer features and cross features. |

### Batch, Real-Time, And Hybrid Serving

| Pattern | How it works | Use when |
|---------|--------------|----------|
| Batch recommendations | Precompute lists or embeddings periodically and serve from cache. | Email, weekly digest, low-freshness surfaces. |
| Real-time recommendations | Compute features and score at request time. | Home feed, session-sensitive surfaces, high freshness. |
| Hybrid system | Batch-train models and precompute static signals, but use real-time session features at serving. | Most large systems. |

Hybrid is the default: item embeddings, long-term user features, and historical aggregates are precomputed; session context and recent behavior are injected at request time.

---

## 4. Candidate Generation / Retrieval Methods

Retrieval reduces the catalog to a candidate set. It optimizes recall and latency, not final ordering.

### 4.1 Popularity With Bayesian Smoothing

Use as a baseline, fallback, anonymous-user strategy, and cold-start source.

$$
\hat p_i = \frac{s_i+\alpha\mu}{n_i+\alpha}
$$

$$
\hat r_i = \frac{n_i\bar r_i+m\mu}{n_i+m}
$$

| Symbol | Meaning |
|--------|---------|
| `s_i` | Positive outcomes for item `i`, such as clicks or purchases. |
| `n_i` | Opportunities/exposures for item `i`, usually impressions. |
| `mu` | Global average rate. |
| `alpha` or `m` | Prior strength; larger values keep low-data items closer to global average. |

Raw popularity overpromotes noisy new items. Smoothing prevents one click from making an item look perfect.

### 4.2 Collaborative Filtering: User-Based vs Item-Based

Collaborative filtering uses interaction patterns, not item content.

User-user similarity:

$$
sim(u,v)=
\frac{\sum_{i\in I_u\cap I_v}(r_{u,i}-\bar r_u)(r_{v,i}-\bar r_v)}
{\sqrt{\sum_{i\in I_u\cap I_v}(r_{u,i}-\bar r_u)^2}
\,\sqrt{\sum_{i\in I_u\cap I_v}(r_{v,i}-\bar r_v)^2}}
$$

User-based prediction:

$$
\hat r(u,i)=\bar r_u+
\frac{\sum_{v\in N_k(u)}sim(u,v)(r_{v,i}-\bar r_v)}
{\sum_{v\in N_k(u)} |sim(u,v)|}
$$

Item-item score:

$$
score(u,j)=\sum_{i\in H_u}w_{u,i}sim(i,j)
$$

| Method | Scales better when | Weakness |
|--------|--------------------|----------|
| User-based CF | User base is stable and small. | Similar users change often; expensive with many users. |
| Item-based CF | Item catalog is more stable than user activity. | New items need interactions or content fallback. |

In practice, item-item co-visitation is a strong production retrieval source because item similarities can be precomputed.

### 4.3 Matrix Factorization Family

Matrix factorization learns dense user and item vectors from sparse interactions.

$$
\hat y_{u,i}=\mu+b_u+b_i+p_u^Tq_i
$$

$$
\mathcal{L}=
\sum_{(u,i)\in\Omega}(y_{u,i}-\hat y_{u,i})^2+
\lambda(\lVert p_u\rVert_2^2+\lVert q_i\rVert_2^2+b_u^2+b_i^2)
$$

| Variant | What it adds | Use when |
|---------|--------------|----------|
| Basic MF / Funk SVD | User and item vectors optimized over observed entries. | Explicit ratings baseline. |
| Biased MF | Global, user, and item bias terms. | Almost always better than plain MF for ratings. |
| ALS | Alternating closed-form least-squares updates. | Distributed and stable training. |
| WRMF / implicit ALS | Preference/confidence split for implicit events. | Clicks, plays, purchases, views. |
| SVD++ | Implicit-history vectors. | Ratings plus implicit history. |
| BPR-MF | Pairwise ranking loss. | Top-K implicit recommendation. |

ALS user update:

$$
p_u=(Q_u^TQ_u+\lambda I)^{-1}Q_u^Ty_u
$$

SVD++:

$$
\hat r_{u,i}=\mu+b_u+b_i+q_i^T\left(p_u+|N(u)|^{-1/2}\sum_{j\in N(u)}y_j\right)
$$

### 4.4 Implicit ALS / WRMF

Implicit feedback separates preference from confidence:

$$
p_{u,i}=\mathbf{1}[r_{u,i}>0]
$$

$$
c_{u,i}=1+\alpha r_{u,i}
\qquad \text{or} \qquad
c_{u,i}=1+\alpha\log(1+r_{u,i}/\epsilon)
$$

$$
\min_{X,Y}
\sum_{u,i}c_{u,i}(p_{u,i}-x_u^Ty_i)^2+
\lambda(\lVert X\rVert_F^2+\lVert Y\rVert_F^2)
$$

Missing interactions are weak unknowns, not strong negatives. Repeated actions increase confidence.

### 4.5 BPR Matrix Factorization

Bayesian Personalized Ranking trains a positive item to score above a sampled negative item.

$$
\mathcal{L}_{BPR}=
-\sum_{(u,i,j)}\log\sigma(\hat y_{u,i}-\hat y_{u,j})
+\lambda\lVert\Theta\rVert_2^2
$$

Use BPR when the goal is relative top-K order and explicit ratings are unavailable.

### 4.6 EASE

EASE is a strong shallow item-item linear model for implicit feedback:

$$
\hat X=XB,
\qquad
diag(B)=0
$$

$$
\min_B \lVert X-XB\rVert_F^2+\lambda\lVert B\rVert_F^2
$$

It is simple, fast for moderate item catalogs, and surprisingly competitive as a baseline.

### 4.7 Two-Tower Retrieval

Two-tower models generalize matrix factorization with neural networks and side features.

$$
z_u=f_\theta(x_u),
\qquad
z_i=g_\phi(x_i)
$$

$$
s(u,i)=z_u^Tz_i
$$

$$
P(i^+\mid u)=
\frac{\exp(s(u,i^+)/\tau)}
{\exp(s(u,i^+)/\tau)+\sum_{j\in S_u}\exp(s(u,j)/\tau)}
$$

Serving advantage:

```text
Offline: compute item embeddings -> build ANN index
Online: compute user/session embedding -> ANN lookup -> candidate set
```

| Design choice | Common default |
|---------------|----------------|
| User tower inputs | user ID, recent sequence, long-term profile, context. |
| Item tower inputs | item ID, content embeddings, category, creator, metadata. |
| Score | dot product for ANN compatibility. |
| Embedding dimension | often 64-512 depending on scale. |
| Loss | sampled softmax / InfoNCE with in-batch and mined negatives. |
| Refresh | item embeddings hourly/daily; user embedding online or near-real-time. |

### 4.8 Negative Sampling

Negative sampling shapes what the model learns.

| Strategy | Benefit | Risk |
|----------|---------|------|
| Uniform negatives | Simple and broad. | Too easy; weak top-K discrimination. |
| Popularity-based negatives | Teaches competition against plausible items. | Can over-penalize popular items. |
| In-batch negatives | Efficient for two-tower training. | Batch distribution bias. |
| Hard negatives | Improves top-rank quality. | False negatives can hurt learning. |
| Mixed strategy | Production default. | Needs tuning and monitoring. |

If negatives are sampled from distribution `q(j)`, a common correction is:

$$
s_{corr}(u,j)=s(u,j)-\log q(j)
$$

### 4.9 ANN Vector Search

Approximate nearest neighbor search makes embedding retrieval feasible at large catalog sizes.

$$
TopK(q)=\underset{x_i\in X}{arg\,topK}\;sim(q,x_i)
$$

$$
Recall@K_{ANN}=
\frac{|TopK_{exact}(q)\cap TopK_{ANN}(q)|}{K}
$$

| Index | How it works | Key parameters | Use when |
|-------|--------------|----------------|----------|
| HNSW | Layered proximity graph with greedy search. | `M`, `efConstruction`, `efSearch` | High recall and low latency with memory budget. |
| IVF-PQ / FAISS | Cluster vectors, search nearby lists, compress with product quantization. | `nlist`, `nprobe`, PQ code size | Very large catalogs and memory constraints. |
| ScaNN | Partition, quantize, and exact-rescore shortlist for dot-product search. | partition count, reorder size | Maximum inner-product retrieval. |

HNSW rule of thumb:

$$
\text{Memory}\approx O(NM),
\qquad
\text{Build time}\approx O(N\log N)
$$

MIPS reranking:

$$
C_{K'}=TopK'_{approx}(q), \qquad K'>K
$$

$$
FinalTopK(q)=TopK_{x_i\in C_{K'}}q^Tx_i
$$

### 4.10 Content-Based And Hybrid Retrieval

Content-based retrieval works before collaborative data exists.

$$
v_u=\frac{\sum_{i\in H_u}w_{u,i}v_i}{\sum_{i\in H_u}w_{u,i}}
$$

$$
score(u,j)=cos(v_u,v_j)
$$

Use content signals for:

- new items
- anonymous users with session context
- sparse catalogs
- compliance-sensitive explanations
- cold-start bootstrapping

Hybrid retrieval merges several sources: popularity, item-item, two-tower ANN, content similarity, graph walks, recent trends, and editorial or business sources.

### 4.11 Sequential Recommendation

Sequential models capture short-term intent.

$$
h_u=Encoder(i_1,i_2,\ldots,i_t)
$$

$$
P(i_{t+1}=j\mid i_{1:t})=softmax(h_u^Tq_j)
$$

| Model | Architecture | Use when |
|-------|--------------|----------|
| GRU4Rec | RNN over session sequence. | Short sessions and lower latency. |
| SASRec | Causal self-attention over history. | Order matters and histories are medium length. |
| BERT4Rec | Masked bidirectional sequence modeling. | Offline sequence understanding; not strict next-token causality. |

SASRec causal mask:

$$
A_{i,j}=-\infty \quad \text{if } j>i
$$

### 4.12 Graph Recommendation

Graph models use the user-item interaction graph.

LightGCN propagation:

$$
e_u^{(l+1)}=
\sum_{i\in N(u)}
\frac{1}{\sqrt{|N(u)|\,|N(i)|}}e_i^{(l)}
$$

$$
e_u=\sum_{l=0}^{L}\alpha_l e_u^{(l)}
$$

Personalized PageRank style retrieval:

$$
\pi_u=\rho e_u+(1-\rho)P^T\pi_u
$$

| Model | Strength | Limitation |
|-------|----------|------------|
| LightGCN | Strong collaborative graph baseline. | Transductive; weaker for unseen items. |
| PinSage | Industrial-scale item graph with inductive features. | More complex graph sampling pipeline. |
| Random walk / PPR | Interpretable graph relevance. | Can overfit graph popularity. |

### 4.13 Cold Start

| Cold-start type | Problem | Strategy |
|-----------------|---------|----------|
| New user | No interaction history. | onboarding preferences, session context, geography/language, popularity smoothing, contextual bandits. |
| New item | No interactions yet. | content embeddings, metadata, creator/seller priors, exploration slots, dropout-based ID masking during training. |
| New system | No collaborative data. | content-based retrieval, editorial/popularity baselines, import external taxonomies, launch with exploration logging. |

New-item cold start is often the hardest at catalog-heavy companies. Mention content embeddings mapped into the collaborative space and controlled exploration.

---

## 5. Ranking Methods

Ranking scores a smaller candidate set with richer features. The output is usually a calibrated probability, expected utility, or vector of predicted outcomes.

### 5.1 Logistic / Calibrated CTR Ranker

$$
P(y=1\mid x)=\sigma(w^Tx+b)
$$

$$
\mathcal{L}_{BCE}=
-\sum_n[y_n\log p_n+(1-y_n)\log(1-p_n)]
$$

Use as a fast interpretable baseline and for calibrated probabilities.

### 5.2 GBDT / XGBoost / LightGBM

$$
F_M(x)=\sum_{m=1}^{M}\eta f_m(x)
$$

$$
\hat y=\sigma(F_M(x))
$$

GBDT models are strong for tabular ranking features, missing values, monotonic constraints, and fast iteration.

### 5.3 Wide And Deep

Wide and Deep balances memorization and generalization.

$$
\hat y=\sigma(w_{wide}^T[x,\phi(x)] + w_{deep}^Ta_L + b)
$$

$$
\phi_{i,j}(x)=x_i x_j
$$

Wide branch memorizes useful feature crosses; deep branch generalizes through embeddings and nonlinear layers.

### 5.4 Factorization Machines

$$
s(x)=w_0+\sum_{j=1}^{d}w_jx_j+
\sum_{j=1}^{d}\sum_{k=j+1}^{d}\langle v_j,v_k\rangle x_jx_k
$$

Efficient identity:

$$
\sum_i\sum_{j>i}\langle v_i,v_j\rangle x_ix_j
=
\frac{1}{2}\left[
\left(\sum_i v_ix_i\right)^2-\sum_i v_i^2x_i^2
\right]
$$

FM learns pairwise interactions among sparse categorical features without manually enumerating every cross.

### 5.5 DeepFM

$$
\hat y=\sigma(y_{FM}(x)+y_{DNN}(x))
$$

DeepFM keeps FM's low-order interactions and adds a deep network for higher-order nonlinear behavior. The FM and DNN branches share embeddings.

### 5.6 Deep And Cross Network

$$
x_0=[\text{sparse embeddings};\text{dense features}]
$$

$$
x_{l+1}^{cross}=x_l^{cross}+x_0(w_l^Tx_l^{cross})+b_l
$$

$$
\hat y=\sigma(w_o^T[x_{L_c}^{cross};h_{L_d}]+b_o)
$$

DCN explicitly builds bounded-degree crosses while an MLP captures flexible nonlinear patterns.

### 5.7 DLRM-Style Ranking

$$
z_d=MLP_{bottom}(x_{dense})
$$

$$
e_j=E_j(x_j), \qquad j=1,\ldots,m
$$

$$
\mathcal{I}=\{z_d^Te_j\}\cup\{e_a^Te_b:1\le a<b\le m\}
$$

$$
\hat y=\sigma(MLP_{top}([z_d;e_1;\ldots;e_m;\mathcal{I}]))
$$

DLRM is useful when many sparse categorical fields interact with dense numerical features.

### 5.8 LambdaMART / Learning-To-Rank

LambdaMART uses gradients weighted by the change in NDCG if two items swap order:

$$
\lambda_{i,j}\propto |\Delta NDCG_{i,j}|
\sigma(-s_{i,j}(\hat y_i-\hat y_j))
$$

Use when the product naturally has query/list labels and top positions matter.

### 5.9 DIN And DIEN

Deep Interest Network uses target-aware attention over user history.

$$
a_t=softmax(f_{attn}(e_t,e_c))_t
$$

$$
e_u=\sum_t a_t e_t
$$

The key idea: the same user history should be weighted differently for different candidate items.

DIEN extends this by modeling how interests evolve through time, often with recurrent structure and auxiliary losses.

### 5.10 Multi-Task Ranking

Modern recommenders often predict multiple outcomes.

$$
\mathcal{L}=\sum_{t=1}^{T}\alpha_t\mathcal{L}_t
$$

$$
Utility(u,i)=
w_1P(click)+w_2P(convert)+w_3E[dwell]-w_4P(hide)
$$

| Architecture | Problem solved |
|--------------|----------------|
| ESMM | Post-click conversion is sparse and sample-selection biased. |
| MMoE | Related tasks need shared and task-specific experts. |
| PLE | Separates shared vs task-specific representations more explicitly. |

ESMM factorization:

$$
P(purchase\mid impression)=P(click\mid impression)P(purchase\mid click)
$$

MMoE gate:

$$
g^k(x)=softmax(W^kx),
\qquad
h^k=\sum_j g_j^k f^j(x)
$$

### 5.11 Uplift / Next-Best-Action Ranking

When the action itself changes user behavior, rank by incremental effect, not raw propensity.

$$
\tau(x)=E[Y\mid T=1,X=x]-E[Y\mid T=0,X=x]
$$

Use for retention offers, promotions, interventions, and notifications where you care about incremental lift.

---

## 6. Reranking: Final-List Optimization

The user sees a slate, not isolated item scores. Reranking optimizes list-level quality.

### Hard Filters

Remove candidates that should not be shown:

- unavailable or out of stock
- already consumed
- blocked or unsafe
- regulatory or age restrictions
- duplicated or near-duplicated content
- frequency caps exceeded

### Score Transformation

$$
score'(u,i)=score(u,i)+
\lambda_f Freshness(i)+
\lambda_q Quality(i)-
\lambda_{fatigue}Fatigue(u,i)
$$

Weights should be tuned by offline replay and online experiments.

### Maximal Marginal Relevance

MMR selects items greedily, balancing relevance and diversity:

$$
i^*=\arg\max_{i\in C\setminus S}
[\lambda Rel(u,i)-(1-\lambda)\max_{j\in S}Sim(i,j)]
$$

| Symbol | Meaning |
|--------|---------|
| `C` | Candidate set. |
| `S` | Items already selected into the final slate. |
| `Rel(u,i)` | Relevance or utility score. |
| `Sim(i,j)` | Similarity between candidate and already selected item. |
| `lambda` | Relevance-diversity tradeoff. |

### DPP Reranking

Determinantal Point Processes prefer high-quality, mutually different sets.

$$
P(S)\propto det(L_S)
$$

$$
L_{i,j}=q_i\phi(e_i,e_j)q_j
$$

DPP is elegant but can be more expensive than MMR. It is useful to mention as an advanced diversity method.

### Constrained Slate Reranking

$$
\max_{S:|S|=K}\sum_{i\in S}score(u,i)
\quad
\text{s.t. category/fairness/freshness constraints}
$$

Examples:

- at most two items from one creator
- at least one fresh item
- no repeated category in adjacent slots
- sponsored inventory limits
- marketplace seller fairness
- safety and policy quotas

### Calibration In Reranking

If ranker scores are predicted probabilities, calibrate before combining scores. An uncalibrated score cannot be safely mixed with price, margin, quality, or risk penalties.

---

## 7. Loss Functions

The loss defines what the model learns from data.

| Loss | Formula sketch | Teaches | Use when |
|------|----------------|---------|----------|
| MSE | mean squared error | Numeric rating/value prediction. | Explicit ratings, dwell regression. |
| BCE | `-y log p - (1-y) log(1-p)` | Calibrated binary probability. | CTR/CVR/hide/report rankers. |
| Weighted BCE | weighted positive/negative BCE | Handles imbalance or asymmetric cost. | Rare positives or costly mistakes. |
| Pairwise hinge | `max(0, margin - s_pos + s_neg)` | Positive should beat negative by margin. | Simple pairwise ranking. |
| BPR | `-log sigmoid(s_pos - s_neg)` | Smooth pairwise implicit ranking. | MF/GNN top-K recommendation. |
| Sampled softmax / InfoNCE | positive beats sampled negatives | Retrieval embeddings. | Two-tower and contrastive training. |
| Listwise | distribution over a list | List order. | Learning-to-rank with slate labels. |
| Multi-task | weighted sum of task losses | Joint outcomes. | Click, conversion, dwell, negative feedback. |

### When To Use Each

- Use **BCE** for calibrated ranking probabilities.
- Use **BPR** when only implicit positives and sampled unobserved negatives exist.
- Use **sampled softmax / InfoNCE** for two-tower retrieval.
- Use **listwise/LambdaMART** when list position and graded relevance are directly labeled.
- Use **multi-task losses** when the product has multiple competing outcomes.

---

## 8. Evaluation Metrics

Offline metrics must match the stage and product surface.

### Top-K Relevance

Let `R_u^K` be the top-K recommendations and `G_u` be relevant held-out items.

$$
Precision@K(u)=\frac{|R_u^K\cap G_u|}{K}
$$

$$
Recall@K(u)=\frac{|R_u^K\cap G_u|}{|G_u|}
$$

$$
HitRate@K(u)=\mathbf{1}[R_u^K\cap G_u\ne\emptyset]
$$

Use Recall@K heavily for retrieval, because the ranker cannot recover missed candidates.

### NDCG

$$
CG@K=\sum_{r=1}^{K}rel_r
$$

$$
DCG@K=\sum_{r=1}^{K}\frac{2^{rel_r}-1}{\log_2(r+1)}
$$

$$
NDCG@K=\frac{DCG@K}{IDCG@K}
$$

NDCG rewards putting the most relevant items near the top and supports graded relevance.

### MAP And MRR

$$
AP@K(u)=
\frac{1}{\min(|G_u|,K)}
\sum_{r=1}^{K}Precision@r(u)\cdot rel_r
$$

$$
MAP@K=\frac{1}{|U|}\sum_{u\in U}AP@K(u)
$$

$$
MRR=\frac{1}{N}\sum_{n=1}^{N}\frac{1}{rank_n^{first\ relevant}}
$$

Use MAP for multiple binary relevant items; use MRR when the first good result matters most.

### Probability And Calibration Metrics

| Metric | Measures | Use |
|--------|----------|-----|
| AUC-ROC | Probability a positive scores above a negative. | General ranking quality. |
| PR-AUC | Precision-recall trade-off for rare positives. | Sparse positives. |
| Log loss | Confidence and correctness. | Calibrated rankers. |
| Brier score | Mean squared probability error. | Calibration. |
| ECE | Expected calibration error by bins. | Probability reliability. |

### Catalog And Slate Health

$$
Coverage=\frac{|\cup_u R_u^K|}{|I|}
$$

$$
ILD(L)=
\frac{\sum_{i\in L}\sum_{j\in L,j\ne i}(1-sim(i,j))}
{|L|(|L|-1)}
$$

$$
Novelty(i)=-\log_2 P(i)
$$

$$
Serendipity(i,u)=unexpectedness(i,u)\cdot usefulness(i,u)
$$

| Metric | Why it matters |
|--------|----------------|
| Coverage | Avoid recommending only a tiny popular subset. |
| Intra-list diversity | Avoid repetitive slates. |
| Novelty | Encourage discovery and long-tail exposure. |
| Serendipity | Recommend relevant but non-obvious items. |
| Provider exposure | Protect marketplace or creator ecosystem health. |

### Offline Evaluation Protocol

- Use temporal splits: train on the past, test on the future.
- Use realistic candidate sets, not only easy sampled negatives.
- Report segment metrics for new users, power users, new items, long-tail items, countries, devices, and protected segments when appropriate.
- Track confidence intervals; tiny metric differences may be noise.
- Do not optimize offline metrics alone; exposure bias makes offline evaluation incomplete.

### A/B Testing

| Parameter | Recommendation-system choice |
|-----------|------------------------------|
| Randomization unit | Usually user/account, not request, for stable personalization. |
| Primary metric | CTR, conversion, watch time, retention, revenue quality, or weighted utility. |
| Guardrails | hide/report, latency, diversity, freshness, creator/seller fairness, safety. |
| Ramp | shadow -> 1% -> 5% -> 25% -> 50% -> 100% if guardrails hold. |
| Duration | Long enough for weekly cycles and delayed labels. |
| Diagnostics | sample ratio mismatch, segment regression, novelty effect, interference. |

Interleaving can compare rankers more sensitively by mixing two algorithms into one list and attributing clicks to the source algorithm. It is powerful but harder to implement and interpret.

---

## 9. Bias, Exploration, And Causal Evaluation

Recommendation systems create the data they later train on. Bias handling is not optional.

### Popularity Bias

Popular items get shown more, receive more interactions, and become even more popular.

Mitigations:

- popularity smoothing
- long-tail boosts in reranking
- exposure caps
- personalized novelty terms
- segment and catalog coverage monitoring
- controlled exploration

### Position Bias

Items near the top receive more clicks even if relevance is unchanged.

$$
P(click\mid u,i,position=k)=
P(examine\mid k)P(relevant\mid u,i,examined)
=\theta(k)r(u,i)
$$

Estimate propensities through randomized buckets, swaps, or intervention harvesting.

### IPS And Doubly Robust Estimation

IPS reweights observed examples by inverse exposure probability:

$$
\hat L_{IPS}=
\frac{1}{|U||I|}
\sum_{(u,i):O_{u,i}=1}
\frac{loss(r_{u,i},\hat r_{u,i})}{P(O_{u,i}=1)}
$$

Doubly robust estimator:

$$
\hat r(u,i)+\frac{c(u,i)-\hat r(u,i)}{\theta(k)}
$$

IPS is unbiased only if propensities are correct and every item has nonzero exposure probability. It can have high variance.

### Exploration vs Exploitation

Pure exploitation maximizes short-term predicted reward but stops learning.

Epsilon-greedy:

$$
action=
\begin{cases}
random\ item, & \text{with probability } \epsilon \\
\arg\max_i Q(u,i), & \text{with probability } 1-\epsilon
\end{cases}
$$

UCB:

$$
score(i)=\hat\mu_i+c\sqrt{\frac{\ln N}{n_i}}
$$

LinUCB:

$$
score(i)=\theta_i^Tx_u+\alpha\sqrt{x_u^TA_i^{-1}x_u}
$$

Thompson sampling:

$$
P(\theta_i)=Beta(\alpha_i,\beta_i)
$$

$$
\tilde\theta_i\sim Beta(\alpha_i,\beta_i),
\qquad
i^*=\arg\max_i\tilde\theta_i
$$

$$
\alpha_{i^*}\leftarrow\alpha_{i^*}+r,
\qquad
\beta_{i^*}\leftarrow\beta_{i^*}+(1-r)
$$

Bandits are useful when feedback is fairly immediate. Full reinforcement learning is theoretically attractive for long-horizon recommendation but much harder to train and evaluate safely.

### Filter Bubbles And Fairness

Monitor:

$$
NDCG_{group\ A}\approx NDCG_{group\ B}
$$

$$
\frac{E[exposure_{provider_i}]}{E[exposure_{provider_j}]}\approx 1
\quad \text{for similar quality}
$$

Mitigations:

- fair exposure constraints
- diversity-aware reranking
- exploration of underexposed categories
- provider and user-segment dashboards
- policy review for sensitive surfaces

---

## 10. Feature Engineering Stack

### User Features

- long-term embeddings from MF/two-tower/GNN
- recent sessions and short-term intent
- category, creator, brand, or topic affinity
- frequency, recency, monetary value
- language, region, device, subscription tier
- negative feedback history

### Item Features

- item ID and learned embedding
- category, tags, creator/seller/provider
- content embeddings from text, image, audio, or video
- price, availability, age, freshness
- historical CTR/CVR/watch time
- quality, trust, moderation, or policy scores

### Context Features

- surface and slot
- time of day and day of week
- device and app version
- location or market
- session length and current intent
- candidate source

### Cross Features

- user-category affinity
- user-creator affinity
- price distance from user's usual range
- query-item or seed-item similarity
- item already seen recently
- candidate source x surface

### Freshness And Serving

| Feature | Update frequency | Serving location |
|---------|------------------|------------------|
| User profile embedding | hourly/daily or online for active users | online feature store / cache |
| Session sequence | per event | request context or streaming store |
| Item embedding | on item creation and scheduled refresh | ANN index |
| Item popularity | minutes/hours | online feature store |
| Inventory/availability | real-time | source-of-truth service or cache |
| Safety/policy status | real-time or near-real-time | policy service / feature store |

Training-serving skew is one of the most common RecSys bugs. Use shared feature definitions, feature versioning, and offline-online parity tests.

---

## 11. Temporal Dynamics

User preference has multiple timescales:

- **Long-term taste:** stable preferences such as language, genre, size, category, or brand.
- **Short-term intent:** the current session, search, cart, location, or recent consumption.
- **Population drift:** seasonality, trends, supply changes, promotions, or policy changes.

TimeSVD++ models temporal drift:

$$
\hat r_{u,i}(t)=\mu+b_i+b_u(t)+q_i^Tp_u(t)
$$

$$
b_u(t)=b_u+\alpha_u sign(t-t_u)|t-t_u|^\beta
$$

Practical production patterns:

- exponential decay on older events
- session features for immediate intent
- separate long-term and short-term user embeddings
- time-aware validation splits
- recent-data weighting
- trend/freshness retrieval source

Random splits are usually wrong for recommender evaluation because they leak future behavior into training.

---

## 12. End-To-End System Design Example

### YouTube-Scale Video Recommendation

```text
User opens home page
  -> fetch user/session/context features
  -> run parallel retrieval sources:
       two-tower ANN
       recent-watch item-item similarity
       subscriptions/follow graph
       trending and fresh content
       content-based fallback
  -> merge, deduplicate, and filter unsafe/unavailable/already-watched videos
  -> rank ~1000 candidates with multi-task model:
       P(click), expected watch time, P(like), P(hide), P(report)
  -> rerank:
       diversity, creator caps, freshness, fatigue, policy, exploration slots
  -> return top K videos
  -> log impressions, position, model versions, features, and outcomes
```

Key design decisions:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Retrieval | multiple sources, not one model | Improves recall and robustness. |
| Ranking objective | watch quality and long-term satisfaction, not click only | Reduces clickbait incentives. |
| Freshness | real-time session features plus frequent item refresh | Captures recent intent and new uploads. |
| Exploration | small controlled slots | Learns about new users/items. |
| Safety | policy filters before and after ranking | Prevents unsafe exposure. |
| Experimentation | user-level A/B tests with guardrails | Validates real product impact. |

---

## 13. Scenario-Based Model Selection

| Scenario | Start with | Upgrade to | Reason |
|----------|------------|------------|--------|
| New product, little data | smoothed popularity + content-based retrieval | hybrid two-tower | Collaborative data is sparse. |
| E-commerce related products | item-item co-buy/co-view | two-tower + GBDT/DeepFM ranker | Recent product context is predictive. |
| Large video/music feed | multiple retrieval sources | sequential model + multi-task ranker + reranking | Short-term intent and diversity matter. |
| Marketplace with huge catalog | two-tower ANN | DLRM/DCN ranker + fair exposure reranking | Scalable retrieval plus rich ranking. |
| New items with metadata | content-based retrieval | content-aware item tower / PinSage | Metadata helps before interactions arrive. |
| Need explainability | popularity, item-item, GBDT | interpretable features and reason templates | Deep models are harder to explain. |
| Sparse implicit feedback | WRMF/BPR | two-tower with sampled softmax | Implicit positives and many missing entries. |
| Need real-time intent | session kNN / sequence features | SASRec or online user tower | Current session dominates long-term profile. |
| Need incremental impact | propensity baseline | uplift model / causal policy | Raw propensity may target users who would act anyway. |

---

## 14. Common Interview Questions

### Candidate Generation vs Ranking?

Candidate generation searches a huge catalog cheaply and optimizes recall. Ranking scores a much smaller set with richer features and optimizes precision or utility. I would not use the retrieval score alone for final ordering because retrieval models often use approximate search, dot products, and sampled negatives; rankers can use context, cross features, calibrated outcomes, and business constraints.

### Matrix Factorization vs Two-Tower?

Matrix factorization learns user and item embeddings mostly from interaction history. It is simple and strong when collaborative data is dense enough. A two-tower model generalizes this idea with neural networks and side features, so it handles rich metadata, context, and cold-start items better while keeping scalable ANN serving.

### How Do You Debug Bad Recommendations?

Split the system by stage. First check logging, feature freshness, and experiment assignment. Then check retrieval recall: are good items reaching the ranker? Next inspect ranker calibration, feature drift, label leakage, segment metrics, and candidate-source mix. Finally check reranking rules such as diversity, freshness, policy filters, and frequency caps. Compare against popularity and item-item baselines and inspect examples by segment.

### Which Metrics Would You Report?

For retrieval, Recall@K and source coverage. For ranking, NDCG@K/MAP/MRR depending on the surface, plus calibration metrics if scores are probabilities. For product impact, CTR, conversion, dwell/watch time, retention, revenue quality, and negative feedback. For guardrails, latency, diversity, novelty, safety, fairness, and provider exposure.

### How Do You Handle Cold Start?

For new users, use onboarding, session context, location/language, popularity, and exploration. For new items, use content embeddings, metadata, creator/seller priors, and exploration slots. For a new system, start content-first, log impressions rigorously, and transition to collaborative and hybrid models as data accumulates.

### How Do You Balance Diversity And Relevance?

Train the ranker for calibrated item-level utility, then optimize the final slate with reranking. Use MMR, DPP, or constrained optimization to enforce diversity, freshness, fatigue, and policy constraints. Measure both relevance metrics like NDCG and slate-health metrics like coverage, novelty, and intra-list diversity.

### Why Can Offline Metrics Fail?

Logs are exposure-biased: they only contain outcomes for items the old system showed. Random splits can leak future behavior. Sampled negatives can make the problem unrealistically easy. Offline metrics are useful for model selection, but final decisions require online experiments with primary and guardrail metrics.

---

## 15. Adjacent Topic: RAG vs Recommendation Retrieval

RAG retrieval and recommender retrieval share vector search, reranking, and evaluation ideas, but the objective is different.

| System | Retrieves | Optimizes |
|--------|-----------|-----------|
| Recommendation | items/actions for a user and context | product utility, engagement quality, satisfaction, safety |
| RAG | evidence chunks for a query | factual grounding, answer support, citation quality |

If asked about RAG specifically, discuss chunking, metadata, ACLs, dense/sparse hybrid retrieval, reranking, context construction, generation, and faithfulness evaluation. Keep it separate from recommendation system design unless the product is recommending documents or knowledge assets.

---

## 16. Canonical References

- GroupLens collaborative filtering and item-item CF
- Koren, Bell, and Volinsky - Matrix Factorization Techniques for Recommender Systems
- Hu, Koren, and Volinsky - Collaborative Filtering for Implicit Feedback Datasets
- Rendle et al. - Bayesian Personalized Ranking
- Covington, Adams, and Sargin - Deep Neural Networks for YouTube Recommendations
- Cheng et al. - Wide & Deep Learning for Recommender Systems
- Guo et al. - DeepFM
- Wang et al. - Deep & Cross Network
- Naumov et al. - Deep Learning Recommendation Model for Personalization and Recommendation Systems
- Zhou et al. - Deep Interest Network and DIEN
- He et al. - LightGCN
- Ying et al. - Graph Convolutional Neural Networks for Web-Scale Recommender Systems / PinSage
- Joachims et al. - unbiased learning-to-rank and counterfactual evaluation
