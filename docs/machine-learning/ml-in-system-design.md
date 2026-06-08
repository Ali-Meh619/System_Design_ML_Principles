# Machine Learning in System Design

> Production ML is the system that turns raw product events into reliable predictions in a live application. The hard parts are data contracts, feature processing, feature storage, training, deployment, experiments, monitoring, retraining, and rollback.

---

## Interview Answer Spine

When asked to design a production ML system, answer in this order:

1. **Define the prediction problem:** input, output, decision owner, freshness, latency, risk, and what happens when the model is unavailable.
2. **Design the data and feature pipeline:** event logging, data quality, feature definitions, offline/online feature stores, backfills, and point-in-time correctness.
3. **Design the training pipeline:** labeled dataset creation, temporal splits, model training, evaluation, experiment tracking, reproducible artifacts, and model registry.
4. **Design the serving path:** request validation, online feature lookup, inference service, thresholding or decision policy, fallbacks, latency budgets, and audit logs.
5. **Design launch and operations:** shadow/canary/champion-challenger rollout, A/B test parameters, monitoring, drift detection, retraining, rollback, and incident response.

The strongest interview signal is not naming a model. It is showing that the model is one component in a larger, observable production system.

---

## Requirements To Clarify First

| Question | Why it matters |
|----------|----------------|
| What is the prediction target? | Defines labels, features, model family, and offline metrics. |
| Is the decision real-time or batch? | Determines serving path, feature freshness, and latency budget. |
| What is the action after prediction? | A probability is rarely the final product behavior; policy and thresholds matter. |
| What is the cost of false positives vs false negatives? | Drives threshold tuning, guardrails, and escalation paths. |
| How fresh must features be? | Determines batch, streaming, or request-time feature computation. |
| What is the p95/p99 latency budget? | Forces trade-offs among feature calls, model size, batching, and fallback behavior. |
| What compliance or explainability is required? | Affects logging, retention, access control, model choice, and audit trails. |
| How quickly do labels arrive? | Determines evaluation delay, retraining cadence, and experiment duration. |

### Example Requirement Statement

For a real-time fraud-risk model:

- Input: payment request plus user, device, merchant, and recent activity features.
- Output: calibrated fraud probability and reason codes.
- Decision: allow, step-up authentication, manual review, or block.
- Latency: p95 under 100 ms end-to-end; model inference under 10 ms.
- Freshness: velocity features updated within seconds.
- Guardrails: false decline rate, approval rate, dispute rate, latency, timeout rate.

---

## End-To-End Production Architecture

```text
Product apps and services
        |
        v
Event contracts + logging SDK
        |
        v
Message bus / event log --------------+
        |                              |
        v                              v
Raw data lake / warehouse       Streaming feature jobs
        |                              |
        v                              v
Data quality checks            Online feature store
        |
        v
Offline feature generation
        |
        v
Offline feature store
        |
        v
Training dataset builder
        |
        v
Training / tuning / evaluation
        |
        v
Model registry + approvals
        |
        v
Deployment pipeline
        |
        v
Inference service <---------- Online feature store
        |
        v
Prediction / decision logs
        |
        v
Monitoring, experiments, labels, retraining
```

### Core Production Components

| Component | Responsibility | Common tools |
|-----------|----------------|--------------|
| Event pipeline | Durable ingestion of product events and labels | Kafka, Kinesis, Pub/Sub, Snowplow |
| Data lake / warehouse | Long-term raw and curated data storage | S3/GCS, BigQuery, Snowflake, Databricks |
| Feature pipeline | Batch, streaming, and request-time transformations | Spark, Flink, Beam, dbt, Python |
| Feature store | Shared offline and online feature access | Feast, Tecton, Databricks Feature Store |
| Training orchestrator | Repeatable DAGs for datasets, training, evaluation | Airflow, Dagster, Kubeflow, SageMaker |
| Experiment tracker | Parameters, metrics, artifacts, lineage | MLflow, Weights & Biases, Neptune |
| Model registry | Versioned model artifacts and promotion states | MLflow Registry, SageMaker Registry |
| Serving platform | Low-latency prediction service | FastAPI, Triton, TorchServe, KServe, BentoML |
| Monitoring | Data, feature, prediction, label, and system health | Prometheus, Grafana, Evidently, WhyLabs, Arize |

---

## Data Ingestion And Contracts

The ML system is only as reliable as its logged data. Event contracts should be treated like API contracts.

### What Every Event Should Include

| Field | Purpose |
|-------|---------|
| `event_id` | Idempotency and deduplication. |
| `event_time` | When the user or system action happened. |
| `ingest_time` | When the pipeline received it; used for late-event analysis. |
| `entity_ids` | User, account, transaction, device, merchant, item, organization, or session identifiers. |
| `schema_version` | Allows controlled schema migration. |
| `source_service` | Debugs upstream ownership and bad producers. |
| `model_version` | Joins predictions to the model that produced them. |
| `feature_version` | Joins predictions to the feature definitions used at serving time. |
| `decision` | The product action taken after prediction. |
| `outcome_label` | Delayed ground truth when it becomes available. |

### Data Contract Checks

- Required fields are present and not null.
- IDs use canonical formats and stable namespaces.
- Timestamps are valid, monotonic where expected, and timezone-safe.
- Categorical values are in known vocabularies or explicitly marked unknown.
- Numeric features satisfy ranges, units, and type expectations.
- Duplicate rates, late-arrival rates, and schema-version mixes are monitored.

### Late And Corrected Data

Real systems receive late or corrected data. Design for it:

- use event time for feature windows, not only processing time
- keep immutable raw logs
- support replay and backfill
- tag corrected events with version and correction reason
- make downstream jobs idempotent
- track watermark lag for streaming jobs

---

## Feature Processing

Production features come from three computation modes. Good systems use all three deliberately.

| Mode | Computed when | Examples | Trade-off |
|------|---------------|----------|-----------|
| Batch features | Hourly, daily, or weekly | 30-day average spend, account age, historical defect rate | Cheap and stable, but stale. |
| Streaming features | Continuously from event streams | transactions in last 5 minutes, failed logins in last hour | Fresh, but harder to operate. |
| Request-time features | Inside the serving request | request amount, device fingerprint, current country | Freshest, but consumes latency budget. |

### Common Feature Types

| Feature type | Examples | Production concern |
|--------------|----------|--------------------|
| Entity attributes | account age, merchant category, plan tier | Slowly changing dimensions and historical correctness. |
| Aggregates | count, sum, average, max over time windows | Window definition, event-time correctness, late events. |
| Ratios | chargeback rate, conversion rate, error rate | Division by zero, smoothing, low-sample noise. |
| Temporal features | hour of day, day of week, seasonality | Timezone and daylight-saving correctness. |
| Text/image embeddings | moderation text embedding, document vector, image risk score | Version embeddings by model and preprocessing pipeline. |
| Cross features | country x payment method, device x account age | Cardinality control and skew monitoring. |
| Missingness indicators | `is_device_id_missing` | Missingness can be predictive and should be explicit. |

### Feature Definition Requirements

Each feature should have:

- owner
- entity key
- type and unit
- allowed range or vocabulary
- freshness SLA
- TTL
- backfill strategy
- offline source
- online source
- transformation code version
- null/default behavior
- data quality checks

---

## Feature Store

The feature store exists to prevent **training-serving skew**: the model must see the same feature definitions during training and inference.

### Offline Store vs Online Store

| Store | Used for | Storage | Access pattern | Key requirement |
|-------|----------|---------|----------------|-----------------|
| Offline feature store | Training dataset generation and backtesting | Warehouse, data lake, Parquet, Delta/Iceberg | Batch joins over large history | Point-in-time correctness. |
| Online feature store | Real-time inference | Redis, DynamoDB, Cassandra, Bigtable, online Feast store | Low-latency key-value lookup | Freshness and p95 latency. |

### Point-In-Time Correctness

Training data must only use feature values that were available at the prediction time.

```text
Prediction time: 2026-06-07 10:00

Allowed:
  features computed from events at or before 10:00

Not allowed:
  labels or feature updates generated after 10:00
```

If point-in-time joins are wrong, the model learns from future information and looks excellent offline while failing in production.

### Materialization Pattern

```text
Feature definition
        |
        +--> Backfill offline store for historical training
        |
        +--> Scheduled or streaming job materializes latest values
        |
        +--> Online store serves by entity key at inference
```

### Feature Store Failure Handling

| Failure | Mitigation |
|---------|------------|
| Feature missing | Use explicit default plus missingness flag. |
| Feature stale | Reject if beyond TTL, use fallback feature, or route to safer policy. |
| Online store slow | Deadline feature lookup; serve cached defaults or previous model. |
| Feature schema mismatch | Block deployment with schema validation. |
| Backfill inconsistent with streaming logic | Shared transformation library plus offline-online parity tests. |

---

## Labels And Training Dataset Creation

Labels are product decisions encoded as data. Label design is often harder than modeling.

### Label Design Checklist

- Define exactly what positive and negative mean.
- Record when the label becomes observable.
- Avoid labels that are direct consequences of the old model's decision policy.
- Include delayed labels after a fixed observation window.
- Separate ambiguous, missing, and negative labels.
- Preserve the decision context that affected label availability.
- Version label logic.

### Leakage Traps

| Leakage type | Example | Prevention |
|--------------|---------|------------|
| Future feature leakage | Using next week's account status to predict today's risk. | Point-in-time joins. |
| Target leakage | Feature directly encodes the label, such as `refund_created`. | Feature review and ablation tests. |
| Train-test contamination | Same user/session appears across train and test in a way that leaks state. | Grouped or temporal splits. |
| Post-decision leakage | Using a field populated only after manual review. | Use only data available at decision time. |

### Dataset Versioning

Every training run should be reproducible from:

- raw data snapshot
- feature definitions
- label definition
- join logic
- train/validation/test split
- negative sampling or class weighting policy
- preprocessing code
- random seed
- dependency versions

---

## Training Pipeline

Training should run as a repeatable pipeline, not a notebook.

```text
Validate raw data
  -> build point-in-time dataset
  -> validate features and labels
  -> split by time/group
  -> train baseline
  -> train candidate models
  -> tune hyperparameters
  -> evaluate offline and by segment
  -> produce model artifact
  -> register model with metadata
  -> trigger approval or deployment workflow
```

### Training Pipeline Stages

| Stage | Output |
|-------|--------|
| Data validation | Pass/fail report and anomaly summary. |
| Dataset builder | Versioned training dataset. |
| Baseline model | Reference performance and sanity check. |
| Candidate training | Model artifacts and training logs. |
| Hyperparameter tuning | Best parameters and search history. |
| Evaluation | Offline metrics, slice metrics, calibration, error analysis. |
| Packaging | Serialized model, preprocessing code, schema, environment. |
| Registration | Model version and promotion state. |

### Model Artifact Contents

A deployable artifact should include:

- model weights or serialized model
- preprocessing and postprocessing code
- input schema
- output schema
- feature list and feature versions
- training dataset version
- metric report
- calibration object if used
- threshold or decision policy version
- dependency lockfile or container image

---

## Offline Evaluation

Offline evaluation answers: "Is this model worth testing in production?"

| Task | Common metrics | Notes |
|------|----------------|-------|
| Binary classification | ROC-AUC, PR-AUC, precision, recall, F1, log loss, Brier score | PR-AUC is more informative for rare positives. |
| Regression | MAE, RMSE, MAPE, pinball loss | RMSE punishes large errors more strongly. |
| Probability estimation | Log loss, Brier score, ECE, reliability diagram | Required when downstream policy uses probability thresholds. |
| Anomaly detection | Precision at investigation capacity, false positive rate, time-to-detect | Labels may be delayed or incomplete. |
| Forecasting | MAE/RMSE by horizon, MAPE/sMAPE, prediction interval coverage | Evaluate by forecast horizon and segment. |

### Calibration

If a model outputs probability, calibration matters:

```text
Predicted risk = 0.80
Expected behavior: about 80 out of 100 similar cases are positive.
```

Common fixes:

- Platt scaling
- isotonic regression
- temperature scaling
- segment-specific calibration

### Segment Evaluation

Never look only at aggregate metrics. Break down by:

- geography
- device or platform
- customer tier
- new vs returning users
- high-volume vs low-volume entities
- language
- product surface
- protected or sensitive groups when legally and ethically appropriate

### Threshold Selection

A classifier usually needs a decision threshold.

| Threshold decision | What to optimize |
|--------------------|------------------|
| Fraud block | Expected loss, false decline rate, review capacity. |
| Manual review | Investigation queue capacity and precision. |
| Content escalation | Safety recall with acceptable moderator load. |
| Churn intervention | Treatment cost vs expected retention lift. |

Choose thresholds on validation data, then verify them online with guardrails.

### Evaluation Ladder

Production evaluation should progress from cheap and safe to realistic and risky.

| Stage | What it gives | Limitation |
|-------|---------------|------------|
| **Unit/component tests** | Schema, feature, preprocessing, and inference-contract checks | Does not prove model quality. |
| **Offline replay** | Fast regression testing on historical labeled examples | Cannot observe how users or systems react to changed decisions. |
| **Simulation** | Tests edge cases and multi-step workflows at scale | Simulator realism can create false confidence. |
| **Shadow mode** | Candidate model sees live traffic but does not affect decisions | Safe, but still observer-only. |
| **Canary rollout** | Small traffic slice experiences the new model | Needs strict guardrails and rollback. |
| **A/B test** | Measures real product impact | Needs traffic, label maturation, and contamination control. |
| **Human review** | Calibrates subtle quality, safety, and edge cases | Expensive, so sample high-value slices. |

Use the earliest stage that can catch a defect, but do not skip online validation for user-impacting decisions.

---

## Model Registry And Governance

The model registry is the control plane for production models.

### Registry Metadata

| Metadata | Why it matters |
|----------|----------------|
| Model version | Immutable deployment identity. |
| Artifact URI | Reproducible retrieval of the exact model. |
| Training dataset version | Data lineage and audit. |
| Feature versions | Detects serving compatibility. |
| Metrics and slices | Promotion evidence. |
| Owner | Incident routing and approval. |
| Approval status | Prevents unreviewed production pushes. |
| Deployment target | Batch job, online endpoint, edge device, or streaming service. |
| Rollback version | Fast recovery. |

### Promotion States

```text
Candidate -> Staging -> Shadow -> Canary -> Production -> Archived
```

For high-risk decisions, require human approval before production promotion.

---

## Model Serving Patterns

| Pattern | Description | Use when |
|---------|-------------|----------|
| Online synchronous serving | Request calls model service and waits for prediction. | Real-time decisions with strict latency. |
| Batch scoring | Periodic job scores many entities and stores results. | Decisions can use precomputed scores. |
| Streaming scoring | Stream processor scores events as they arrive. | Continuous event-driven decisions. |
| Embedded / edge model | Model runs inside client, device, or service process. | Very low latency or offline operation. |
| Human-in-the-loop | Model routes uncertain cases to manual review. | High-risk or low-confidence decisions. |

### Online Serving Path

```text
Request
  -> authenticate / authorize
  -> validate schema
  -> fetch online features
  -> compute request-time features
  -> run model inference
  -> calibrate score
  -> apply decision policy / threshold
  -> log prediction, features, model version, decision
  -> return response
```

### Serving Latency Budget

Example p95 budget for a 100 ms endpoint:

| Step | Budget |
|------|--------|
| API gateway and auth | 10 ms |
| Request validation | 2 ms |
| Online feature lookup | 20 ms |
| Request-time feature computation | 15 ms |
| Model inference | 10 ms |
| Decision policy and logging enqueue | 8 ms |
| Network and buffer | 35 ms |

If features consume the whole budget, the model is irrelevant. Put deadlines around every dependency.

### Serving Reliability Patterns

- load model at startup, not on first request
- health-check model and feature dependencies separately
- use circuit breakers for feature stores and downstream services
- fail closed or fail open based on product risk
- keep a previous model or rules-based fallback warm
- log enough context to replay predictions
- keep request and response schemas backward compatible

---

## Deployment And Rollout

Never replace a high-impact model in one step unless the blast radius is tiny.

| Strategy | What it does | Validates |
|----------|--------------|-----------|
| Shadow deployment | New model receives production traffic but does not affect decisions. | Latency, errors, feature availability, score distribution. |
| Canary rollout | Small traffic percentage uses the new model. | Real decision quality with limited blast radius. |
| Champion-challenger | Current production model stays champion while challenger is compared continuously. | Ongoing model competition and drift response. |
| Blue-green | Two full environments; switch traffic between them. | Infrastructure cutover and fast rollback. |
| Batch backtest before launch | Candidate model scores historical or recent data. | Sanity check before any live exposure. |

### Rollout Checklist

- input schema compatibility checked
- feature list available online
- model artifact immutable
- registry status approved
- shadow run completed
- canary ramp plan approved
- alert thresholds configured
- rollback target verified
- experiment logging verified
- owner and on-call path documented

### Rollback Rule

Rollback must be a product operation, not a debugging project.

- keep the previous model artifact ready
- keep previous decision policy ready
- make config rollback independent from code deploy
- define automatic rollback triggers before launch
- log which predictions were affected by the bad model

---

## A/B Testing For ML Systems

Online experiments answer: "Does this model improve real product outcomes in production?"

### Experiment Design Parameters

| Parameter | Choices / examples | Why it matters |
|-----------|--------------------|----------------|
| Unit of randomization | user, account, session, request, organization | Prevents contamination and repeated re-assignment. |
| Assignment method | deterministic hash of `unit_id + experiment_id` | Keeps users stable across requests. |
| Traffic split | 1/99, 5/95, 50/50 | Controls risk and statistical power. |
| Primary metric | fraud loss, approval rate, conversion, retention, manual review precision | Decides ship/no-ship. |
| Guardrail metrics | latency, error rate, false positive rate, support contacts, revenue, safety | Prevents local metric wins from harming the system. |
| Minimum detectable effect | e.g. 1% relative lift | Determines required sample size. |
| Power | commonly 80% or 90% | Probability of detecting the desired effect. |
| Significance level | commonly 0.05 | False positive tolerance. |
| Duration | fixed days plus label maturation window | Avoids weekday and delayed-label bias. |
| Ramp schedule | 1% -> 5% -> 25% -> 50% -> 100% | Limits blast radius. |
| Holdout policy | long-lived control group or rotating holdout | Measures long-term incremental impact. |

### Deterministic Assignment

```text
bucket = hash(user_id + experiment_id) % 10000

0..999      -> treatment (10%)
1000..9999  -> control (90%)
```

Assignment should be logged with every prediction and decision.

### A/B Test Logging

Log:

- experiment id
- variant id
- randomization unit
- model version
- decision policy version
- feature versions
- prediction score
- decision taken
- request context
- outcome labels when available

### Common Experiment Failures

| Failure | Symptom | Fix |
|---------|---------|-----|
| Sample ratio mismatch | Observed traffic split differs from expected. | Stop and debug assignment or filtering. |
| Interference | One user's treatment changes another user's outcome. | Randomize at a higher unit or use cluster experiments. |
| Delayed labels | Early results look wrong or incomplete. | Wait for label window to mature. |
| Novelty effects | Initial lift disappears. | Run long enough and inspect cohorts. |
| Guardrail regression | Primary metric improves but safety/latency worsens. | Predefine no-ship guardrails. |
| Peeking | Repeatedly checking and stopping at first positive result. | Use fixed-horizon or sequential testing rules. |

---

## Monitoring

Production ML monitoring needs multiple layers.

| Layer | Signals | Example alert |
|-------|---------|---------------|
| System | p50/p95/p99 latency, error rate, timeout rate, CPU/GPU/memory | p95 inference latency above 50 ms for 10 minutes. |
| Data quality | null rate, schema mismatch, duplicate rate, late events | `account_age_days` null rate jumps from 0.1% to 20%. |
| Feature freshness | feature age, materialization lag, online store TTL violations | velocity features older than 5 minutes. |
| Feature distribution | mean, quantiles, category mix, out-of-range values | request amount distribution shifts 3 sigma. |
| Prediction distribution | score mean, quantiles, entropy, threshold crossing rate | risk score mean doubles after deploy. |
| Business outcome | conversion, fraud loss, false positives, manual review precision | false decline rate exceeds guardrail. |
| Label quality | label delay, missing labels, label distribution | delayed outcome feed stops for 2 hours. |
| Drift | feature drift, prediction drift, concept drift | model calibration decays by segment. |
| Fairness/slices | metric parity, error rates by segment | one segment has 2x false positive rate. |

### Alert Design

Good alerts are actionable:

- include owner
- include affected model and version
- include recent deploy or data-pipeline changes
- include dashboard link
- include rollback or mitigation playbook
- page only when user impact or production risk is real

---

## Drift And Retraining

| Drift type | Meaning | Detection | Response |
|------------|---------|-----------|----------|
| Feature drift | Input distribution changed. | PSI, KS test, quantile shift, category mix. | Inspect upstream data and segment impact. |
| Prediction drift | Model score distribution changed. | Score histograms and threshold crossing rates. | Check features, model version, and business mix. |
| Label drift | Label distribution changed. | Outcome rate by segment and time. | Recalibrate, retrain, or revisit label logic. |
| Concept drift | Relationship between features and label changed. | Performance decay on fresh labels. | Retrain with recent data or change features. |

### Distribution Shift vs Model Degradation

| Problem | What changed | How to diagnose | Response |
|---------|--------------|-----------------|----------|
| **Data quality issue** | Pipeline emitted wrong, missing, duplicated, or stale values | Schema checks, null rates, freshness, upstream deploys | Fix data pipeline, backfill, pause retraining. |
| **Distribution shift** | Inputs changed but model still behaves as trained | Feature drift by segment, traffic mix, new cohorts | Add fresh labels, recalibrate, retrain or route affected segment. |
| **Concept drift** | Feature-label relationship changed | Fresh-label performance decays while data quality is healthy | Retrain with recent data or add new features. |
| **Model degradation** | Model artifact, serving config, or dependency changed | Compare champion vs candidate on same data and same features | Roll back or fix deployment/config. |
| **Metric mismatch** | Offline metric improves but product outcome worsens | Inspect decision policy, thresholds, interventions, and guardrails | Optimize the real outcome and add missing guardrails. |

### Retraining Triggers

- scheduled cadence: daily, weekly, monthly
- metric degradation beyond threshold
- feature drift beyond threshold
- enough new labeled data accumulated
- upstream schema or product change
- incident recovery after bad data or label bug
- regulatory or policy change

### Retraining Pipeline Safety

- validate new data before training
- compare against champion model
- run temporal backtest
- evaluate by slices
- verify calibration
- run shadow deployment
- require approval for high-risk actions

### Data Flywheel

1. mine production failures: overrides, complaints, manual review corrections, delayed labels, and high-loss decisions
2. slice failures by segment, feature source, model version, threshold, and workflow
3. label the decision path, not only the final outcome
4. choose the fix: data repair, feature change, threshold change, model retraining, calibration, or policy update
5. regression-test old successes plus new failure slices
6. deploy gradually with guardrails
7. monitor drift and feed new failures back into the queue

Randomly labeling more data is often weaker than labeling the highest-information failures.

---

## Failure Modes

| Failure mode | What breaks | Mitigation |
|--------------|-------------|------------|
| Training-serving skew | Offline metrics are good, online predictions are bad. | Shared feature definitions and parity tests. |
| Feature store stale | Model uses outdated state. | TTLs, freshness alerts, fallback features. |
| Upstream event schema change | Features silently become wrong. | Data contracts and schema validation. |
| Label leakage | Offline model looks unrealistically strong. | Feature review, temporal splits, leakage tests. |
| Model too slow | Endpoint misses SLA. | Smaller model, batching, caching, hardware acceleration, fallback. |
| Bad threshold | Model score is fine, decision policy is harmful. | Threshold validation and online guardrails. |
| Calibration decay | Probabilities no longer match observed outcomes. | Recalibration and segment monitoring. |
| Silent label outage | Monitoring cannot measure quality. | Label pipeline alerts and missing-label dashboards. |
| Bad deployment config | Wrong model or feature version served. | Registry checks, immutable artifacts, config validation. |
| Feedback loop | Model changes future data distribution. | Holdouts, exploration, periodic audits, causal analysis where needed. |
| Aggregate metric hides regression | Overall metric improves while one segment gets worse. | Slice dashboards, weighted guardrails, and targeted rollback. |
| Generic benchmark mismatch | Public benchmark improves but production task quality does not. | Build task-specific evals and compare against business outcomes. |

---

## Security, Privacy, And Compliance

Production ML systems often touch sensitive data.

### Required Controls

- encrypt data at rest and in transit
- restrict feature access by least privilege
- separate raw PII from model-ready features where possible
- hash or tokenize stable identifiers when appropriate
- audit feature access and prediction access
- implement retention and deletion workflows
- document model purpose, limitations, and approved use
- monitor for unfair error rates and harmful impact
- avoid training on data that users or policy prohibit

### Explainability

For high-impact decisions, store:

- model version
- input feature values or auditable references
- decision threshold
- reason codes or feature attributions
- decision policy version
- appeal or manual review path

---

## Reference Architectures

### Real-Time Risk Scoring

```text
Request arrives
  -> validate request and entity IDs
  -> fetch online features: recent velocity, account age, device risk
  -> compute request features: amount, country, merchant, time
  -> model inference: calibrated risk probability
  -> decision policy:
       low risk    -> allow
       medium risk -> step-up authentication or review
       high risk   -> block
  -> async logs:
       prediction, features, model version, decision, later outcome
```

### Batch Churn Prediction

```text
Daily schedule
  -> build features from warehouse
  -> score all active accounts
  -> write scores to CRM table
  -> business workflow selects interventions
  -> outcomes logged after retention window
  -> evaluate treatment impact and retrain monthly
```

### Content Moderation Classifier

```text
Content submitted
  -> parse text/image/video metadata
  -> request-time features and embeddings
  -> moderation model scores policy categories
  -> decision policy:
       safe -> publish
       uncertain -> human review
       severe -> block
  -> reviewer outcome becomes delayed label
  -> monitor false positive appeals and policy drift
```

---

## Recommended Default Architecture

For most ML system-design interviews, propose:

1. durable event logging with versioned data contracts
2. raw data lake plus curated warehouse tables
3. batch and streaming feature pipelines
4. feature store with offline and online views
5. point-in-time training dataset builder
6. training DAG with experiment tracking
7. model registry with approval states
8. online or batch serving path with schema validation
9. prediction and decision logging
10. shadow/canary rollout with rollback
11. A/B test with primary and guardrail metrics
12. monitoring for data, features, predictions, outcomes, latency, and drift
13. retraining and incident playbooks

---

## Interview Talking Points

- "I would separate offline training from online serving, but keep feature definitions shared to avoid training-serving skew."
- "The feature store needs both offline point-in-time joins for training and low-latency online lookup for serving."
- "A model artifact is not enough; I need schema, preprocessing, feature versions, calibration, thresholds, metrics, and lineage."
- "I would run the candidate model in shadow first, then canary it with guardrail metrics and a tested rollback path."
- "A/B testing needs a stable randomization unit, logged variant assignment, primary metric, guardrails, power/MDE assumptions, and a label maturation window."
- "Production monitoring must cover data quality, feature freshness, prediction distribution, business outcomes, labels, latency, cost, and slice-level regressions."
- "Retraining should be triggered by schedule, drift, performance decay, or product changes, but every retrained model still has to beat the champion before launch."
