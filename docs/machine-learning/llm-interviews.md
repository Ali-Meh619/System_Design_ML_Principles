# LLM Interview Questions

> Modern GenAI for engineering interviews: Transformers from first principles, RAG architecture, fine-tuning strategies, inference optimization, alignment, and evaluation. These are the questions being asked at top companies today.

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

**RoPE is the current standard** for most open-source LLMs because it naturally encodes relative positions and works well with context length extension.

---

## 2. Tokenization

Tokenization converts raw text into a sequence of integer IDs that the model can process. It's fundamental to how LLMs work, yet often overlooked in preparation.

### Why Not Characters or Words?

| Approach | Problem |
|---------|---------|
| **Characters** | Sequences too long; model struggles to learn word semantics from individual characters |
| **Words** | Vocabulary too large (millions); cannot handle new/rare words (OOV problem) |
| **Subwords** | Best of both — common words are single tokens, rare words decompose into known subparts |

### Byte Pair Encoding (BPE) — The Standard

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
| **Deployment adaptation** | Compresses, routes, caches, and serves the model | Quantization, distillation, pruning, adapters, and batching must be validated on task slices, not only generic benchmarks. |

---

## 4. Fine-Tuning Strategies

### Full Fine-Tuning

Update all model parameters on task-specific labeled data.

- Pro: Best performance if enough data
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

- Only train A and B (tiny fraction of total parameters)
- At inference: merge into W_new = W + B·A (no latency overhead)
- Typical r = 8 or 16; often reduces trainable params by 10,000×

**Which layers to apply LoRA to?** Query/Value projections in attention (most common). Sometimes Key, FFN layers too.

| Method | Trainable Params | Memory | Performance |
|--------|----------------|--------|-------------|
| Full fine-tune | 100% | Very high | Best |
| LoRA (r=16) | ~0.1-0.5% | Much lower | Close to full FT |
| QLoRA | ~0.1-0.5% | Very low (4-bit base) | Slightly below LoRA |
| Prompt Tuning | < 0.01% | Minimal | Good for large models |
| Prefix Tuning | < 0.1% | Minimal | Good for generation |

#### QLoRA (Quantized LoRA)

LoRA applied to a 4-bit quantized base model. Enables fine-tuning 65B+ parameter models on a single 48GB GPU.

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
| **Rank `r`** | Capacity of the low-rank update | Start low for style or format; increase for harder behavior changes or domain vocabulary. |
| **Alpha scaling** | Strength of the adapter update | Too high can destabilize base behavior; too low underfits. Tune on both target-task and regression slices. |
| **Target modules** | Which layers receive adapters | Q/V is common; add K/O or MLP layers when the behavior change needs more capacity. |
| **Dropout** | Regularizes adapter activations | Useful for small or noisy datasets; too much makes the adapter weak. |
| **Merge vs runtime adapter** | Bake adapter into weights or load dynamically | Merge for one global behavior; runtime adapters for task, tenant, or domain-specific behavior. |
| **Adapter routing** | Select adapter by request type | Powerful but needs a reliable router and tests for wrong-adapter activation. |

**PEFT variants to know**

| Method | What changes | When to mention |
|--------|--------------|-----------------|
| **LoRA** | Learns low-rank additive updates | Default PEFT answer. |
| **DoRA** | Separates weight direction and magnitude adaptation | Can help when LoRA capacity is not enough but full fine-tuning is too expensive. |
| **QLoRA** | Trains LoRA on a quantized frozen base | Memory-constrained fine-tuning. |
| **AdaLoRA** | Allocates adapter rank unevenly by layer importance | Useful when capacity budget is tight. |
| **Prefix / prompt tuning** | Learns soft prompt vectors, not weight updates | Cheap adaptation for large models, weaker for complex tool behavior. |

### PEFT Methods: What Actually Trains

The interview distinction is not just "few parameters." It is what receives trainable capacity, where it enters the Transformer, and whether the serving path can merge it away.

| Method | What is trained | Where it enters | Inference cost | Strengths and failure modes |
|--------|-----------------|-----------------|----------------|-----------------------------|
| **Prompt tuning / soft prompt tuning** | A small table of continuous prompt embeddings | Prepended to the input embedding sequence | Extra prompt tokens consume context; no new matrix multiplies | Cheapest adaptation for very large models and simple classification/style tasks. It is weaker for complex reasoning, tool behavior, or tasks needing new domain concepts. The learned vectors are not natural-language prompts. |
| **Prefix tuning** | Trainable prefix vectors, often projected into per-layer key/value states | Injected into attention layers as virtual prefix K/V or prefix activations | Extra prefix states increase KV cache and attention work | More expressive than prompt tuning for generation control because every layer sees task-specific conditioning. It can overfit narrow output formats and wastes context/cache budget if the prefix is too long. |
| **Bottleneck adapters** | Small down-projection/up-projection modules with nonlinearities | Inserted inside or after attention/MLP blocks while base weights stay frozen | Adds runtime matmuls unless optimized or architecture supports adapter fusion | Good when each task/domain needs moderate capacity. Useful for multi-task serving, but wrong-adapter routing and adapter/version drift need explicit tests. |
| **LoRA** | Low-rank matrices `A` and `B` that form an additive update to selected weights | Usually Q/V attention projections; sometimes K/O and MLP layers | Can be merged into base weights for no extra latency | Default PEFT answer. Target modules, rank, alpha, and merge policy determine quality and serving complexity. |
| **DoRA** | LoRA-style direction updates plus a separately learned magnitude term | Same target modules as LoRA | Similar to LoRA, depending on implementation | Helps when plain LoRA underfits because direction and scale need different adaptation. Mention it when low-rank capacity is close but not enough. |
| **QLoRA** | LoRA adapters on top of a frozen 4-bit base | Same as LoRA; base weights are quantized and frozen | Dequantization happens for compute; optimizer state remains LoRA-only | Best answer for memory-constrained fine-tuning of large models. Watch quantization sensitivity, sequence-length memory spikes, and evaluation regressions by task slice. |
| **AdaLoRA** | Adaptive low-rank updates with rank budget reallocated by layer importance | Same target modules as LoRA, but rank varies across layers | Similar to LoRA after allocation | Useful when a fixed rank wastes capacity. It adds tuning complexity and needs stable importance estimates. |

**Decision rule**

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

```
User query
    │
    ▼
[Embedding Model] → query vector
    │
    ▼
[Vector Database] → top-k similar chunks (cosine similarity)
    │
    ▼
[Context = top-k chunks + user query]
    │
    ▼
[LLM] → grounded response
```

### Core Components

| Component | Purpose | Examples |
|-----------|---------|---------|
| **Chunking** | Split documents into retrievable pieces | Fixed-size, recursive, semantic, sentence-window |
| **Embedding model** | Convert text to dense vectors | OpenAI text-embedding-3, Cohere, BGE, E5 |
| **Vector DB** | Approximate nearest neighbor search | Pinecone, Weaviate, Qdrant, pgvector, Faiss |
| **Retriever** | Find top-k chunks by similarity | Semantic (dense), BM25 (sparse), Hybrid |
| **Re-ranker** | Re-score top-k chunks for precision | Cross-encoder (e.g., ms-marco-MiniLM) |
| **Generator** | Produce answer from context | GPT-4, Claude, LLaMA, Mistral |

### RAG Failure Modes

| Problem | Cause | Fix |
|---------|-------|-----|
| Wrong chunks retrieved | Bad embeddings or chunking | Smaller chunks, better overlap, re-ranking |
| Relevant chunk retrieved but ignored | LLM ignores context ("lost in the middle") | Put most relevant at start/end; reduce context size |
| Hallucination despite retrieval | LLM overrides context with parametric knowledge | Stronger system prompt: "only use provided context" |
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

**Problem:** RLHF is complex, unstable, and slow. PPO requires 4 models in memory simultaneously (actor, critic, reference, reward model).

### DPO (Direct Preference Optimization)

Reformulates RLHF as a supervised learning problem — no RL required.

```
Given preference data: (prompt, chosen_response, rejected_response)
Loss = -log σ(β · (log π(chosen|x) - log π(rejected|x) - log π_ref(chosen|x) + log π_ref(rejected|x)))
```

- **β** controls how far from reference model
- Much simpler than RLHF: single training loop, no reward model
- Used by: LLaMA-2, Zephyr, many open-source fine-tunes

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

#### Why Perplexity Fails for Reasoning Models

**Perplexity** measures how well a model predicts a sample of text (the "suprise" of seeing a sequence of words). Historically, a lower perplexity meant a better, more capable language model.

However, this metric **breaks down completely when evaluating modern reasoning models (like OpenAI o1 or DeepSeek-R1)**.

1. **Reasoning Models Don't Just Predict the Next Token:** These models generate an invisible (or visible) "chain of thought" before answering. Their goal is not to maximize the probability of the *exact* next word in human text, but to explore reasoning paths (which are often messy, self-correcting, and non-linear) to arrive at a correct final answer.
2. **High Perplexity Does Not Mean Poor Quality:** A model exploring complex logic, pausing to rethink, or generating novel intermediate steps might have a high perplexity (because its internal monologue doesn't look like standard human training data), but it will often produce a vastly superior answer.
3. **The Shift to Outcome-Based Metrics:** We must evaluate reasoning models based on outcome metrics like **Exact Match** (e.g., in math or coding benchmarks like GSM8K or HumanEval), **Pass@k**, or **LLM-as-a-Judge**, rather than token-level prediction accuracy.

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

Use a stronger LLM (GPT-4) to evaluate outputs:

```
System: "You are evaluating responses. Score 1-10 on helpfulness and accuracy."
User: "Prompt: {prompt}\nResponse: {response}\nScore and reasoning:"
```

**Biases to watch:** Position bias (prefers first option), verbosity bias (prefers longer), self-enhancement bias (LLM prefers its own outputs).

| Judge risk | Failure | Control |
|------------|---------|---------|
| **Position bias** | One answer position wins too often | Swap answer order and average. |
| **Verbosity bias** | Long output beats correct concise output | Rubric must explicitly score task success, factuality, and concision. |
| **Rubric ambiguity** | Judge grades style instead of correctness | Use separate rubric items for grounding, tool correctness, safety, and helpfulness. |
| **Judge drift** | Scores shift after judge model/prompt changes | Version judge model, prompt, rubric, and calibration set. |
| **Weak human agreement** | Judge disagrees with expert labels | Sample disagreements for human review and tune rubric before trusting aggregate scores. |

---

## 9. Hardware & Inference Optimization

### Mixed Precision Training & Inference

Neural networks were traditionally trained using 32-bit floating-point (FP32). Modern LLMs (and deep learning in general) use **Mixed Precision** — combining lower precision (16-bit) and higher precision (32-bit) in a single workflow.

- **FP16 (Half Precision):** Uses 16 bits (1 sign, 5 exponent, 10 fraction). Can represent numbers with higher precision but a smaller range than FP32.
- **BF16 (Brain Floating Point):** Uses 16 bits (1 sign, 8 exponent, 7 fraction). Has the same dynamic range as FP32 but lower precision.

**Why BF16 is the standard for modern LLM training:**
- FP16 suffers from "gradient overflow/underflow" — numbers get too large or too close to zero during backpropagation, causing the training to collapse (NaNs).
- BF16 avoids this because its 8-bit exponent gives it the exact same range as FP32. It sacrifices fractional precision, but neural networks are incredibly robust to small precision errors.
- **Mixed Precision Workflow (AMP):** The model weights, gradients, and optimizer states are kept in FP32 (the "master weights") to prevent small updates from disappearing. But the massive matrix multiplications during the forward and backward passes are cast down to BF16, leveraging the specialized Tensor Cores on modern GPUs (like Nvidia A100/H100). This roughly **halves VRAM usage and doubles computation speed** without losing model quality.

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

### Quantization

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

### Speculative Decoding

Use a small draft model to generate k tokens; verify with large model in one forward pass. If accepted, free computation; if rejected, fall back.

```
Draft model (7B) → generates tokens [t₁, t₂, t₃, t₄, t₅] speculatively
Large model (70B) → verifies all 5 in one forward pass (parallel)
Accepted tokens: [t₁, t₂, t₃] ✓, [t₄] ✗ → stop, generate correct t₄
Net speedup: ~2-3× if draft model accepts often enough
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

#### Top-p (Nucleus) Sampling — The Standard
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

#### Combining Temperature + Top-p (Production Default)
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

- **New requests never wait** for the current batch to finish
- GPU stays near 100% utilization
- Standard in: **vLLM**, **TGI (Text Generation Inference)**, **TensorRT-LLM**

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

| Model | Context Window |
|-------|--------------|
| GPT-3.5 | 16K tokens |
| GPT-4o | 128K tokens |
| Claude 3.5 | 200K tokens |
| Gemini 1.5 Pro | 1M tokens |

**Challenges with long context:**

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

Empirically, LLM accuracy on retrieval tasks degrades significantly when the relevant information is placed in the **middle of a long context**, even when the model technically "fits" the full context.

```
Context: [Doc 1] [Doc 2] ... [Doc 10 ← relevant] ... [Doc 20]
                                ↑
                        Model often misses this

Performance by position of relevant document:
  Position 1  (beginning): ~85% accuracy
  Position 10 (middle):    ~55% accuracy  ← sharp drop
  Position 20 (end):       ~80% accuracy
```

**Why this happens:**

1. **Attention score distribution:** Transformers have a natural tendency to assign higher attention weights to tokens near the query position and to the beginning of the sequence (recency and primacy effects). Middle tokens compete with many others for attention.

2. **Training data bias:** Most documents in pre-training have the key information early (headlines, abstracts, introductions). The model has learned a prior that important content comes first or last.

3. **Positional encoding saturation:** At very long distances, positional embeddings may become less discriminative, making relative importance of middle tokens harder to judge.

**Practical mitigations:**
- Place the most important context at the **start or end** of the prompt, not the middle
- Use **re-ranking** in RAG to put the highest-relevance chunks at the extremes
- Reduce context size: retrieve fewer, more precise chunks rather than many mediocre ones
- Use models specifically trained for long-context (Gemini 1.5, Claude 3) — they show less degradation

### Attention Dilution

As context length grows, each token's attention is distributed across more tokens — the attention weight any single important token receives shrinks.

```
Attention weight ≈ softmax(QKᵀ / √d)

With 100 tokens:   each token gets ~0.01 average attention weight
With 10,000 tokens: each token gets ~0.0001 average attention weight
                        ↑ 100× more diluted
```

Even if the model attends to the right token with *relatively* high weight, the absolute value is so small that the gradient signal weakens and the model may fail to fully utilise that token's value.

**Why it interacts with the "lost in the middle" problem:**
Softmax normalises over the full sequence. As context grows, the denominator `Σ exp(score)` grows, further suppressing individual attention weights. A token in the middle must "compete louder" against an increasingly large crowd.

**Implications for system design:**
| Scenario | Impact | Mitigation |
|---------|--------|-----------|
| Long RAG context | Middle chunks ignored | Rerank; put best chunks first/last |
| Long conversation history | Early turns diluted | Summarise old turns; sliding window memory |
| System prompt + long user message | System prompt diluted | Repeat key instructions at the end |
| Multi-document QA | Cross-document signals diluted | Chunk-level retrieval; targeted extraction |

**Attention complexity:** O(n²) makes very long sequences expensive

**KV cache size:** Grows linearly with sequence length

**Solutions:**
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
| **Temperature = 0** | Greedy decoding; more deterministic, less creative |
| **Calibrated uncertainty** | Prompt: "If you don't know, say 'I don't know'" |
| **Self-consistency** | Multiple samples + majority vote filters noise |
| **Constrained generation** | Only allow outputs matching retrieved facts |
| **Citation generation** | Force model to cite source for each claim |
| **RLHF / DPO** | Train against confabulation via human feedback |

---

## 12. Embeddings & Vector Search

### Text Embeddings

Dense vector representations capturing semantic meaning. Similar texts have high cosine similarity.

| Model | Dim | Notes |
|-------|-----|-------|
| OpenAI text-embedding-3-small | 1536 | Best price/performance |
| OpenAI text-embedding-3-large | 3072 | Higher accuracy |
| BAAI/bge-m3 | 1024 | Open-source, multilingual, state-of-art |
| E5-large | 1024 | Good open-source for RAG |

### Approximate Nearest Neighbor (ANN) Algorithms

| Algorithm | How | Trade-off |
|-----------|-----|----------|
| **HNSW** | Hierarchical graph; greedily search navigable small world | Fast query, high memory |
| **IVF (Inverted File)** | Cluster vectors; search only nearby clusters | Lower memory; requires training |
| **IVF-PQ** | IVF + Product Quantization (compress vectors) | Very memory-efficient; some quality loss |
| **FAISS** | Facebook's library implementing many ANN methods | Industry standard |

**Recall vs Speed tradeoff:** More clusters / layers = higher recall but slower. Production systems typically target 95%+ recall at 10-50ms p99.

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
- LLaMA-1 (7B) was trained on 1T tokens — roughly compute-optimal
- GPT-4 is believed to be substantially "over-trained" (more tokens than Chinchilla-optimal) to improve inference economics — train longer once, serve a smaller model many times
- **Inference-optimal scaling:** When inference cost dominates (production), it's cheaper to train a smaller model on more data than to serve a larger model

### Emergent Abilities

Some capabilities appear suddenly at specific scale thresholds:

| Capability | Approximate threshold |
|-----------|----------------------|
| Few-shot learning | ~1B parameters |
| Chain-of-thought reasoning | ~10B parameters |
| Code generation | ~10B parameters |
| Complex reasoning (GSM8K) | ~100B parameters |

**Debate:** Recent work questions whether "emergence" is an artifact of discontinuous evaluation metrics rather than a true phase transition. With continuous metrics, performance scales smoothly.

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
| **GPT-4** (rumored) | ~1.8T | ~280B | 16 | 2 |
| **DeepSeek-V2** | 236B | ~21B | 160 | 6 |
| **Grok-1** | 314B | ~86B | 8 | 2 |

### MoE Trade-offs

| Advantage | Disadvantage |
|-----------|-------------|
| Much larger capacity per FLOP | Higher total memory (all experts must be loaded) |
| Better performance at same compute | All-to-all communication overhead in distributed training |
| Scales well beyond dense model limits | Load balancing is tricky; some experts may be underutilized |
| Same inference latency as smaller dense model | More complex to serve; expert parallelism needed |

### Router Collapse

The biggest training failure mode: all tokens route to the same 1-2 experts, leaving others unused. Prevented by:
- **Load balancing loss:** Penalize the variance in expert utilization
- **Expert capacity factor:** Cap how many tokens each expert can handle per batch
- **Random routing with noise:** Add noise to router logits during training

**Interview tip:** "MoE lets you scale model capacity without proportionally scaling compute. Mixtral 8×7B has GPT-3.5-level performance with 12.9B active parameters because it has 8 specialized experts and routes each token to the best 2. The main challenge is load balancing — you need an auxiliary loss to prevent router collapse."

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

**"Explain lost in the middle and attention dilution"**
→ Lost in the middle: accuracy on retrieval tasks drops sharply when relevant content is in the middle of a long context (~55% vs ~85% at extremes). Caused by attention primacy/recency bias and training data priors. Fix: put important context at start/end of prompt; re-rank RAG chunks to extremes. Attention dilution: as context length grows, softmax normalises over more tokens — each token's attention weight shrinks proportionally. Middle tokens must "compete louder" in an increasingly crowded sequence. Design implication: in RAG, fewer precise chunks beat many mediocre ones.

**"Explain the Transformer architecture"**
→ Token embeddings + positional encoding → N layers each: LayerNorm + Multi-Head Self-Attention (Q·Kᵀ/√d scaled softmax weighted sum of V) + residual, LayerNorm + FFN + residual → linear layer + softmax over vocab.

**"Why is RAG better than fine-tuning for factual Q&A?"**
→ Fine-tuning bakes knowledge into weights (can't update easily, may forget). RAG retrieves at inference time — updatable, inspectable, citable. Fine-tuning better for behavior/style changes; RAG better for knowledge-intensive tasks.

**"What is LoRA and why use it?"**
→ LoRA adds a trainable low-rank update (B·A) to frozen weight matrices, with A and B sized so B·A matches W. It updates only r×(d+k) instead of d×k parameters. This reduces trainable parameters by 1000×+ while matching full fine-tune quality for many tasks.

**"How does KV cache work?"**
→ During autoregressive generation, Q/K/V matrices of past tokens are recomputed on every new token. KV cache stores K and V for all past tokens, so each new step only computes for the new token. Critical for inference efficiency; trades memory for compute.

**"What's the difference between RLHF and DPO?"**
→ RLHF: train reward model from preferences → use PPO to optimize policy against reward model. DPO: directly optimize preference data as a classification loss, no reward model or RL needed. DPO is simpler, more stable, nearly equivalent quality.

**"How would you reduce hallucinations in production?"**
→ RAG to ground answers in retrieved context, temperature = 0 for factual tasks, system prompt with "say I don't know if uncertain," self-consistency sampling, output validation layer.

**"Greedy vs Beam Search vs Top-p — when do you use each?"**
→ Greedy: fastest, deterministic, good for factual/structured tasks. Beam search: better quality for constrained outputs (translation, summarization) but expensive and repetitive. Top-p (nucleus): best for open-ended generation — adapts nucleus size to model confidence, prevents both boring and incoherent outputs. In practice: top-p + temperature is the standard for chat; greedy/temperature=0 for code or factual Q&A.

**"What is continuous batching and why does it matter?"**
→ Static batching waits for all sequences in the batch to finish before starting new ones — the GPU idles waiting for long sequences. Continuous batching inserts new requests as soon as any slot frees up (every decode step), keeping GPU near 100% utilization. It's the single biggest throughput improvement for LLM serving and is standard in vLLM and TGI.

**"Explain the prefill vs decode distinction in LLM inference"**
→ Prefill processes the full prompt in a single parallel forward pass — compute-bound (bottlenecked by FLOPS). Decode generates one token at a time — memory-bound (bottlenecked by loading model weights from GPU HBM each step). This is why throughput and latency scale differently. Disaggregated serving routes them to separate GPU pools optimized for each workload.

**"What are scaling laws and how do they guide training decisions?"**
→ Performance improves as a power law with model size, data, and compute. Chinchilla (2022) showed most models were undertrained: optimal allocation uses ~20 tokens per parameter. A 7B model should see ~140B tokens. In production, "over-training" smaller models (more tokens than optimal) makes sense because you train once but serve millions of times — inference cost dominates.

**"How does Mixture of Experts (MoE) work?"**
→ Replace the dense FFN in each Transformer layer with N expert FFNs and a learned router. Each token is routed to the top-k experts (typically 2 of 8). Total parameters are N× larger, but active parameters per token stay the same. Mixtral 8×7B has 46.7B total but only activates 12.9B per token. Main challenge: router collapse — need load balancing loss to ensure all experts are utilized.

**"How does tokenization affect LLM behavior?"**
→ BPE splits text into subword tokens based on frequency in the training corpus. This means: (1) arithmetic is hard because numbers like "42137" split into ["42","137"], (2) non-English text uses 3-5× more tokens reducing effective context, (3) the tokenizer must match the model — using the wrong one produces garbage. Token count ≈ 1.3× word count for English.

**"How do multi-modal models like GPT-4V process images?"**
→ Images are split into patches (like ViT), projected into the same embedding space as text tokens via a learned projection layer, then fed into the LLM alongside text tokens. The LLM treats visual tokens like text. Main challenges: images are expensive (~1000+ tokens each), visual hallucination is more severe than text, and modality alignment requires careful pre-training.
