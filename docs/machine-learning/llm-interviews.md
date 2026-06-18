# LLM Interview Questions

> Modern GenAI for engineering interviews: Transformers from first principles, RAG architecture, adaptation strategies, inference optimization, alignment, and evaluation.

---

## 1. Transformer Architecture

The foundation of every modern LLM. You must be able to sketch this from memory.

```
Input Tokens
     │
 [Embedding + Positional Encoding]
     │
 ┌──────────────────────────────┐ × N layers
 │  LayerNorm                   │
 │  Multi-Head Self-Attention   │
 │  + Residual Connection       │
 │  LayerNorm                   │
 │  Feed-Forward Network (FFN)  │
 │  + Residual Connection       │
 └──────────────────────────────┘
     │
 [LayerNorm]
     │
 [Linear → Softmax over vocabulary]
     │
Output Probabilities
```

### Self-Attention (Scaled Dot-Product)

```
Attention(Q, K, V) = softmax(QKᵀ / √dₖ) · V
```

- Each token attends to every other token (including itself)
- `Q, K, V` are linear projections of the same input (self-attention)
- **Complexity:** O(n²·d) per layer — quadratic in sequence length

### Multi-Head Attention

```
MultiHead(Q,K,V) = Concat(head₁,...,headₕ) · Wₒ
headᵢ = Attention(Q·Wᵢᵠ, K·Wᵢᵏ, V·Wᵢᵛ)
```

Multiple heads allow the model to attend to different aspects of the input simultaneously (syntax, semantics, coreference, etc.).

### Feed-Forward Network (FFN)

```
FFN(x) = GELU(x·W₁ + b₁) · W₂ + b₂
```

Dimension: d_model → 4×d_model → d_model. This is where most "factual knowledge" is thought to be stored.

### Positional Encoding

Transformers have no inherent sense of order (unlike RNNs). Positions must be injected:

| Method | How | Pros/Cons |
|--------|-----|----------|
| **Sinusoidal (absolute)** | PE(pos, 2i) = sin(pos/10000^(2i/d)) | Original paper; fixed; doesn't generalize beyond training length |
| **Learned (absolute)** | Trainable embedding per position | Simple; BERT, GPT-2; also doesn't generalize |
| **RoPE (Rotary)** | Rotate Q/K vectors by position before dot product | Relative + efficient; LLaMA, Mistral, GPT-NeoX |
| **ALiBi** | Subtract linear position bias from attention scores | Very efficient; extrapolates to longer sequences |

**RoPE is widely used** in decoder-only LLMs because it encodes relative-position structure efficiently and supports several context-extension techniques, though the exact positional method remains architecture-specific.

---

## 2. Tokenization

Tokenization converts raw text into a sequence of integer IDs that the model can process. It's fundamental to how LLMs work, yet often overlooked in preparation.

### Why Not Characters or Words?

| Approach | Problem |
|---------|---------|
| **Characters** | Sequences too long; model struggles to learn word semantics from individual characters |
| **Words** | Vocabulary too large (millions); cannot handle new/rare words (OOV problem) |
| **Subwords** | Best of both — common words are single tokens, rare words decompose into known subparts |

### Byte Pair Encoding (BPE)

The dominant algorithm (used by GPT-2/3/4, LLaMA, Mistral).

```
Algorithm:
1. Start with character-level vocabulary
2. Count all adjacent pairs in training corpus
3. Merge the most frequent pair into a new token
4. Repeat steps 2-3 until target vocab size reached

Example progression:
  "lower" → ['l', 'o', 'w', 'e', 'r']
  After merging 'e'+'r' → 'er':  ['l', 'o', 'w', 'er']
  After merging 'l'+'o' → 'lo':  ['lo', 'w', 'er']
  After merging 'lo'+'w' → 'low': ['low', 'er']
  After merging 'low'+'er' → 'lower': ['lower']
```

### Tokenizer Variants

| Tokenizer | Algorithm | Used by | Key difference |
|-----------|-----------|---------|---------------|
| **BPE** | Frequency-based merges | GPT-2/3/4, LLaMA | Most common; greedy merges |
| **WordPiece** | Likelihood-based merges | BERT, DistilBERT | Merges that maximize likelihood |
| **Unigram (SentencePiece)** | Start large, prune tokens that least reduce likelihood | T5, LLaMA, XLNet | Probabilistic; multiple segmentations possible |
| **Byte-level BPE** | BPE on raw bytes, not Unicode | GPT-2, LLaMA | Handles any language/encoding; no UNK tokens |

### Tokenization Pitfalls (Common Interview Topics)

**1. Tokenizer-model mismatch:** Using a different tokenizer than the one the model was trained with produces garbage embeddings. Always use the model's own tokenizer.

**2. Token count ≠ word count:** "ChatGPT" might be split into ["Chat", "G", "PT"]. A 4096-token context window holds far fewer words than 4096. Rule of thumb: 1 token ≈ 0.75 English words, but varies by language.

**3. Arithmetic difficulty:** Numbers like "42137" may tokenize as ["42", "137"] — the model never sees the full number as one unit, making arithmetic unreliable.

**4. Multilingual inefficiency:** BPE trained primarily on English produces far more tokens per word in other languages (sometimes 3-5× more), consuming more context window and increasing cost.

**5. Special tokens:** `[BOS]`, `[EOS]`, `[PAD]`, `[CLS]`, `[SEP]`, `[MASK]` — each model family uses different special tokens that control behavior.

---

## 3. Pre-training Objectives

How LLMs learn language representations.

### Causal Language Modeling (CLM / GPT-style)

Predict next token given all previous tokens:

```
L = -Σ log P(xₜ | x₁, ..., xₜ₋₁)
```

- **Autoregressive** — can only attend left
- Natural for generation tasks
- Used by: GPT-2/3/4, LLaMA, Mistral, Claude

### Masked Language Modeling (MLM / BERT-style)

Randomly mask 15% of tokens; predict the masked tokens:

```
Input:  The [MASK] sat on the [MASK]
Target: The cat  sat on the mat
```

- **Bidirectional** — attends in both directions; richer representations
- Better for classification, NER, QA
- Used by: BERT, RoBERTa, DeBERTa

### T5 / Seq2Seq (Encoder-Decoder)

Encoder reads full input (bidirectional); decoder generates output (autoregressive):

```
Input:  "Summarize: {text}"
Output: "{summary}"
```

Used by: T5, BART, mT5, Flan-T5.

### Training Lifecycle: What Each Stage Changes

Do not collapse every model change into "fine-tuning." Each stage optimizes a different behavior.

| Stage | What it changes | Interview nuance |
|-------|-----------------|------------------|
| **Data curation** | Filters, deduplicates, anonymizes, balances, and quality-scores raw corpora | Bad data creates bad behavior. Quality, coverage, privacy, and contamination controls matter before training starts. |
| **Tokenization** | Maps text into subword IDs | Rare product names, IDs, acronyms, and multilingual text can fragment into many tokens, increasing cost and copying errors. |
| **Pre-training** | Learns broad next-token or denoising objective over massive data | Gives grammar, world knowledge, and general reasoning priors, but not task policy or tool discipline. |
| **Continual pre-training** | Continues self-supervised training on a target distribution | Useful for domain vocabulary and style, but can overfit or forget if the mix is too narrow. |
| **SFT / instruction tuning** | Teaches desired responses, formats, and tool-call demonstrations | Best for output structure and common behavior; weaker for subtle preferences. |
| **Preference optimization** | Chooses better outputs among alternatives | RLHF, DPO, KTO, ORPO, and related methods tune trade-offs like helpfulness, brevity, refusal, and grounding. |
| **Deployment optimization** | Compresses, routes, caches, and serves the model | Quantization, distillation, pruning, batching, and caching must be validated on task slices, not only generic benchmarks. |

### Choose Adaptation On Three Axes

Do not treat SFT, DPO, LoRA, QLoRA, and quantization as mutually exclusive alternatives. Make three separate decisions.

#### 1. Choose The Knowledge Source Or Training Objective

| Need | Prefer | Why |
|------|--------|-----|
| Current, private, attributable facts | RAG, search, SQL, or APIs | Keeps knowledge updateable, permission-aware, citable, and deletable. |
| Domain language or input distribution | Continual pre-training | Learns recurring terminology, syntax, and style through self-supervision. |
| Demonstrated formats, procedures, or tool behavior | SFT / instruction tuning | Learns from input-output or trajectory demonstrations. |
| Preference trade-offs | DPO, RLHF, KTO, ORPO, or RLAIF | Optimizes chosen versus rejected behavior such as groundedness, brevity, and safe escalation. |

#### 2. Choose Which Parameters Train

| Update scope | Use when | Main trade-off |
|--------------|----------|----------------|
| Full parameter update | Broad distribution shift and enough data/compute justify maximum capacity. | Highest memory/storage cost and catastrophic-forgetting risk. |
| LoRA, adapters, IA3, prefix tuning, or prompt tuning | Task/domain variants need small trainable state or independent deployment. | Capacity and runtime behavior depend on the method and target modules. |

SFT or preference optimization can use full fine-tuning, LoRA, QLoRA, or another PEFT method. The objective determines **what behavior is learned**; the update scope determines **where trainable capacity lives**.

**Training-memory choice:** QLoRA keeps the LoRA update scope but stores the frozen base in low-bit form and dequantizes weights into the compute dtype for matrix operations. It is a memory/precision recipe, not a different training objective or adapter location.

#### 3. Choose The Deployment Form

Use merged weights or runtime adapters, then independently choose distillation, quantization, pruning, caching, batching, speculative decoding, and model routing. These alter storage and serving economics; they do not replace the training objective.

**Interview rule:** diagnose the gap first, then name the objective, parameter-update scope, and serving plan separately.

---

## 4. Fine-Tuning Strategies

### Full Fine-Tuning

Update all model parameters under the selected objective, such as continual pre-training, SFT, or preference optimization.

- Pro: Maximum adaptation capacity when data, compute, and regression coverage are sufficient
- Con: Expensive compute (needs massive VRAM); requires storing a full copy of the model per task; prone to catastrophic forgetting.

#### Catastrophic Forgetting

**Catastrophic forgetting** occurs when a model completely overwrites or "forgets" its broad, general-purpose pre-trained knowledge while being fine-tuned on a narrow, specific task (e.g., fine-tuning a coding model exclusively on Python, causing it to lose its ability to write JavaScript or even hold a normal conversation).

**Why it happens:** Neural networks share weights across representations. Large gradient updates during fine-tuning aggressively push these weights to minimize the new task's loss, disrupting the delicate balance learned during pre-training.

**Mitigations:**
1. **Replay Buffers:** Mix a small percentage of original pre-training data into the fine-tuning dataset to keep those pathways active.
2. **Elastic Weight Consolidation (EWC):** Add a penalty term to the loss function that slows down learning on weights that were critical to the pre-training task.
3. **Small Learning Rates:** Use an LR 1-2 orders of magnitude smaller than pre-training to make gentle updates.
4. **Early Stopping:** Monitor performance on a general benchmark (like MMLU) and stop fine-tuning before general knowledge degrades too much.

### Instruction Fine-Tuning (IFT)

Fine-tune on (instruction, output) pairs to teach the model to follow instructions:

```
User: Classify the sentiment of: "I love this!"
Assistant: Positive
```

Converts a base model (next-token predictor) into a helpful assistant. Used in InstructGPT, LLaMA-2-chat, Mistral-Instruct.

### Parameter-Efficient Fine-Tuning (PEFT)

Fine-tune a fraction of parameters while keeping most weights frozen.

#### LoRA (Low-Rank Adaptation)

Decompose weight update ΔW into two low-rank matrices:

```
For W ∈ R^(d×k):
W_new = W + ΔW = W + B·A
where A ∈ R^(r×k), B ∈ R^(d×r), so B·A ∈ R^(d×k), rank r ≪ min(d,k)
```

- Only train A and B for selected target matrices
- At inference: merge into W_new = W + B·A (no latency overhead)
- For one `d × k` target matrix, LoRA trains `r(d+k)` parameters instead of `dk`; the total percentage depends on rank and how many modules are adapted

**Which layers should receive LoRA?** Treat this as architecture- and task-dependent. Evaluate attention projections (Q/K/V/O) and MLP projections under a trainable-parameter budget; narrow Q/V targeting is a starting point, not a universal default.

#### QLoRA (Quantized LoRA)

QLoRA is a memory-efficient LoRA training recipe over a frozen low-bit base model. Feasible model size depends on architecture, sequence length, batch size, optimizer, adapter targets, checkpointing, and hardware; do not treat one GPU example as a universal capacity guarantee.

Steps:
1. Quantize base model to 4-bit NF4 (NormalFloat)
2. Add LoRA adapters in BF16
3. Compute gradients only for LoRA parameters
4. Dequantize frozen weights only when needed for computation

Why it fits large models: the base weights stay frozen in 4-bit storage, so optimizer states and gradients exist only for the LoRA parameters. During forward/backward computation, quantized weights are dequantized into the compute dtype for matrix multiplies, but the quantized base weights are not updated. Production-grade QLoRA setups also use double quantization to reduce quantization metadata overhead and paged optimizers to avoid GPU memory spikes on long sequences.

### PEFT Design Choices

LoRA is a family of decisions, not one checkbox.

| Choice | Meaning | Practical guidance |
|--------|---------|--------------------|
| **Rank `r`** | Capacity of the low-rank update | Start low for narrow style or format changes; increase when the target behavior or distribution needs more update capacity. Tokenizer fragmentation is a separate problem. |
| **Alpha scaling** | Strength of the adapter update | Too high can destabilize base behavior; too low underfits. Tune on both target-task and regression slices. |
| **Target modules** | Which layers receive adapters | Compare Q/K/V/O attention and MLP projections against the task, memory budget, and regression slices. |
| **Dropout** | Regularizes adapter activations | Useful for small or noisy datasets; too much makes the adapter weak. |
| **Merge vs runtime adapter** | Bake adapter into weights or load dynamically | Merge for one global behavior; runtime adapters for task, tenant, or domain-specific behavior. |
| **Adapter routing** | Select adapter by request type | Powerful but needs a reliable router and tests for wrong-adapter activation. |

### PEFT Methods: What Actually Trains

The interview distinction is not just "few parameters." It is what receives trainable capacity, where it enters the Transformer, and whether the serving path can merge it away. QLoRA is listed as a training recipe because it changes how a LoRA base is stored and computed, not where the adapter enters the network.

| Method | What is trained | Where it enters | Inference cost | Strengths and failure modes |
|--------|-----------------|-----------------|----------------|-----------------------------|
| **Prompt tuning / soft prompt tuning** | A small table of continuous prompt embeddings | Prepended to the input embedding sequence | Adds sequence positions and normal Transformer compute, but no adapter modules | Very small trainable state for simple classification or style conditioning. It is often weaker for complex reasoning, tool behavior, or large distribution shifts. The learned vectors are not natural-language prompts. |
| **Prefix tuning** | Trainable prefix vectors, often projected into per-layer key/value states | Injected into attention layers as virtual prefix K/V or prefix activations | Extra prefix states increase KV cache and attention work | More expressive than prompt tuning for generation control because every layer sees task-specific conditioning. It can overfit narrow output formats and wastes context/cache budget if the prefix is too long. |
| **Bottleneck adapters** | Small down-projection/up-projection modules with nonlinearities | Inserted inside or after attention/MLP blocks while base weights stay frozen | Adds runtime matmuls unless optimized or architecture supports adapter fusion | Good when each task/domain needs moderate capacity. Useful for multi-task serving, but wrong-adapter routing and adapter/version drift need explicit tests. |
| **IA3** | Learned multiplicative vectors that scale attention or feed-forward activations | Applied to selected key/value/MLP activations | Small runtime elementwise scaling | Extremely small trainable state; capacity may be lower than LoRA for substantial behavior shifts. |
| **LoRA** | Low-rank matrices `A` and `B` that form an additive update to selected weights | Selected attention and/or MLP projections | Can be merged into base weights for no extra latency | Strong general PEFT answer. Target modules, rank, alpha, and merge policy determine quality and serving complexity. |
| **DoRA** | LoRA-style direction updates plus a separately learned magnitude term | Same target modules as LoRA | Similar to LoRA, depending on implementation | Helps when plain LoRA underfits because direction and scale need different adaptation. Mention it when low-rank capacity is close but not enough. |
| **QLoRA recipe** | LoRA adapters on top of a frozen low-bit base | Same adapter targets as LoRA; base weights are quantized and frozen | Dequantization happens for compute; optimizer state remains adapter-only | Strong answer for memory-constrained adaptation. Watch quantization sensitivity, sequence-length memory spikes, and task-slice regressions. |
| **AdaLoRA** | Adaptive low-rank updates with rank budget reallocated by layer importance | Same target modules as LoRA, but rank varies across layers | Similar to LoRA after allocation | Useful when a fixed rank wastes capacity. It adds tuning complexity and needs stable importance estimates. |

#### Decision Rule

| Need | Prefer | Reason |
|------|--------|--------|
| Smallest trainable footprint for a simple task | Prompt tuning | Minimal parameters and storage. |
| Frozen model with stronger generation conditioning | Prefix tuning | Conditions multiple layers without changing weights. |
| Separate behavior per task/domain with moderate capacity | Adapters or LoRA | More expressive than soft prompts. |
| No added serving latency for one global behavior | Merged LoRA | The low-rank update can be folded into the base matrix. |
| Many tenants, tasks, or domains | Runtime adapters or LoRA adapters plus router | Keeps variants separate, but requires adapter-routing tests and fallback behavior. |

---

## 5. Retrieval-Augmented Generation (RAG)

Augment LLM generation with relevant context retrieved from an external knowledge base. Addresses hallucination, staleness, and knowledge grounding.

Scope boundary: this section covers core RAG mechanics for LLM systems. The Agent guide covers agentic RAG, where a controller plans retrieval, routes across sources, calls tools, verifies evidence, and decides whether to answer or abstain.

```
User query
    │
    ▼
[Query analysis / optional rewrite]
    │
    ▼
[Retriever over dense, sparse, structured, or live sources]
    │
    ▼
[Fusion, filtering, reranking, and context construction]
    │
    ▼
[LLM] → answer with evidence, citations, or abstention
```

### Core Components

| Component | Purpose | Examples |
|-----------|---------|---------|
| **Chunking** | Split documents into retrievable pieces | Fixed-size, recursive, semantic, sentence-window |
| **Retriever** | Find evidence from one or more sources | Dense embeddings, BM25, SQL, graph, search API, live service |
| **Re-ranker** | Re-score top-k chunks for precision | Cross-encoder (e.g., ms-marco-MiniLM) |
| **Generator** | Produce an answer from selected evidence | Instruction model with citation and abstention policy |

### RAG Failure Modes

| Problem | Cause | Fix |
|---------|-------|-----|
| Wrong chunks retrieved | Bad embeddings or chunking | Smaller chunks, better overlap, re-ranking |
| Relevant chunk retrieved but ignored | LLM ignores context ("lost in the middle") | Put most relevant at start/end; reduce context size |
| Hallucination despite retrieval | Evidence is incomplete or generation adds unsupported claims | Claim-level evidence checks, citation validation, calibrated abstention, or escalation |
| Stale information | Retrieved docs are outdated | Add timestamps; prefer recent docs |
| Chunk too large | Exceeds context window; dilutes signal | Smaller chunks + parent document retrieval |

### Advanced RAG Patterns

- **HyDE (Hypothetical Document Embeddings):** Generate a hypothetical answer, embed it, retrieve on that — often better than embedding the query directly.
- **Self-RAG:** Model decides whether to retrieve (via trained special tokens).
- **Hybrid Search:** Combine BM25 (keyword) + dense vector search; fuse results with RRF (Reciprocal Rank Fusion).
- **Parent-child chunking:** Index small chunks; return their parent chunks for more context.

### Production RAG Controls

| Control | What it prevents | Implementation pattern |
|---------|------------------|------------------------|
| **Metadata filtering** | Cross-tenant or wrong-domain retrieval | Filter by tenant, product, policy version, permissions, and freshness before ranking. |
| **Freshness precedence** | Stale docs overriding current state | Prefer live structured state or newer documents when sources conflict. |
| **Reranking** | Semantically similar but irrelevant chunks | Re-score top-k with a cross-encoder or stronger model, then cap context aggressively. |
| **Evidence checks** | Unsupported claims in grounded answers | Verify answer claims against retrieved evidence before returning. |
| **Citation validation** | Citation mismatch | Ensure cited chunk actually supports the sentence it is attached to. |
| **Fallback path** | Missing evidence | Retrieve again, ask a targeted clarification, or abstain instead of inventing. |
| **Cache boundaries** | Data leakage through cached retrieval | Partition caches by tenant, user permission, and document version. |

**Interview tip:** RAG quality is a product of retrieval recall, retrieval precision, context placement, generation discipline, and evidence verification. Do not evaluate only the final answer.

### RAG Evaluation Decomposition

| Layer | Measures |
|-------|----------|
| Retrieval | Recall@K, MRR, NDCG@K, source/route accuracy, permission isolation |
| Reranking/context | Top-support precision, context relevance, duplicate rate, token efficiency |
| Generation | Answer correctness, groundedness/faithfulness, citation precision and recall |
| Decision policy | Abstention quality, clarification quality, fallback success |
| End to end | Task success, latency, cost, freshness, and segment regressions |

Evaluate retrieval against labeled evidence before judging generated prose. A fluent answer cannot reveal that the retriever missed the authoritative source.

---

## 6. Prompt Engineering

### Core Techniques

| Technique | Description | When to use |
|-----------|-------------|-------------|
| **Zero-shot** | Direct instruction, no examples | Strong models (GPT-4), simple tasks |
| **Few-shot** | N examples of (input, output) in prompt | Small models, structured outputs |
| **Chain-of-Thought (CoT)** | "Let's think step by step" | Reasoning tasks, math, logic |
| **Self-consistency** | Sample k CoT paths; majority vote | When accuracy > latency |
| **ReAct** | Interleave Reasoning + Acting (tool calls) | Agents, multi-step tasks |
| **System prompt** | Set persona, constraints, output format | All production use cases |

### Chain-of-Thought (CoT) — Why It Works

CoT forces the model to **externalise intermediate reasoning steps as tokens**, making each step available as context for the next. The answer only comes after the reasoning is written out.

```
Without CoT:
  Q: "If a train travels 60 mph for 2.5 hours, how far does it go?"
  A: "120 miles"  ← model jumps directly; no error-checking possible

With CoT:
  Q: "...Think step by step."
  A: "Distance = speed × time. Speed = 60 mph, time = 2.5 hours.
      60 × 2.5 = 60 × 2 + 60 × 0.5 = 120 + 30 = 150 miles."  ✓
```

**Why it fundamentally helps — three mechanisms:**

1. **More computation per answer.** A Transformer has a fixed depth; each forward pass has a fixed number of operations. Generating reasoning tokens effectively increases compute dedicated to the problem before the final answer token is sampled. Difficult reasoning that can't fit in one pass gets more "scratch space."

2. **Error localisation.** Each intermediate step can be checked — by the model itself (self-consistency), by another model (LLM-as-judge), or by a tool (code executor). Without CoT, errors are invisible inside the black-box final answer.

3. **Conditioning effect.** Each reasoning token becomes part of the context for subsequent tokens. Writing "so the units cancel to give kg·m/s²" constrains the next token to be dimensionally consistent. The model is less likely to produce an answer that contradicts its own written reasoning.

**Variants:**

| Variant | How | When to use |
|---------|-----|-------------|
| **Zero-shot CoT** | Append "Let's think step by step" | Quick baseline; works on most reasoning tasks |
| **Few-shot CoT** | Provide full (Q → reasoning → A) examples | More reliable; guides format of reasoning |
| **Self-consistency** | Sample k CoT paths; majority vote on final answers | High-stakes; sacrifices latency for accuracy |
| **Auto-CoT** | LLM generates its own demonstrations automatically | Avoids manual example writing |
| **Tree of Thoughts (ToT)** | Explore multiple reasoning branches; backtrack | Complex planning tasks |
| **Program-of-Thought** | Reason in code; execute for deterministic answer | Math, data analysis |

### When CoT Fails

CoT is not reliable for all problem types. Understanding the failure modes is as important as knowing when to use it.

**1. Plausible-sounding but wrong reasoning ("hallucinated CoT")**
The model generates a fluent, step-by-step rationale that reaches an incorrect answer — and because the reasoning *sounds* coherent, it's harder to catch than a naked wrong answer.

```
Q: "What is the capital of Australia?"
CoT: "Australia is a large country. Its largest and most famous city is Sydney.
      Sydney is the cultural and financial hub. Therefore, the capital is Sydney."
A: "Sydney"   ← Wrong. The capital is Canberra.
```
The model generates reasoning that *justifies* its incorrect parametric memory rather than correcting it.

**2. Faithfulness gap**
Research shows the written CoT often does not accurately reflect the model's internal computation — the model may have already "decided" the answer and writes reasoning that post-hoc rationalises it. The reasoning is a *description*, not a *cause*, of the final token.

**3. Reasoning steps cascade errors**
If an early step is wrong, every subsequent step conditions on it and the error compounds:
```
Step 1: "There are 24 hours in a day"  ✓
Step 2: "3 days = 24 × 3 = 72 hours"  ✓
Step 3: "Each hour has 100 minutes"    ✗ ← wrong
Step 4: "72 hours = 7200 minutes"      ✗ ← compounds
```

**4. Tasks where CoT doesn't help (or hurts)**
- **Simple factual recall:** "What year was the Eiffel Tower built?" — CoT adds noise, not signal
- **Very long CoT chains:** Errors accumulate; the model can "talk itself into" a wrong answer
- **Tasks requiring symbolic precision:** CoT reasoning is still probabilistic; arithmetic over large numbers remains unreliable without a code executor
- **Classification with no intermediate reasoning:** Sentiment, named entity recognition — CoT overhead not worth it

**5. Sycophantic CoT**
If the user signals a preferred answer in the prompt, the model may generate reasoning that leads to that answer regardless of correctness:
```
User: "Obviously 2+2=5, right? Think step by step."
CoT: "Well, if we consider non-standard arithmetic... 5"  ← wrong
```

**Mitigations for CoT failures:**
- **Self-consistency:** Sample 10+ paths; majority vote filters out noise from bad reasoning chains
- **Verify with tools:** Execute arithmetic in code, not in CoT text
- **Step-level verification:** Use another LLM call to check each reasoning step
- **Constitutional prompting:** Instruct the model: "Check your reasoning before giving a final answer"

---

### Adaptive Reasoning Budget

Reasoning tokens are a latency and cost budget. Spend them based on task complexity and risk.

| Task class | Budget | Pattern |
|------------|--------|---------|
| **Simple lookup or classification** | Minimal | Use direct answer or small classifier; avoid unnecessary chain-of-thought. |
| **Moderate workflow** | Small bounded budget | Brief plan, one or two tool calls, then answer. |
| **Complex reasoning** | Larger budget | Decompose, verify intermediate steps, and use tools for arithmetic or code. |
| **High-risk action** | Reasoning plus policy gate | The model can propose, but deterministic rules, confirmation, and authorization decide. |
| **Uncertain request** | Clarification budget | Ask a targeted question instead of spending tokens guessing. |

Expose only the final answer or structured trace needed for debugging. Internal reasoning should not become user-facing product output by default.

---

### Structured Output / JSON Mode

Force the model to respond in a specific schema:

```
System: "Respond ONLY with valid JSON: {name: string, sentiment: 'positive'|'negative'}"
```

Production approaches: Outlines, Guidance, Instructor library, OpenAI structured outputs API.

---

## 7. Alignment: RLHF and DPO

Raw pretrained LLMs predict next tokens — they can generate harmful, dishonest, or unhelpful content. Alignment makes models helpful, harmless, and honest.

### RLHF (Reinforcement Learning from Human Feedback)

```
Step 1: Supervised Fine-Tuning (SFT)
        → Fine-tune on high-quality (prompt, response) pairs

Step 2: Reward Model Training
        → Show human raters pairs of responses; learn a reward model
        → RM predicts: which response is better?

Step 3: PPO Optimization
        → Generate responses; score with RM; use PPO to maximize reward
        → KL penalty prevents drifting too far from SFT model
```

**Problem:** RLHF with PPO is operationally complex: actor, critic, reference policy, and reward model all participate in training, although implementations may shard, offload, or schedule them rather than keeping every full model resident on one GPU.

### DPO (Direct Preference Optimization)

Reformulates RLHF as a supervised learning problem — no RL required.

```
Given preference data: (prompt, chosen_response, rejected_response)
Loss = -log σ(β · (log π(chosen|x) - log π(rejected|x) - log π_ref(chosen|x) + log π_ref(rejected|x)))
```

- **β** controls how far from reference model
- Much simpler than RLHF: single training loop, no reward model
- Used by: Zephyr and many preference-tuned open models; verify a specific model's training recipe before citing it

---

### Other Preference And Reasoning Objectives

| Method | Idea | When it matters |
|--------|------|-----------------|
| **KTO** | Learns from desirable/undesirable examples without paired preferences | Useful when pairwise preference data is expensive. |
| **ORPO** | Combines supervised tuning with preference optimization in one objective | Simpler alignment pipeline for instruction models. |
| **RLAIF** | Uses AI feedback instead of or alongside human feedback | Scales critique data, but still needs human calibration. |
| **ORM** | Outcome reward model scores only final answers | Good for tasks where final correctness is easy to verify. |
| **PRM** | Process reward model scores intermediate reasoning steps | Useful for math, code, or tool trajectories where the path matters. |

For agents, preference data should include successful and failed trajectories, tool observations, confirmations, recovery steps, and safety outcomes. A final-answer-only dataset can teach the model to sound correct while taking bad actions.

### Sycophancy, Overcommitment, And Agentic Preference Data

Sycophancy is when a model over-aligns to the user's stated preference, confidence, urgency, or authority claim instead of preserving truthfulness and policy boundaries. It is not only a prompt issue; it can be created by preference data that rewards agreement, smoothness, or user satisfaction without separately rewarding correctness and safe refusal.

| Bad training signal | Failure it teaches | Better preference target |
|---------------------|--------------------|--------------------------|
| User likes agreeable answers | Sycophantic reasoning and unjustified agreement | Prefer truthful correction with concise explanation. |
| Final answer sounds successful | False commitment or hidden tool failure | Prefer honest status: attempted, pending, failed, or succeeded based on observations. |
| Faster completion always wins | Premature action before slots or confirmation | Prefer clarification and confirmation for ambiguous or high-risk actions. |
| Refusal is penalized as unhelpful | Policy bypass under pressure | Prefer safe refusal plus an allowed alternative or escalation path. |
| Only outcome labels are used | Bad intermediate steps are invisible | Add process labels for tool choice, argument extraction, policy check, confirmation, recovery, and escalation. |

For tool-using systems, preference examples should compare **trajectories**, not just final messages. A chosen trace might ask one targeted clarification, call the right read-only tool, detect a permission issue, and explain the next safe step. A rejected trace might answer faster but invent tool success, skip confirmation, or comply with social pressure.

Use **ORM** when final correctness is objectively checkable. Use **PRM** when the path matters: multi-step reasoning, code repair, tool calls, confirmations, or safety gates. For production agents, PRM-style labels should usually attach to observable trace steps rather than hidden free-form chain-of-thought.

---

## 8. LLM Evaluation

### Automatic Metrics

| Metric | How | Limitation |
|--------|-----|-----------|
| **Perplexity** | `exp(-1/N · Σ log P(xₜ))` | Lower = better language model; doesn't measure task performance |
| **BLEU** | N-gram overlap with reference | Doesn't handle paraphrase; ignores meaning |
| **ROUGE** | Recall-oriented n-gram overlap | Common for summarization; same issues |
| **BERTScore** | Contextual embedding similarity | Better semantic match; slower |
| **Exact Match (EM)** | Does output exactly match reference? | Too strict; useful for structured outputs |
| **F1 (token-level)** | Token overlap between prediction and ground truth | QA benchmarks (SQuAD) |

#### What Perplexity Does And Does Not Measure

**Perplexity** measures next-token fit on a controlled corpus and tokenizer. It remains useful for pre-training progress, domain adaptation, data-quality comparisons, and compression regressions.

It is not a sufficient product or reasoning metric: lower next-token loss does not guarantee correct answers, tool use, instruction following, safety, or calibrated uncertainty. Use executable tests for code, exact/numeric checks where the task has a canonical answer, task rubrics, human review, and calibrated judges for semantic outputs. HumanEval is scored through functional execution and Pass@k, not ordinary exact-string match.

### Benchmarks (Know the Names)

| Benchmark | What it tests |
|-----------|--------------|
| **MMLU** | Multitask language understanding (57 subjects) |
| **HumanEval / MBPP** | Code generation correctness |
| **GSM8K / MATH** | Grade-school / competition math |
| **HellaSwag** | Commonsense reasoning |
| **TruthfulQA** | Avoiding truthful-sounding falsehoods |
| **MT-Bench** | Multi-turn instruction following |
| **LMSYS Chatbot Arena** | Human preference (ELO-based) |

### LLM-as-a-Judge

Use a capable reference model to evaluate outputs that cannot be checked deterministically. Pointwise grading evaluates one output against a rubric; pairwise grading compares two outputs and therefore needs order swapping.

```text
System: Evaluate only the supplied task, reference evidence, and candidate response.
Return separate fields:
- task_correct: yes/no
- grounded_in_reference: yes/no/not_applicable
- instruction_following: 1-5
- safety_or_policy_violation: yes/no
- concise_rationale: one sentence citing the decisive evidence
```

| Judge risk | Failure | Control |
|------------|---------|---------|
| **Position bias** | One answer position wins too often | Swap answer order and average. |
| **Verbosity bias** | Long output beats correct concise output | Rubric must explicitly score task success, factuality, and concision. |
| **Self/style preference** | Judge favors outputs resembling its own style or family | Calibrate against expert labels and include heterogeneous judges for major decisions. |
| **Rubric ambiguity** | Judge grades style instead of correctness | Use separate rubric items for grounding, tool correctness, safety, and helpfulness. |
| **Missing evidence/domain context** | Judge cannot verify a specialized claim | Supply references, tool observations, and gold constraints; use deterministic checks where possible. |
| **Prompt injection in evaluated text** | Candidate output attempts to control the judge | Delimit evaluated content as data and include adversarial judge tests. |
| **Nondeterminism** | Repeated grading changes the score | Measure repeated-run agreement and adjudicate unstable cases. |
| **Judge drift** | Scores shift after judge model/prompt changes | Version judge model, prompt, rubric, and calibration set. |
| **Weak human agreement** | Judge disagrees with expert labels | Sample disagreements for human review and tune rubric before trusting aggregate scores. |

---

## 9. Hardware & Inference Optimization

### Mixed Precision Training & Inference

Neural networks were traditionally trained using 32-bit floating-point (FP32). Modern LLMs (and deep learning in general) use **Mixed Precision** — combining lower precision (16-bit) and higher precision (32-bit) in a single workflow.

- **FP16 (Half Precision):** Uses 16 bits (1 sign, 5 exponent, 10 fraction). Can represent numbers with higher precision but a smaller range than FP32.
- **BF16 (Brain Floating Point):** Uses 16 bits (1 sign, 8 exponent, 7 fraction). Has the same dynamic range as FP32 but lower precision.

**Why BF16 is commonly preferred on supported hardware:**
- FP16 suffers from "gradient overflow/underflow" — numbers get too large or too close to zero during backpropagation, causing the training to collapse (NaNs).
- BF16 avoids this because its 8-bit exponent gives it the exact same range as FP32. It sacrifices fractional precision, but neural networks are incredibly robust to small precision errors.
- **Mixed Precision Workflow (AMP):** Matrix multiplications use a lower-precision compute dtype while selected reductions, master weights, gradients, or optimizer states may use higher precision depending on the framework and optimizer. Arithmetic throughput can improve substantially, but total memory and speed gains depend on optimizer states, activations, communication, kernels, and hardware.

---

### KV Cache

The most important inference optimization. During autoregressive generation, K and V matrices of previously generated tokens don't change — cache them.

```
Token 1 generated:  compute K1, V1  → cache
Token 2 generated:  compute K2, V2; use cached K1V1 → cache
Token 3 generated:  compute K3, V3; use cached K1V1, K2V2 → cache
```

**Memory cost:** `2 × batch_size × seq_len × n_layers × n_heads × d_head × bytes_per_element`  
For 70B model with 2048 seq len, this can be tens of GB. → Need KV cache management (paged attention / vLLM).

**vLLM's PagedAttention:** Manages KV cache like OS virtual memory — pages allocated on demand, enables higher batch sizes and better GPU utilization.

### Model Compression

Compression changes checkpoint size, memory, latency, or throughput while trying to preserve target behavior.

#### Distillation

Train a smaller student to match teacher outputs, logits, intermediate representations, or task labels. Distillation can produce dense hardware-friendly speedups, but it may transfer teacher errors and lose rare capabilities; validate the same hard slices used for the teacher.

#### Quantization

Reduce model size and speed up inference by using lower precision:

| Precision | Bits | Memory reduction | Quality loss |
|-----------|------|-----------------|-------------|
| FP32 | 32 | 1× (baseline) | None |
| FP16/BF16 | 16 | 2× | Negligible |
| INT8 | 8 | 4× | Minor (with careful calibration) |
| INT4 (GPTQ, AWQ) | 4 | 8× | Small (acceptable for inference) |
| INT2-3 | 2-3 | 12-16× | Significant |

**Post-Training Quantization (PTQ):** Quantize after training (no retraining). Methods:
- **GPTQ:** Layer-by-layer quantization minimizing reconstruction error
- **AWQ (Activation-aware):** Identify and protect important weights (salient activations)
- **GGUF (llama.cpp):** CPU-friendly quantization format

#### LLM Pruning And Layer Dropping

Pruning removes parameters or blocks from a trained model to reduce memory, latency, or serving cost. For LLMs, the key interview point is that smaller checkpoints do not automatically mean faster inference: the hardware must exploit the resulting structure.

| Type | Removes | Production note |
|------|---------|-----------------|
| **Unstructured pruning** | Individual weights | Can shrink checkpoints, but speedup requires sparse kernels and hardware support. |
| **Structured pruning** | Attention heads, MLP neurons, channels, or blocks | More likely to improve latency on standard GPUs because tensor shapes actually shrink. |
| **Movement pruning** | Weights moving toward zero during fine-tuning | Useful for task-specific compression when some training budget exists. |
| **SparseGPT / Wanda-style pruning** | Weights selected by one-shot weight/activation statistics | Useful when retraining budget is limited, but must be validated per layer and task slice. |
| **Layer dropping / depth reduction** | Full Transformer blocks selected by importance | Simple latency win, but can damage reasoning, long-context behavior, and instruction following unevenly. |

**Compression pipeline**

1. Start from a validated base or adapted model and define hardware-specific latency, memory, and quality targets.
2. Compare distillation, structured pruning, unstructured sparsity, and quantization against the kernels the serving stack can exploit.
3. Choose pruning/quantization/recovery order empirically; it is method- and hardware-dependent rather than universal.
4. Use representative calibration data and recovery tuning or adapters when needed.
5. Validate general capabilities, target tasks, hard production slices, safety, structured output, tool use, and long-context behavior.
6. Compare actual TTFT, time per output token, memory, throughput, calibration, and failure modes before release.

**Interview trap:** perplexity may look fine after pruning while structured output, tool-use reliability, rare skills, or long-context retrieval degrade. Always report slice-level regressions, not only average benchmark quality.

### Speculative Decoding

Use a small draft model to generate k tokens; verify with large model in one forward pass. If accepted, free computation; if rejected, fall back.

```
Draft model (7B) → generates tokens [t₁, t₂, t₃, t₄, t₅] speculatively
Large model (70B) → verifies all 5 in one forward pass (parallel)
Accepted tokens: [t₁, t₂, t₃] ✓, [t₄] ✗ → stop, generate correct t₄
Potential speedup depends on draft acceptance and verification cost
```

**When it helps:** long enough generations, high draft acceptance rate, and target-model verification that is cheaper than generating every token serially.

**When it hurts:** very short outputs, poor draft model quality, heavy verifier overhead, or workloads already dominated by retrieval/tools rather than decoding.

**Related fast-decoding ideas**

| Technique | Mechanism | Trade-off |
|-----------|-----------|-----------|
| **Medusa-style heads** | Add heads that predict several future tokens from one base forward pass | Avoids a separate draft model but requires model-specific training. |
| **Prefix KV caching** | Reuse KV cache for shared system prompts or repeated prefixes | Excellent for repeated prompts; requires careful cache invalidation and isolation. |
| **Constrained decoding** | Restrict tokens to a schema or grammar | Improves validity for JSON/tool calls but may reduce flexibility. |

### Decoding Strategies

How a token is selected from the output probability distribution at each step is a separate decision from the model itself — and it drastically changes output quality, diversity, and latency.

#### Greedy Decoding
Always pick the highest-probability token:
```
token = argmax P(token | context)
```
- **Fast, deterministic**
- Tends to produce repetitive, "safe" text
- Best for factual, structured outputs where creativity is unwanted

#### Beam Search
Maintain `k` (beam width) candidate sequences in parallel; at each step expand each beam and keep the top-k overall:
```
Beam 1: "The cat sat on"    (log-prob = -2.1)
Beam 2: "The cat slept on"  (log-prob = -2.4)
Beam 3: "The cat lay on"    (log-prob = -2.6)
→ Expand each by one token, keep top-3 again
```
- **Better quality than greedy** (explores more paths)
- **Expensive:** O(k × vocab) per step
- Still produces dull text; prefers high-probability but generic continuations
- Common for: machine translation, summarization (short, constrained outputs)
- **Not used in LLM chat inference** — too slow and repetitive for open-ended generation

#### Temperature Sampling
Scale logits before softmax to control randomness:
```
P(token) = softmax(logits / T)

T < 1.0 → sharpen distribution → more deterministic, focused
T = 1.0 → original distribution
T > 1.0 → flatten distribution → more random, creative
T → 0   → greedy decoding
T → ∞   → uniform random
```

| Temperature | Effect | Use case |
|------------|--------|---------|
| 0.0 | Greedy (deterministic) | Factual Q&A, code generation |
| 0.2–0.5 | Focused but slight variation | Structured tasks, classification |
| 0.7–0.9 | Balanced creativity | General chat, writing |
| 1.0–1.5 | High creativity | Brainstorming, creative writing |

#### Top-k Sampling
Sample only from the k most likely tokens (ignore the rest):
```
top_k = 50: keep only 50 highest-prob tokens, renormalize, then sample
```
- Prevents sampling very low-probability ("weird") tokens
- **Problem:** k is fixed regardless of the distribution shape — if the distribution is already peaked (k=50 dilutes it), or very flat (k=50 is still too many), the same k behaves differently in different contexts

#### Top-p (Nucleus) Sampling
Sample from the smallest set of tokens whose cumulative probability ≥ p:
```
Sort tokens by probability (descending)
Include tokens until cumulative P ≥ p (e.g., 0.9)
Renormalize and sample from this nucleus
```

```
Example with p=0.9:
token  |  prob  | cumul
"cat"  |  0.60  | 0.60
"dog"  |  0.25  | 0.85
"bird" |  0.08  | 0.93  ← stop here (≥ 0.9)
→ Sample from {cat, dog, bird} with renormalized probs

If distribution is peaked: nucleus = 1-2 tokens (conservative)
If distribution is flat: nucleus = many tokens (expansive)
```

- **Adapts to context** — automatically conservative when the model is confident, exploratory when uncertain
- Most common default in production LLM APIs (OpenAI default: top_p=1.0, but users set 0.9–0.95)

#### Combining Temperature + Top-p
```
1. Apply temperature scaling to logits
2. Apply top-p nucleus filtering
3. Sample
```
Most LLM APIs expose both; typical production settings:
- Factual tasks: `temperature=0.1, top_p=0.9`
- General chat: `temperature=0.7, top_p=0.95`
- Creative writing: `temperature=1.2, top_p=0.98`

#### Repetition Penalty
Reduce the probability of tokens that already appeared in the context:
```
logit[token] = logit[token] / penalty   (if token already generated, penalty > 1)
```
Fixes the common failure mode where greedy/low-temperature decoding loops: "The cat sat on the mat. The cat sat on the mat. The cat…"

#### Min-p Sampling (newer)
Filter out tokens whose probability < `min_p × (probability of most likely token)`. Adapts threshold relative to the top token, avoids the fixed-k problem of top-k while being more principled than top-p for high-temperature settings.

---

### Dynamic Batching for Inference

LLM inference has a fundamental throughput problem: **each forward pass generates only one token per sequence**, and GPU utilization collapses if you process requests one at a time.

#### Why Static Batching Falls Short

```
Static batch of 3 requests:
Request A: needs 20 tokens  → done at step 20
Request B: needs 50 tokens  → done at step 50
Request C: needs 30 tokens  → done at step 30

Step 20: A finishes. GPU sits idle for A's slot until step 50.
Step 30: C finishes. GPU sits idle for C's slot until step 50.
→ ~50% GPU waste waiting for the longest request
```

GPU is underutilized because it must wait for the entire batch to finish before starting new requests.

#### Continuous Batching (Iteration-Level Scheduling)

Process each decoding *step* as an opportunity to add or remove sequences:

```
Step 1:  [A, B, C] → all generate token 1
Step 2:  [A, B, C] → all generate token 2
...
Step 20: A finishes → immediately insert new request D
Step 21: [B, C, D] → B and C continue; D starts from token 1
Step 30: C finishes → immediately insert E
...
```

- New requests can enter as decode slots become available instead of waiting for the whole batch
- Utilization and throughput usually improve, subject to scheduler overhead, memory pressure, and workload shape
- Implemented by several specialized LLM serving runtimes

#### Prefill vs Decode Phases

Every LLM request has two distinct phases with very different compute profiles:

| Phase | What happens | Compute type | Bottleneck |
|-------|-------------|-------------|-----------|
| **Prefill** | Process the full prompt in one forward pass | Compute-bound (matrix multiply) | GPU FLOPS |
| **Decode** | Generate one token at a time, autoregressively | Memory-bound (load weights each step) | GPU memory bandwidth |

**Disaggregated serving:** Route prefill and decode to different GPU pools, each optimized for its bottleneck. Prefill GPUs need raw FLOPS; decode GPUs need high memory bandwidth. Used at scale by hyperscalers.

#### Serving Latency Metrics

| Metric | Meaning | What improves it |
|--------|---------|------------------|
| **TTFT** | Time to first token | Shorter prompts, prefix caching, faster prefill, routing to smaller model. |
| **TPOT** | Time per output token | Faster decode stack, quantization, smaller model, better batching. |
| **Inter-token latency** | Gap between streamed tokens | Decode optimization and scheduler fairness. |
| **End-to-end latency** | Request received to final token | Prompt size, retrieval, tools, prefill, decode, post-processing. |
| **P95/P99 latency** | Tail behavior | Separate long prompts, cap context, use timeouts, and monitor per route. |

Optimizing only average latency is misleading. A system can have good mean latency while long-context or tool-heavy requests create unacceptable tail behavior.

#### Chunked Prefill

Long prompts (e.g., 32K tokens) block the GPU during prefill — no decoding happens meanwhile, hurting latency for other requests. **Chunked prefill** breaks the prompt into smaller chunks, interleaving prefill chunks with decode steps:

```
Without chunked prefill:
[prefill 32K tokens ................ 200ms] [decode, decode, decode ...]
      ↑ other requests are starved

With chunked prefill (chunk=2K):
[prefill 2K] [decode × N] [prefill 2K] [decode × N] ...
      ↑ more uniform latency; other requests can be decoded in between
```

#### Paged Attention (vLLM)

KV cache is the main memory bottleneck — it grows dynamically as sequences extend, and different requests have different lengths. Naive allocation wastes memory via internal fragmentation.

**PagedAttention** treats KV cache like OS virtual memory:
- Divide KV cache into fixed-size **pages** (e.g., 16 tokens per page)
- Allocate pages on demand as sequence grows
- Share pages between requests (for prefix caching / shared system prompts)
- Reclaim pages immediately when a request finishes

```
Sequence A (20 tokens): [page 1: tok 1-16] [page 2: tok 17-20, 4 slots free]
Sequence B (10 tokens): [page 3: tok 1-10, 6 slots free]
→ No large pre-allocated block; minimal waste
```

**Prefix caching:** If many requests share the same system prompt, cache those KV pages and reuse across requests — reduces prefill cost to zero for the shared prefix.

#### Batching Summary

| Technique | What it solves | Key benefit |
|-----------|--------------|-------------|
| **Continuous batching** | GPU idle time between requests | Near 100% GPU utilization |
| **Chunked prefill** | Long prompts starving decode | Uniform latency; better fairness |
| **PagedAttention** | KV cache memory fragmentation | Higher batch sizes, less OOM |
| **Prefix caching** | Repeated system prompts | Free KV reuse; lower TTFT |
| **Disaggregated serving** | Prefill/decode compute mismatch | Better hardware specialization |

---

## 10. Context Window & Long-Context

Advertised context capacity is model- and version-specific and changes frequently. More importantly, fitting tokens does not guarantee reliable retrieval, instruction retention, or acceptable latency. Benchmark the exact model, prompt format, evidence position, and context length used in production.

### Context Strategy

Long context should be managed, not simply filled.

| Strategy | Use for | Why it matters |
|----------|---------|----------------|
| **Pinned state object** | current goal, slots, constraints, tool results, pending actions | More reliable than hoping the model recovers key facts from old text. |
| **Sliding window** | recent interaction history | Preserves local coherence without unlimited growth. |
| **Structured summaries** | older commitments and unresolved issues | Compresses history while keeping durable facts. |
| **Selective retrieval** | external knowledge and long-term memory | Adds relevant context without flooding the prompt. |
| **Instruction reinjection** | critical rules near decision points | Reduces instruction dilution in long contexts. |
| **Context pruning** | stale, redundant, or low-value text | Improves latency and reduces distraction. |

**Failure to watch:** memory contamination. Retrieved or summarized content can be stale, sensitive, or irrelevant; treat it as data with provenance, not as new system instructions.

### Lost in the Middle

Many models show position sensitivity on long-context retrieval: relevant information in the middle can be used less reliably than information near the beginning or end, even when every token fits. The size of the effect depends on the model, task, prompt format, distractors, and context length.

```
Context: [Doc 1] [Doc 2] ... [Doc 10 ← relevant] ... [Doc 20]
                                ↑
                        Model often misses this

Observed accuracy must be measured for the exact model and evaluation setup.
```

Potential contributors include position sensitivity, distractor interference, prompt structure, training distribution, and imperfect retrieval or use of evidence. Treat these as hypotheses to test rather than one universal causal explanation.

**Practical mitigations:**
- Place the most important context at the **start or end** of the prompt, not the middle
- Use **re-ranking** in RAG to put the highest-relevance chunks at the extremes
- Reduce context size: retrieve fewer, more precise chunks rather than many mediocre ones
- Benchmark models trained for long context, but do not assume an advertised window removes position sensitivity

### Long-Context Interference

Longer contexts add distractors, repeated entities, conflicting instructions, stale history, and more opportunities to retrieve the wrong span. The fact that attention weights sum to one does not imply every important token's weight must shrink proportionally, and no inference-time "gradient weakening" explanation applies. Evaluate whether the model locates and uses the correct evidence, not an average-attention heuristic.

**Implications for system design:**
| Scenario | Impact | Mitigation |
|---------|--------|-----------|
| Long RAG context | Middle chunks ignored | Rerank; put best chunks first/last |
| Long conversation history | Early turns diluted | Summarise old turns; sliding window memory |
| System/developer instruction + long input | Critical rule becomes behaviorally weak | Reinject the rule through the same trusted instruction channel near the decision point; never copy untrusted text into that channel |
| Multi-document QA | Cross-document signals diluted | Chunk-level retrieval; targeted extraction |

**Attention complexity:** O(n²) makes very long sequences expensive

**KV cache size:** Grows linearly with sequence length

**Efficiency and context-extension techniques:**
- **FlashAttention:** Tiled computation that avoids materializing the full attention matrix; 2-4× speedup, same output
- **RoPE scaling (YaRN, LongRoPE):** Extend to longer contexts without full retraining
- **Sliding window attention:** Each token only attends to W neighbors; O(n·W) complexity (Mistral)

---

## 11. Hallucination & Grounding

LLMs generate fluent, plausible-sounding text that may be factually wrong.

### Why Hallucinations Happen

1. **Parametric knowledge gaps:** Events after training cutoff; obscure facts
2. **Overconfidence:** Models produce fluent text even when uncertain
3. **Instruction following over accuracy:** Fine-tuning to be helpful may override accuracy
4. **Lack of grounding:** No retrieval mechanism

### Mitigation Strategies

| Strategy | Mechanism |
|---------|-----------|
| **RAG** | Ground answers in retrieved documents |
| **Low-variance decoding** | Improves reproducibility but does not make unsupported facts correct |
| **Calibrated abstention** | Use evidence/uncertainty thresholds and escalate when support is weak |
| **Independent verification** | Deterministic tools, claim-level entailment checks, or external validators |
| **Structured constraints** | Enforce schemas, types, and allowed values where the output space is formal |
| **Citation validation** | Require citations and verify that each cited source supports its claim |
| **RLHF / DPO** | Train against confabulation via human feedback |

---

## 12. Embeddings & Vector Search

### Text Embeddings

Dense vectors encode model-specific semantic relationships. Compare vectors using the normalization and distance metric expected by the embedding model and index.

Choose an embedding model by language/domain coverage, maximum input length, dimensionality, normalization and distance assumptions, throughput, licensing, and retrieval quality on labeled queries. Rebuild or version the index whenever the embedding model or preprocessing changes.

### Approximate Nearest Neighbor (ANN) Algorithms

| Algorithm / library | How | Trade-off |
|---------------------|-----|----------|
| **HNSW** | Hierarchical graph; greedily search navigable small world | Fast query, high memory |
| **IVF (Inverted File)** | Cluster vectors; search only nearby clusters | Lower memory; requires training |
| **IVF-PQ** | IVF + Product Quantization (compress vectors) | Very memory-efficient; some quality loss |
| **FAISS** | Meta's library implementing exact, HNSW, IVF, PQ, and GPU variants | Implementation library, not one algorithm |
| **ScaNN** | Partitioning + quantization + candidate reordering | Strong CPU recall/latency trade-off |

**Recall vs Speed tradeoff:** Larger HNSW `efSearch`, more IVF probes, more ScaNN leaves, or larger rerank pools improve recall but increase latency and memory. Production RAG systems usually tune ANN recall separately from final answer quality because generation can look fluent even when retrieval missed the right evidence.

---

## 13. Scaling Laws

Scaling laws describe the predictable relationship between model performance and compute, data, and parameters. Understanding them is essential for making resource allocation decisions.

### Kaplan et al. (OpenAI, 2020) — Original Scaling Laws

```
Loss(N, D, C) ≈ (Nₒ/N)^αN + (Dₒ/D)^αD + L_irreducible

Where:
  N = number of parameters
  D = dataset size (tokens)
  C = compute budget (FLOPs)
  L = cross-entropy loss
```

**Key findings:**
- Performance improves as a **power law** with N, D, and C
- Larger models are more **sample-efficient** (learn more per token)
- Original recommendation: scale model size faster than data

### Chinchilla (DeepMind, 2022) — The Correction

Chinchilla showed that most large models were **undertrained** — they had too many parameters for the amount of data they saw.

```
Optimal allocation: N ∝ C^0.5,  D ∝ C^0.5

Translation: Parameters and tokens should scale equally.
For a compute-optimal model: tokens ≈ 20 × parameters

Chinchilla (70B params, 1.4T tokens) > Gopher (280B params, 300B tokens)
  despite being 4× smaller — because it saw 4.7× more data
```

**Practical implications:**
- Compute-optimal ratios are empirical results for a training regime, not universal constants across data quality, architecture, and objectives.
- When serving cost dominates, training a smaller model longer can be economically preferable to repeatedly serving a larger model.
- Make the choice with total lifecycle cost and target-task quality, not parameter count alone.

### Emergent Abilities

Capabilities can appear discontinuous under thresholded metrics, but the apparent threshold depends on data, prompting, architecture, and evaluation. Continuous metrics often reveal smoother scaling, so avoid memorizing parameter-count boundaries as laws.

---

## 14. Mixture of Experts (MoE)

MoE is an architecture where only a subset of model parameters are activated for each input, enabling much larger models with the same computational cost.

```
Input x → Router (gating network) → selects top-k experts
       → Expert 1: FFN₁(x) ─┐
       → Expert 2: FFN₂(x) ─┤→ Weighted sum → output
       → ...                 │
       → Expert N: FFNₙ(x)  ┘  (only top-k are computed)
```

### How MoE Works

Standard Transformer: every token goes through every FFN layer.
MoE Transformer: a **router** selects k (typically 2) out of N experts per token.

```
Standard FFN:  Every token → FFN (d_model × d_ff × 2 parameters)
MoE FFN:       Each token → Router → top-2 of 8 experts
               Total parameters: 8× more
               Active parameters per token: 2/8 = 25% (same compute as standard)
```

### Key Components

| Component | What it does | Implementation |
|-----------|-------------|---------------|
| **Router / Gate** | Decides which experts handle each token | Linear layer → softmax → top-k selection |
| **Experts** | Individual FFN modules | Standard FFN, each with full d_model × d_ff parameters |
| **Load balancing loss** | Prevents all tokens from routing to the same expert | Auxiliary loss: penalize uneven expert utilization |
| **Expert parallelism** | Distribute experts across GPUs | Each GPU holds a subset of experts; all-to-all communication |

### MoE Models

| Model | Total params | Active params | Experts | Top-k |
|-------|-------------|---------------|---------|-------|
| **Mixtral 8×7B** | 46.7B | ~12.9B | 8 | 2 |
| **Mixtral 8×22B** | 141B | ~39B | 8 | 2 |
| **DeepSeek-V2** | 236B | ~21B | 160 | 6 |
| **Grok-1** | 314B | ~86B | 8 | 2 |

### MoE Trade-offs

| Advantage | Disadvantage |
|-----------|-------------|
| Much larger capacity per FLOP | Higher total memory (all experts must be loaded) |
| Better performance at same compute | All-to-all communication overhead in distributed training |
| Scales well beyond dense model limits | Load balancing is tricky; some experts may be underutilized |
| Lower active compute than an equally large dense model | Routing, expert memory, communication, and serving topology can still increase latency |

### Router Collapse

The biggest training failure mode: all tokens route to the same 1-2 experts, leaving others unused. Prevented by:
- **Load balancing loss:** Penalize the variance in expert utilization
- **Expert capacity factor:** Cap how many tokens each expert can handle per batch
- **Random routing with noise:** Add noise to router logits during training

**Interview tip:** "MoE increases total capacity without activating every parameter for every token. The main challenges are routing quality, load balancing, expert memory, all-to-all communication, and serving topology."

---

## 15. Multi-Modal Models

Models that process and reason across multiple modalities such as text, images, video, and code.

### Vision-Language Models

| Model | Architecture | Capabilities |
|-------|-------------|-------------|
| **CLIP** | Dual-encoder (image + text) | Zero-shot image classification, image-text retrieval |
| **LLaVA** | Vision encoder + LLM (projection layer) | Visual Q&A, image reasoning |
| **GPT-4V / GPT-4o** | Native multimodal | Image understanding, OCR, diagram analysis |
| **Gemini** | Natively multimodal from pre-training | Text, image, video, code |

### CLIP — Contrastive Language-Image Pre-training

```
Image → Vision Encoder (ViT) → image embedding ──┐
                                                   ├→ cosine similarity
Text  → Text Encoder (Transformer) → text embedding ┘

Training: for N (image, text) pairs:
  maximize similarity of correct pairs
  minimize similarity of incorrect pairs
```

**CLIP's power:** Zero-shot classification — describe any class in text ("a photo of a cat"), compute similarity with an image, no task-specific training needed.

### LLaVA-style Architecture

```
Image → Pre-trained Vision Encoder → visual tokens
                                         ↓
                                    [Projection Layer]
                                         ↓
Text tokens + Visual tokens → Pre-trained LLM → response
```

**Training stages:**
1. Pre-train projection layer on image-caption pairs (align visual tokens to LLM space)
2. Fine-tune end-to-end on visual instruction data (visual Q&A, reasoning)

### Multi-Modal Interview Points

- **Modality alignment:** The core challenge is mapping different modalities into a shared representation space
- **Visual tokens:** Images are converted to sequences of tokens (ViT patches), treated like text tokens by the LLM
- **Cost:** Images are expensive — a single 1024×1024 image may consume 1000+ tokens of context
- **Hallucination in vision:** Models may "see" things that aren't there; more severe than text-only hallucination

---

## 16. Constitutional AI & Safety

Beyond RLHF/DPO, Anthropic's Constitutional AI (CAI) provides a scalable alignment approach using principles rather than human labels.

### How Constitutional AI Works

```
Step 1: Red-teaming — generate harmful outputs from the model
Step 2: Self-critique — ask the model to critique its own response against a constitution
        "Does this response violate the principle: 'Choose the response that is least harmful'?"
Step 3: Revision — model revises its response based on the critique
Step 4: RLAIF — use the revised outputs for preference training (RL from AI Feedback)
```

**Key insight:** Instead of human labelers judging every response, define a set of principles (the "constitution") and have the AI judge itself against those principles. This is more scalable and consistent than human feedback alone.

### The Constitution

A set of natural language principles, for example:
- "Choose the response that is most helpful to the human"
- "Choose the response that is least likely to be used to harm someone"
- "Choose the response that is most honest"

### Guardrails in Production

| Guardrail | Implementation | Purpose |
|-----------|---------------|---------|
| **Input filtering** | Classifier on user messages | Block prompt injection, jailbreaks |
| **Output filtering** | Classifier on model responses | Block harmful, biased, or PII-containing outputs |
| **NeMo Guardrails** | NVIDIA's framework; LLM-based dialogue rails | Topical control, safety, hallucination prevention |
| **Guardrails AI** | Schema validation + LLM validators | Structured output validation, factuality checking |
| **Red-teaming** | Adversarial testing before deployment | Find failure modes proactively |

---

## 17. Synthetic Data & Data Curation

Increasingly, the quality and curation of training data matters more than the model architecture.

### Synthetic Data Generation

| Method | How | Use case |
|--------|-----|---------|
| **LLM-generated** | Use GPT-4/Claude to generate training examples | Instruction tuning (Alpaca, WizardLM) |
| **Self-instruct** | Model generates instructions, inputs, and outputs | Bootstrap training data from a seed set |
| **Evol-Instruct** | Iteratively make instructions more complex | WizardLM; progressive difficulty |
| **Distillation** | Large model generates outputs; train smaller model | Most cost-effective for specific tasks |
| **Back-translation / Paraphrase** | Generate variations of existing data | Data augmentation for NLP |

### Data Quality > Data Quantity

| Principle | Evidence |
|-----------|---------|
| **LIMA (Less Is More for Alignment)** | 1,000 carefully curated examples can align a model as well as 52K noisy ones |
| **Phi-1 / Phi-2 (Microsoft)** | "Textbook-quality" data enables small models to outperform much larger ones |
| **Data deduplication** | Removing duplicates improves quality; training on duplicates causes memorization |
| **Data mixing** | Optimal ratios of code, math, text, reasoning data for balanced capabilities |

### Data Contamination

A critical evaluation concern: if benchmark test data appears in the training set, reported scores are inflated.

- **Detection:** n-gram overlap analysis between training corpus and benchmark
- **Prevention:** Release benchmarks after training cutoff; use dynamic benchmarks (Chatbot Arena)
- **Impact:** Models may score 90%+ on GSM8K while failing on rephrased versions of the same problems

**Interview tip:** "Modern LLM improvements come as much from data curation as from architecture. Phi-2 showed that 1.3B parameters trained on textbook-quality synthetic data can match models 10× larger on reasoning benchmarks. The trend is toward smaller, better-trained models — which aligns with Chinchilla scaling laws."

---

## Interview Quick-Reference

**"Why does Chain-of-Thought help, and when does it fail?"**
→ CoT works by externalising reasoning as tokens — each step becomes context for the next, allocating more effective compute to the problem. Three mechanisms: more computation per answer, error localisation, and conditioning effect. It fails when: (1) the model generates plausible-sounding but wrong reasoning ("hallucinated CoT"), (2) the reasoning is a post-hoc rationalisation of a wrong pre-decided answer (faithfulness gap), (3) errors cascade through dependent steps, or (4) the task has no useful intermediate steps (simple recall, classification). Mitigation: self-consistency sampling + tool-based verification of arithmetic steps.

**"Explain lost in the middle and long-context interference"**
→ Long-context models can show position sensitivity and distractor interference, so evidence in the middle may be used less reliably. The magnitude and causes are model- and task-dependent; benchmark the exact setup. In RAG, retrieve fewer high-quality chunks, rerank them, remove duplicates/conflicts, and test evidence use by position.

**"Explain the Transformer architecture"**
→ Token embeddings + positional encoding → N layers each: LayerNorm + Multi-Head Self-Attention (Q·Kᵀ/√d scaled softmax weighted sum of V) + residual, LayerNorm + FFN + residual → linear layer + softmax over vocab.

**"Why is RAG better than fine-tuning for factual Q&A?"**
→ Fine-tuning bakes knowledge into weights (can't update easily, may forget). RAG retrieves at inference time — updatable, inspectable, citable. Fine-tuning better for behavior/style changes; RAG better for knowledge-intensive tasks.

**"What is LoRA and why use it?"**
→ LoRA adds a trainable low-rank update (B·A) to selected frozen weight matrices. For one d×k matrix it trains r(d+k) parameters instead of dk; total savings depend on rank and target modules. It can be merged for serving, while runtime adapters support separate task or tenant variants.

**"How does KV cache work?"**
→ During autoregressive generation, Q/K/V matrices of past tokens are recomputed on every new token. KV cache stores K and V for all past tokens, so each new step only computes for the new token. Critical for inference efficiency; trades memory for compute.

**"What's the difference between RLHF and DPO?"**
→ RLHF with PPO trains a reward model and optimizes a policy against it with a reference/KL constraint. DPO directly optimizes chosen-versus-rejected pairs relative to a reference policy, avoiding online RL and a separately served reward model during optimization. Relative quality depends on data, objective, and tuning.

**"How would you reduce hallucinations in production?"**
→ Improve evidence retrieval, validate citations and claim support, use deterministic tools for verifiable facts, calibrate abstention/escalation thresholds, and monitor unsupported-claim rate. Lower temperature improves reproducibility, not factual correctness.

**"Greedy vs Beam Search vs Top-p — when do you use each?"**
→ Greedy is deterministic and useful when reproducibility matters. Beam search explores multiple high-probability sequences and is common in constrained sequence tasks, but can be expensive or repetitive. Top-p samples from an adaptive probability mass for open-ended generation. Tune decoding against task quality rather than treating one method as universally best.

**"What is continuous batching and why does it matter?"**
→ Static batching waits for all sequences in the batch to finish before admitting new work. Continuous batching can insert requests as decode slots free up, improving utilization and throughput; the gain depends on traffic, sequence lengths, scheduler, and hardware.

**"Explain the prefill vs decode distinction in LLM inference"**
→ Prefill processes the full prompt in a single parallel forward pass — compute-bound (bottlenecked by FLOPS). Decode generates one token at a time — memory-bound (bottlenecked by loading model weights from GPU HBM each step). This is why throughput and latency scale differently. Disaggregated serving routes them to separate GPU pools optimized for each workload.

**"What are scaling laws and how do they guide training decisions?"**
→ Performance often follows empirical power laws in model size, data, and compute. Chinchilla found a roughly 20-tokens-per-parameter compute-optimal ratio for its regime, but the ratio is not universal across data quality, architecture, and objectives. When serving dominates lifecycle cost, training a smaller model longer may be economical; decide from target quality and total train-plus-serve cost.

**"How does Mixture of Experts (MoE) work?"**
→ Replace the dense FFN in each Transformer layer with N expert FFNs and a learned router. Each token is routed to the top-k experts (typically 2 of 8). Total parameters are N× larger, but active parameters per token stay the same. Mixtral 8×7B has 46.7B total but only activates 12.9B per token. Main challenge: router collapse — need load balancing loss to ensure all experts are utilized.

**"How does tokenization affect LLM behavior?"**
→ BPE splits text into subword tokens based on frequency in the training corpus. This means: (1) arithmetic is hard because numbers like "42137" split into ["42","137"], (2) non-English text uses 3-5× more tokens reducing effective context, (3) the tokenizer must match the model — using the wrong one produces garbage. Token count ≈ 1.3× word count for English.

**"How do multi-modal models like GPT-4V process images?"**
→ Images are split into patches (like ViT), projected into the same embedding space as text tokens via a learned projection layer, then fed into the LLM alongside text tokens. The LLM treats visual tokens like text. Main challenges: images are expensive (~1000+ tokens each), visual hallucination is more severe than text, and modality alignment requires careful pre-training.
