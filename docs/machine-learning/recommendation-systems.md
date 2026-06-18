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

### Label Quality And Attribution

| Concern | Production control |
|---------|--------------------|
| **Delayed outcomes** | Define attribution windows by event type; freeze or update labels consistently when late conversions arrive. |
| **Duplicate events** | Use event IDs and idempotent ingestion so retries do not inflate impressions or outcomes. |
| **Bots, fraud, accidental actions** | Filter or down-weight non-human and low-intent events before training. |
| **Identity changes** | Version account/device joins and avoid leaking future identity resolution into historical features. |
| **Deletes and privacy** | Propagate consent, retention, and deletion requirements through logs, features, embeddings, and training snapshots. |
| **Availability mismatch** | Do not train on items that were ineligible, out of stock, blocked, or unavailable in the serving context. |

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

### Reliability And Fallbacks

- Give each stage a deadline and trace span; cancel downstream work when the request budget is exhausted.
- Fall back in layers: cached personalized slate, item-item or popularity source, then a safe editorial/default list.
- Version model, feature definitions, embedding model, ANN index, filters, and reranking policy as a compatible release bundle.
- Monitor per-source timeout/error rate, candidate count, ANN recall canaries, empty-slate rate, feature freshness, and fallback frequency.
- Never let a retrieval or ranking failure bypass eligibility, safety, inventory, or policy filters.

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
\operatorname{sim}(u,v)=
\frac{\sum_{i\in I_u\cap I_v}(r_{u,i}-\bar r_u)(r_{v,i}-\bar r_v)}
{\sqrt{\sum_{i\in I_u\cap I_v}(r_{u,i}-\bar r_u)^2}
\,\sqrt{\sum_{i\in I_u\cap I_v}(r_{v,i}-\bar r_v)^2}}
$$

User-based prediction:

$$
\hat r(u,i)=\bar r_u+
\frac{\sum_{v\in N_k(u)}\operatorname{sim}(u,v)(r_{v,i}-\bar r_v)}
{\sum_{v\in N_k(u)} |\operatorname{sim}(u,v)|}
$$

Item-item score:

$$
\operatorname{score}(u,j)=\sum_{i\in H_u}w_{u,i}\operatorname{sim}(i,j)
$$

| Method | Scales better when | Weakness |
|--------|--------------------|----------|
| User-based CF | User base is stable and small. | Similar users change often; expensive with many users. |
| Item-based CF | Item catalog is more stable than user activity. | New items need interactions or content fallback. |

In practice, item-item co-visitation is a strong production retrieval source because item similarities can be precomputed.

### 4.3 Explicit Matrix Factorization

For explicit ratings, matrix factorization learns dense user and item vectors over observed entries.

$$
\hat y_{u,i}=\mu+b_u+b_i+p_u^Tq_i
$$

$$
\mathcal{L}=
\sum_{(u,i)\in\Omega}(y_{u,i}-\hat y_{u,i})^2+
\lambda\left(
\sum_u(\lVert p_u\rVert_2^2+b_u^2)+
\sum_i(\lVert q_i\rVert_2^2+b_i^2)
\right)
$$

| Variant | What it adds | Use when |
|---------|--------------|----------|
| Basic MF / Funk SVD | User and item vectors optimized over observed entries. | Explicit ratings baseline. |
| Biased MF | Global, user, and item bias terms. | Almost always better than plain MF for ratings. |
| Explicit ALS | Alternating least-squares updates for the squared-error objective. | Stable distributed optimization when biases are absent or handled separately. |
| SVD++ | Implicit-history vectors. | Ratings plus implicit history. |

For a no-bias explicit ALS formulation, let \(Q_{\Omega_u}\) contain item vectors for items rated by user \(u\):

$$
p_u=(Q_{\Omega_u}^TQ_{\Omega_u}+\lambda I)^{-1}Q_{\Omega_u}^Ty_u
$$

SVD++:

$$
\hat r_{u,i}=\mu+b_u+b_i+q_i^\top\left(p_u+|N(u)|^{-1/2}\sum_{j\in N(u)}y_j\right)
$$

### 4.4 Implicit ALS / WRMF

Implicit feedback separates binary preference from confidence. Use \(a_{u,i}\) for preference to avoid confusing it with the user vector \(p_u\) above:

$$
a_{u,i}=\mathbf{1}[r_{u,i}>0]
$$

$$
c_{u,i}=1+\alpha r_{u,i}
\qquad \text{or} \qquad
c_{u,i}=1+\alpha\log(1+r_{u,i}/\epsilon)
$$

$$
\min_{X,Y}
\sum_{u,i}c_{u,i}(a_{u,i}-x_u^Ty_i)^2+
\lambda(\lVert X\rVert_F^2+\lVert Y\rVert_F^2)
$$

With \(C_u=\operatorname{diag}(c_{u,1},\ldots,c_{u,|I|})\), \(a_u\) the user preference vector, and \(Y\) the item-factor matrix, the user update is:

$$
x_u=(Y^TC_uY+\lambda I)^{-1}Y^TC_ua_u
$$

WRMF sums over all items: missing interactions have preference zero but low confidence, so they are weak unknowns rather than strong negatives. Repeated actions increase confidence.

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

Negative sampling makes retrieval training scalable, but it also defines what the model learns to treat as irrelevant. An item with no interaction may be disliked, unseen, unavailable, or simply never exposed; **unobserved is not automatically negative**.

| Strategy | Benefit | Risk |
|----------|---------|------|
| Uniform negatives | Simple and broad. | Too easy; weak top-K discrimination. |
| Popularity-based negatives | Teaches competition against plausible items. | Can over-penalize popular items. |
| In-batch negatives | Efficient for two-tower training. | Batch distribution bias. |
| Hard negatives | Improves top-rank quality. | False negatives can hurt learning. |
| Exposure-aware negatives | Uses shown-but-not-engaged items, which are more meaningful than random unseen items. | Inherits position bias and the old recommendation policy. |
| Mixed strategy | Production default. | Needs tuning and monitoring. |

For sampled-softmax objectives, a log-\(q\) correction can compensate for a nonuniform proposal distribution. The exact correction depends on the estimator and expected sample count; it is not a generic rule for BPR, every InfoNCE setup, or impression labels:

$$
\tilde s(u,j)=s(u,j)-\log q(j)
$$

**Production recipe**

1. Start with in-batch negatives for efficient matrix-based training.
2. Remove known positives, duplicate items, near-duplicates, and positive interactions from other label windows to reduce accidental false negatives.
3. Mix random or popularity-weighted negatives for catalog coverage.
4. Once the model is stable, mine difficult candidates from the current ANN index and mix them with easier negatives rather than training only on hard negatives.
5. Treat shown-but-not-engaged items as ranking labels only after defining examination assumptions, delayed-positive windows, accidental interactions, and position/context propensities. Position as an input feature does not itself remove exposure bias.
6. Keep multi-positive examples from becoming in-batch negatives for one another, and monitor mismatch between the sampler and the serving candidate distribution.
7. Monitor sampler composition, false-negative rate, popularity shift, long-tail recall, and segment performance.

Use sampled softmax / InfoNCE for retrieval embeddings. Use impression-level binary or listwise labels for the downstream ranker when calibrated engagement probability matters.

### 4.9 ANN Vector Search

Approximate nearest neighbor search makes embedding retrieval feasible at large catalog sizes.

$$
\operatorname{TopK}(q)=\operatorname*{arg\,topK}_{x_i\in X}\;\operatorname{sim}(q,x_i)
$$

$$
\mathrm{Recall@K}_{ANN}=
\frac{|\operatorname{TopK}_{\text{exact}}(q)\cap \operatorname{TopK}_{\text{ANN}}(q)|}{K}
$$

| Index family | How it works | Key parameters | Use when |
|--------------|--------------|----------------|----------|
| Flat / exact | Scores every item vector. | batch size, hardware, metric | Small catalogs, offline ground truth, and exact-recall canaries. |
| HNSW | Layered proximity graph with greedy search. | `M`, `efConstruction`, `efSearch` | Low latency and high recall when memory is available. |
| IVF | Partitions vectors and searches selected cells. | `nlist`, `nprobe` | Large catalogs needing lower query cost. |
| IVF-PQ | Adds product-quantized codes to IVF. | PQ code size plus IVF parameters | Very large or memory-constrained catalogs. |

FAISS implements flat, HNSW, IVF, PQ, and GPU variants. ScaNN combines partitioning, quantization, and shortlist reordering. Managed vector databases add filtering, persistence, sharding, and operations; they are implementations/services rather than ANN algorithms.

Approximate retrieval should over-fetch and exactly rescore a shortlist when the original vectors or a higher-fidelity scorer are available:

$$
C_{K'}=\operatorname{TopK}_{K',\text{approx}}(q), \qquad K'>K
$$

Tune the end-to-end recall-latency-memory curve, including metric compatibility, vector normalization, metadata-filter selectivity, sharding, updates/deletes, index staleness, and model/index version compatibility.

$$
\operatorname{FinalTopK}(q)=\operatorname{TopK}_{x_i\in C_{K'}}(q^\top x_i)
$$

### 4.10 Content-Based And Hybrid Retrieval

Content-based retrieval works before collaborative data exists.

$$
v_u=\frac{\sum_{i\in H_u}w_{u,i}v_i}{\sum_{i\in H_u}w_{u,i}}
$$

$$
\operatorname{score}(u,j)=\cos(v_u,v_j)
$$

Use content signals for:

- new items
- anonymous users with session context
- sparse catalogs
- compliance-sensitive explanations
- cold-start bootstrapping

Hybrid retrieval merges several sources: popularity, item-item, two-tower ANN, content similarity, graph walks, recent trends, and editorial or business sources.

#### Candidate Source Fusion

Source scores are usually not comparable. Give each source a latency and candidate budget, union and deduplicate by canonical item ID, then fuse by source quotas, normalized scores, reciprocal-rank fusion, or a learned source-aware model. Preserve source IDs and source ranks as downstream features.

Monitor recall, unique contribution, overlap, latency, freshness, and failure rate per source. A source that produces many candidates but no incremental relevant items should not keep its full budget.

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

Ranking scores a smaller candidate set with richer features. The output may be a probability, an expected outcome, a pairwise/listwise score, or a vector of predicted outcomes. Logistic output is not automatically calibrated after negative sampling, class weighting, drift, or candidate-policy changes.

### 5.1 Logistic CTR Ranker And Calibration

$$
P(y=1\mid x)=\sigma(w^Tx+b)
$$

$$
\mathcal{L}_{BCE}=
-\sum_n[y_n\log p_n+(1-y_n)\log(1-p_n)]
$$

Use as a fast interpretable baseline. When probabilities matter, calibrate on the actual serving candidate distribution and inspect reliability by segment.

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
\left\lVert\sum_i v_ix_i\right\rVert_2^2-
\sum_i \lVert v_i\rVert_2^2x_i^2
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
\operatorname{score}'(u,i)=\operatorname{score}(u,i)+
\lambda_f \operatorname{Freshness}(i)+
\lambda_q \operatorname{Quality}(i)-
\lambda_{fatigue}\operatorname{Fatigue}(u,i)
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

For order-dependent constraints, use assignment variable \(x_{i,k}\in\{0,1\}\), indicating that item \(i\) is placed at position \(k\):

$$
\max_x \sum_i\sum_{k=1}^{K}d_k\,x_{i,k}\operatorname{score}(u,i)
$$

subject to:

$$
\sum_i x_{i,k}=1\ \forall k,
\qquad
\sum_k x_{i,k}\le 1\ \forall i
$$

Additional linear constraints can cap a creator/category, require fresh inventory, control sponsored slots, or enforce position-discounted provider exposure. Adjacency constraints such as "no repeated category in neighboring positions" require position-aware variables; an unordered set objective cannot express them.

- at most two items from one creator
- at least one fresh item
- no repeated category in adjacent slots
- sponsored inventory limits
- marketplace seller fairness
- safety and policy quotas

### Calibration In Reranking

If a score is interpreted as a probability or expected outcome, calibrate it on serving-distribution data before multiplying it by value or cost. Other rerankers may use normalized utilities or learned score transformations instead. The requirement is a meaningful, stable scale, not probability calibration for every ranking score.

---

## 7. Loss Functions

The loss defines what the model learns from data.

| Loss | Formula sketch | Teaches | Use when |
|------|----------------|---------|----------|
| MSE | mean squared error | Numeric rating/value prediction. | Explicit ratings, dwell regression. |
| BCE | `-y log p - (1-y) log(1-p)` | Binary probability under the training distribution. | CTR/CVR/hide/report rankers; recalibrate when sampling or serving distribution differs. |
| Weighted BCE | weighted positive/negative BCE | Handles imbalance or asymmetric cost. | Rare positives or costly mistakes. |
| Pairwise hinge | `max(0, margin - s_pos + s_neg)` | Positive should beat negative by margin. | Simple pairwise ranking. |
| BPR | `-log sigmoid(s_pos - s_neg)` | Smooth pairwise implicit ranking. | MF/GNN top-K recommendation. |
| Sampled softmax / InfoNCE | positive beats sampled negatives | Retrieval embeddings. | Two-tower and contrastive training. |
| Listwise | distribution over a list | List order. | Learning-to-rank with slate labels. |
| Multi-task | weighted sum of task losses | Joint outcomes. | Click, conversion, dwell, negative feedback. |

### When To Use Each

- Use **BCE** for binary probability estimation, then verify or recalibrate on serving-distribution data when probabilities matter.
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
\mathrm{Precision@K}(u)=\frac{|R_u^K\cap G_u|}{K}
$$

$$
\mathrm{Recall@K}(u)=\frac{|R_u^K\cap G_u|}{|G_u|}
$$

$$
\mathrm{HitRate@K}(u)=\mathbf{1}[R_u^K\cap G_u\ne\emptyset]
$$

Use Recall@K heavily for retrieval, because the ranker cannot recover missed candidates.

Define the evaluation population before averaging. Exclude or separately report users with no relevant held-out item; for \(IDCG@K=0\), define NDCG as zero or exclude consistently. Report macro averages across users and, when useful, micro/event-weighted results. Full-catalog and sampled-candidate metrics are not directly comparable unless the candidate set and sampler are fixed.

### NDCG

$$
\mathrm{CG@K}=\sum_{r=1}^{K}\operatorname{rel}_r
$$

$$
\mathrm{DCG@K}=\sum_{r=1}^{K}\frac{2^{\operatorname{rel}_r}-1}{\log_2(r+1)}
$$

$$
\mathrm{NDCG@K}=\frac{\mathrm{DCG@K}}{\mathrm{IDCG@K}}
$$

NDCG rewards putting the most relevant items near the top and supports graded relevance.

### MAP And MRR

$$
\mathrm{AP@K}(u)=
\frac{1}{\min(|G_u|,K)}
\sum_{r=1}^{K}\mathrm{Precision@r}(u)\cdot \operatorname{rel}_r
$$

$$
\mathrm{MAP@K}=\frac{1}{|U|}\sum_{u\in U}\mathrm{AP@K}(u)
$$

$$
\operatorname{RR}_n=
\begin{cases}
1/r_n, & \text{if a relevant result is retrieved}\\
0, & \text{otherwise}
\end{cases}
\qquad
\operatorname{MRR}=\frac{1}{N}\sum_{n=1}^{N}\operatorname{RR}_n
$$

Use MAP for multiple binary relevant items; use MRR when the first good result matters most.

### Probability And Calibration Metrics

| Metric | Measures | Use |
|--------|----------|-----|
| AUC-ROC | Probability a sampled positive scores above a sampled negative. | Broad discrimination; may be dominated by easy negatives and ignore top-rank quality. |
| PR-AUC | Precision-recall trade-off for rare positives. | Sparse positives. |
| Log loss | Confidence and correctness. | Calibrated rankers. |
| Brier score | Mean squared probability error. | Overall probabilistic accuracy; mixes calibration and refinement. |
| ECE | Expected calibration error by bins. | Probability reliability. |

### Catalog And Slate Health

$$
\operatorname{Coverage}=\frac{\left|\bigcup_u R_u^K\right|}{|I|}
$$

$$
\operatorname{ILD}(L)=
\frac{\sum_{i\in L}\sum_{j\in L,j\ne i}(1-\operatorname{sim}(i,j))}
{|L|(|L|-1)}
$$

$$
\operatorname{Novelty}(i)=-\log_2 P(i)
$$

$$
\operatorname{Serendipity}(i,u)=\operatorname{unexpectedness}(i,u)\cdot\operatorname{usefulness}(i,u)
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
- Use full-catalog retrieval or a fixed realistic candidate protocol; metrics from different negative samplers are not comparable.
- Report candidate-source recall, ranker quality conditional on retrieval, and end-to-end recall so a ranking improvement cannot hide retrieval loss.
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

### Production Feedback Loop

```text
policy -> exposure -> observed interaction -> label construction -> training -> next policy
```

The model changes which labels can be observed. Monitor exposure distribution, concentration, source mix, creator/provider outcomes, and long-term user satisfaction alongside clicks. Preserve randomized exploration or holdout traffic with known propensities, use temporal attribution windows for delayed outcomes, and review whether retraining cadence amplifies short-lived trends or harmful homogenization.

### Position Bias

Items near the top receive more clicks even if relevance is unchanged.

Under the position-based model (PBM), let \(C\) denote click, \(E\) examination, \(R\) relevance, and \(k\) rank position. PBM assumes examination depends on position and separates from relevance:

$$
\begin{aligned}
P(C\mid u,i,k)
&=P(E\mid k)P(R\mid u,i,E)\\
&=\theta(k)r(u,i)
\end{aligned}
$$

Estimate propensities through randomized buckets, swaps, or intervention harvesting.

PBM is an assumption, not a probability identity. Cascade or dependent-click models are more appropriate when examination depends on previous items or clicks in the slate.

### IPS, SNIPS, And Doubly Robust Estimation

#### Propensity-Weighted Learning

For \(N\) eligible exposure opportunities, let \(O_t\) indicate whether the outcome is observed and \(e_t=P(O_t=1\mid x_t,a_t)\). A Horvitz-Thompson risk estimator is:

$$
\hat L_{IPS}=
\frac{1}{N}\sum_{t=1}^{N}
\frac{O_t\,\ell(y_t,\hat y_t)}{e_t}
$$

The target population, observation indicator, and propensity model must match the estimand. Item-level examination weights do not automatically debias an entire ordered slate.

#### Off-Policy Evaluation

For logged policy evaluation, define importance weight:

$$
w_t=\frac{\pi(a_t\mid x_t)}{\pi_0(a_t\mid x_t)}
$$

where \(\pi_0\) is the logging policy, \(\pi\) is the candidate policy, and \(r_t\) is the observed reward. Self-normalized IPS (SNIPS) divides by the total weight:

$$
\hat V_{IPS}=\frac{1}{T}\sum_{t=1}^{T}w_t r_t
$$

$$
\hat V_{SNIPS}=
\frac{\sum_{t=1}^{T}w_t r_t}
{\sum_{t=1}^{T}w_t}
$$

SNIPS is often lower variance than plain IPS, but it is biased in finite samples. Both methods fail when the logging policy had no support for actions the candidate policy wants to take.

Doubly robust policy-value estimator:

$$
\hat r(x,\pi)=\sum_a\pi(a\mid x)\hat r(x,a)
$$

$$
\hat V_{DR}=
\frac{1}{T}\sum_{t=1}^{T}
\left[
\hat r(x_t,\pi)
+w_t\left(r_t-\hat r(x_t,a_t)\right)
\right]
$$

| Control | Why it matters |
|---------|----------------|
| **Randomized or exploration traffic** | Provides known propensities and support beyond the old ranker's narrow choices. |
| **Weight clipping / capping** | Prevents a few tiny propensities from dominating the estimate, at the cost of some bias. |
| **Effective sample size** | Use \(\mathrm{ESS}=(\sum_t w_t)^2/\sum_t w_t^2\) to detect when nominally large logs contain little usable counterfactual information because weights are concentrated. |
| **Propensity diagnostics** | Check calibration, missing support, position/context dependence, and logging-policy version. |
| **Doubly robust estimation** | Combines a reward model with propensity weighting; remains consistent if either component is correct under standard assumptions. |

These estimators require a well-defined action, correct propensity logging, consistency, and overlap: the logging policy must assign positive probability wherever the candidate policy does. Deterministic logging policies provide no support for unseen actions. Clipping reduces variance but introduces bias. Slate actions, interference between users/items, and sequential recommendations require estimators matching that structure; one-step item propensities are insufficient.

Report confidence intervals and compare IPS, SNIPS, doubly robust estimates, effective sample size, and direct reward-model estimates instead of trusting one counterfactual number.

### Exploration vs Exploitation

Pure exploitation maximizes short-term predicted reward but stops learning.

Epsilon-greedy:

$$
\operatorname{action}=
\begin{cases}
\text{random item}, & \text{with probability } \epsilon \\
\arg\max_i Q(u,i), & \text{with probability } 1-\epsilon
\end{cases}
$$

UCB:

$$
\operatorname{score}(i)=\hat\mu_i+c\sqrt{\frac{\ln N}{n_i}}
$$

LinUCB:

$$
\operatorname{score}(i)=\theta_i^\top x_u+\alpha\sqrt{x_u^\top A_i^{-1}x_u}
$$

Thompson sampling:

$$
P(\theta_i)=\mathrm{Beta}(\alpha_i,\beta_i)
$$

$$
\tilde\theta_i\sim \mathrm{Beta}(\alpha_i,\beta_i),
\qquad
i^*=\arg\max_i\tilde\theta_i
$$

$$
\alpha_{i^*}\leftarrow\alpha_{i^*}+r,
\qquad
\beta_{i^*}\leftarrow\beta_{i^*}+(1-r)
$$

Bandits are useful when feedback is fairly immediate. Full reinforcement learning is theoretically attractive for long-horizon recommendation but much harder to train and evaluate safely.

### Fairness

Define the fairness target for the product: parity, proportional-to-merit exposure, minimum guarantees, or bounded disparity. Raw item counts are insufficient because top positions receive more attention. With position discount \(d_k\), provider exposure can be written:

$$
\operatorname{Exposure}(g)=
\mathbb{E}\left[\sum_{k=1}^{K}d_k\,
\mathbf{1}[\operatorname{provider}(i_k)=g]\right]
$$

Monitor user-group relevance and outcome quality separately from provider exposure. Equal exposure is not automatically fair when eligibility or quality differs; the chosen target must be explicit and audited.

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
- content embeddings from text, image, or video
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

The following is a simplified temporal matrix-factorization illustration, not the full TimeSVD++ formulation:

$$
\hat r_{u,i}(t)=\mu+b_i+b_u(t)+q_i^\top p_u(t)
$$

$$
b_u(t)=b_u+\alpha_u \operatorname{sign}(t-t_u)|t-t_u|^\beta
$$

Here \(t_u\) is a user reference time and \(\beta\) controls the drift shape. Full TimeSVD++ also includes time-varying item/user terms and implicit-history factors; use it only when that additional complexity is justified.

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

RAG retrieval and recommender retrieval share vector search, reranking, and evaluation ideas, but their downstream decision and supervision differ.

| System | Retrieval output is used to | Primary optimization |
|--------|-----------------------------|----------------------|
| Recommendation | Select or order items/actions shown to a user. | User/platform utility, satisfaction, safety, and ecosystem health. |
| RAG | Supply evidence to a generator. | Evidence relevance/coverage plus end-to-end correctness, grounding, and citation support. |
| Personalized RAG | Select user-relevant evidence for generation. | Preserve factual relevance, ACLs, provenance, and citation support while using personalization only where appropriate. |

The content type does not decide whether a system is RAG or recommendation. The deciding question is whether retrieval selects an item/action for user utility or supplies evidence for a generated answer. If asked about RAG, discuss chunking, metadata, ACLs, dense/sparse/structured retrieval, reranking, context construction, generation, and faithfulness evaluation.

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
