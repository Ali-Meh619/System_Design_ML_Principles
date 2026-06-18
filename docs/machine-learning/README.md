# Machine Learning Interview Prep

> Interview-focused AI/ML coverage split across production systems, recommendation systems, agent systems, model fundamentals, deep learning, and LLMs.

---

## Topics in This Category

| # | Topic | Difficulty | What You'll Learn |
|---|-------|------------|-------------------|
| 1 | [Machine Learning in System Design](ml-in-system-design.md) | Advanced | Production ML pipelines, feature stores, training, registry, serving, rollout, evaluation ladder, A/B tests, monitoring, data flywheel, retraining, rollback |
| 2 | [Recommendation Systems](recommendation-systems.md) | Advanced | Candidate generation, source fusion, two-tower retrieval, negative sampling, ANN search, ordered-slate reranking, counterfactual evaluation, feedback loops, fairness, A/B tests |
| 3 | [AI Agent System Design](ai-agent-system-design.md) | Advanced | Agent anatomy, hybrid orchestration, uncertainty-aware control, structured state vs retrieval, agentic RAG, tool reliability, interactive evaluation, observability, online experiments |
| 4 | [Classic Machine Learning](classic-ml.md) | Intermediate | Bias-variance, Naive Bayes, KNN, bagging vs boosting, SVM, PCA, SHAP/LIME, calibration, active learning, selective prediction |
| 5 | [Deep Learning](deep-learning.md) | Intermediate | CNNs, LSTMs, Transformers, GANs, VAEs, diffusion, distillation, compression, distributed training, GQA/MQA |
| 6 | [LLM Interview Questions](llm-interviews.md) | Advanced | Tokenization, three-axis adaptation selection, RAG, PEFT methods, pruning, RLHF/DPO/KTO/ORPO, evaluation, serving latency, MoE, scaling laws, multi-modal, CoT |

*These sections are actively maintained and optimized for interview prep rather than textbook completeness.*

---

## What to Study First

```text
New to ML interviews:
  Classic ML -> Deep Learning -> LLM Interview Questions

Production ML system design:
  Machine Learning in System Design -> Recommendation Systems -> AI Agent System Design

Recommendation system interviews:
  Machine Learning in System Design -> Recommendation Systems -> Classic ML metrics/losses

Theory / modeling focus:
  Classic Machine Learning -> Deep Learning -> LLM Interview Questions
```

---

## Common Interview Questions by Topic

### ML in System Design

- "Design a production ML pipeline for fraud detection."
- "How do you prevent training-serving skew?"
- "What belongs in a feature store, and why do we need offline and online stores?"
- "How do you deploy a new model safely?"
- "What would you monitor after a model launch?"
- "How do you design an A/B test for an ML model?"
- "How do offline replay, shadow mode, canary rollout, and A/B testing differ?"
- "Your offline metric improved but production outcomes got worse. How do you debug it?"
- "What triggers retraining?"

### Recommendation Systems

- "Design a recommendation system for Netflix, Spotify, YouTube, or Amazon."
- "Candidate generation vs ranking: what happens in each stage?"
- "Compare collaborative filtering, matrix factorization, and two-tower retrieval."
- "How do you handle cold-start users and cold-start items?"
- "Explain NDCG, MAP, MRR, Recall@K, and when to use each."
- "How do you balance relevance, diversity, freshness, policy, and fairness?"
- "How do you handle exposure bias, position bias, and exploration?"
- "How do in-batch, hard, popularity, and exposure-aware negatives change two-tower training?"
- "Compare IPS, SNIPS, and doubly robust evaluation. When do they fail?"

### AI Agent Design

- "Design an autonomous coding assistant."
- "How does the ReAct pattern work?"
- "What are the core components of an AI agent's memory?"
- "How does function calling work under the hood?"
- "How would you design agentic RAG with routing, reranking, evidence checks, and abstention?"
- "How do chunking strategy, retrieval method, ANN index choice, query decomposition, HyDE, and parent-child retrieval change an agentic RAG design?"
- "How would you evaluate an agent's performance?"
- "How do you handle cost control and model routing in a production agent?"
- "How do you decide whether an agent should answer, ask, act, or escalate?"
- "How should epistemic, aleatoric, tool, and policy uncertainty change agent behavior?"
- "Why is shadow mode incomplete for multi-turn agents, and what is the actor-observer gap?"
- "How do you prevent an agent from saying an action succeeded before the tool confirms it?"
- "How do you prevent brittle behaviors like overcommitment, sycophancy, premature action, instruction dilution, and looped retries?"

### Classic ML

- "Your model has 99% train accuracy and 70% test accuracy. What do you do?"
- "How do you handle a dataset where 1% of samples are positive?"
- "Explain XGBoost vs Random Forest - when would you use each?"
- "What is data leakage and how do you detect it?"
- "You have 50,000 features. Walk me through your feature selection strategy."
- "When would you use Naive Bayes vs Logistic Regression?"
- "How do you explain a model's predictions to a non-technical stakeholder?" (SHAP/LIME)
- "Your model has great AUC but bad real-world performance." (Calibration)
- "Which examples would you label next if annotation budget is limited?"
- "When should a model abstain instead of predicting?"

### Deep Learning

- "Why does ResNet solve the degradation problem?"
- "Why use He initialization with ReLU instead of Xavier?"
- "Explain the difference between BatchNorm and LayerNorm."
- "Walk me through the Transformer architecture from scratch."
- "Why is attention O(n^2) and how do you deal with long sequences?"
- "Explain GANs. What are their main failure modes?"
- "What is knowledge distillation and when would you use it?"
- "What is GQA and why is it important for LLM inference?"
- "Compare data parallelism, FSDP/ZeRO, tensor parallelism, and pipeline parallelism."

### LLMs

- "Explain how RAG works and when you'd prefer it over fine-tuning."
- "How do you choose the training objective, parameter-update scope, and deployment form independently?"
- "What is LoRA? Why does it work?"
- "How does the KV cache improve inference efficiency?"
- "Why does Chain-of-Thought sometimes fail?"
- "What is the 'lost in the middle' problem and how do you mitigate it?"
- "Compare RLHF and DPO - what are the practical differences?"
- "How does tokenization work? What is BPE?"
- "What is Mixture of Experts (MoE)? How does it scale models?"
- "What are scaling laws? What did Chinchilla show?"
- "How do multi-modal models process images alongside text?"
- "What are TTFT and TPOT, and how do you reduce them?"
- "How do you evaluate an LLM judge before trusting it?"
- "How do quantization, pruning, layer dropping, and adapter recovery interact for LLM serving?"

---

## Key Concepts Cheat Sheet

| Concept | One-line answer |
|---------|-----------------|
| **Feature Store** | Prevents training-serving skew by serving the same feature definitions to training and inference paths. |
| **Point-in-time correctness** | Training features must only use information available at the original prediction time. |
| **Model Registry** | Versioned model control plane with artifacts, metadata, lineage, approval state, and rollback target. |
| **Shadow deployment** | New model receives live traffic but does not affect decisions. |
| **Canary rollout** | Small traffic slice uses the new model before progressive ramp. |
| **A/B test unit** | Stable randomization unit such as user/account/session; wrong unit causes contamination. |
| **Evaluation ladder** | Progress from unit tests to offline replay, simulation, shadow, canary, A/B, and human review. |
| **Data flywheel** | Mine failures, label high-value slices, train targeted fixes, regression-test, deploy, and monitor. |
| **NDCG@K** | Measures whether highly relevant items appear near the top of a ranked list. |
| **Recall@K** | Measures whether retrieval found relevant candidates for the ranker. |
| **Two-tower model** | Separate user/context and item towers produce embeddings whose dot product supports ANN retrieval. |
| **MMR** | Reranking method that trades relevance against similarity to already-selected items. |
| **IPS** | Counterfactual evaluation method that reweights observed outcomes by exposure propensity. |
| **SNIPS** | Self-normalized IPS divides weighted reward by total importance weight to reduce variance, with finite-sample bias. |
| **Explore vs exploit** | Balance immediate predicted reward with learning about uncertain users/items. |
| **ReAct Agent** | Pattern where an agent iterates through Reason -> Act -> Observe. |
| **Agent autonomy level** | Defines whether the model may answer, read, prepare, execute, or must escalate. |
| **Uncertainty-aware control** | Epistemic uncertainty triggers retrieval/learning; ambiguity triggers clarification; tool or policy uncertainty limits action. |
| **Actor-observer gap** | A shadow agent does not change the next user/environment state, so multi-turn behavior needs simulation or limited live evaluation. |
| **False commitment** | Agent claims a side effect happened before tool-confirmed success; prevent with explicit action state. |
| **Agent sycophancy** | Agent lets user pressure or preferred answers override truth, policy, or authorization; prevent with preference data and external policy gates. |
| **Bias vs Variance** | Bias = model too simple; variance = model too sensitive to training data. |
| **L1 vs L2** | L1 creates sparsity; L2 shrinks weights smoothly. |
| **Bagging vs Boosting** | Bagging reduces variance in parallel; boosting reduces bias sequentially. |
| **Data leakage** | Training sees information unavailable at prediction time; diagnose with suspiciously high offline performance. |
| **Calibration** | Predicted probabilities should match observed frequencies. |
| **Selective prediction** | Model abstains, asks, or escalates when confidence is too low for the action risk. |
| **Active learning** | Choose labels from uncertainty, disagreement, high-impact cases, and production failures. |
| **Self-attention complexity** | O(n^2) in sequence length; FlashAttention and sparse/windowed attention reduce practical cost. |
| **RAG vs Fine-tuning** | RAG for updatable external knowledge; fine-tuning for behavior, style, or task adaptation. |
| **Adaptation decision** | Choose the objective (continual pre-training, SFT, preferences), trainable-parameter scope (full or PEFT), and deployment form independently. |
| **PEFT design** | LoRA rank, target modules, alpha, dropout, and adapter routing determine capacity and risk. |
| **TTFT / TPOT** | Time-to-first-token measures prefill/startup; time-per-output-token measures decode speed. |
| **KV cache** | Stores prior keys/values so decoding only processes the new token. |
| **MoE** | Routes tokens to a subset of expert networks, increasing parameters without proportional compute. |
