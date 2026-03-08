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

## 2. Pre-training Objectives

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

---

## 3. Fine-Tuning Strategies

### Full Fine-Tuning

Update all model parameters on task-specific labeled data.

- Pro: Best performance if enough data
- Con: Expensive; requires storing full model per task; can catastrophic-forget

**Catastrophic forgetting:** Model forgets pre-trained knowledge when fine-tuned. Mitigations: replay buffer, EWC (Elastic Weight Consolidation), small LR.

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
W_new = W + ΔW = W + B·A
where A ∈ R^(d×r), B ∈ R^(r×k), rank r ≪ min(d,k)
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

---

## 4. Retrieval-Augmented Generation (RAG)

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

---

## 5. Prompt Engineering

### Core Techniques

| Technique | Description | When to use |
|-----------|-------------|-------------|
| **Zero-shot** | Direct instruction, no examples | Strong models (GPT-4), simple tasks |
| **Few-shot** | N examples of (input, output) in prompt | Small models, structured outputs |
| **Chain-of-Thought (CoT)** | "Let's think step by step" | Reasoning tasks, math, logic |
| **Self-consistency** | Sample k CoT paths; majority vote | When accuracy > latency |
| **ReAct** | Interleave Reasoning + Acting (tool calls) | Agents, multi-step tasks |
| **System prompt** | Set persona, constraints, output format | All production use cases |

### Chain-of-Thought Intuition

CoT works because it forces the model to allocate more compute (more tokens) to reasoning before producing the answer. It essentially turns a single forward pass into a search-and-verify process.

```
Bad:  "What is 123 × 456?"  → "56088" (may hallucinate)
Good: "What is 123 × 456? Think step by step."
      → "123 × 400 = 49200, 123 × 56 = 6888, total = 56088" ✓
```

### Structured Output / JSON Mode

Force the model to respond in a specific schema:

```
System: "Respond ONLY with valid JSON: {name: string, sentiment: 'positive'|'negative'}"
```

Production approaches: Outlines, Guidance, Instructor library, OpenAI structured outputs API.

---

## 6. Alignment: RLHF and DPO

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

## 7. LLM Evaluation

### Automatic Metrics

| Metric | How | Limitation |
|--------|-----|-----------|
| **Perplexity** | `exp(-1/N · Σ log P(xₜ))` | Lower = better language model; doesn't measure task performance |
| **BLEU** | N-gram overlap with reference | Doesn't handle paraphrase; ignores meaning |
| **ROUGE** | Recall-oriented n-gram overlap | Common for summarization; same issues |
| **BERTScore** | Contextual embedding similarity | Better semantic match; slower |
| **Exact Match (EM)** | Does output exactly match reference? | Too strict; useful for structured outputs |
| **F1 (token-level)** | Token overlap between prediction and ground truth | QA benchmarks (SQuAD) |

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

---

## 8. Inference Optimization

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

### Continuous Batching

Unlike static batching (wait for all requests to finish before taking new ones), continuous batching inserts new requests into the batch as soon as slots are freed. Standard in vLLM, TGI.

---

## 9. Context Window & Long-Context

| Model | Context Window |
|-------|--------------|
| GPT-3.5 | 16K tokens |
| GPT-4o | 128K tokens |
| Claude 3.5 | 200K tokens |
| Gemini 1.5 Pro | 1M tokens |

**Challenges with long context:**
- **Lost in the middle:** Models attend to beginning and end of context best; middle is often ignored
- **Attention complexity:** O(n²) makes very long sequences expensive
- **KV cache size:** Grows linearly with sequence length

**Solutions:**
- **FlashAttention:** Tiled computation that avoids materializing the full attention matrix; 2-4× speedup, same output
- **RoPE scaling (YaRN, LongRoPE):** Extend to longer contexts without full retraining
- **Sliding window attention:** Each token only attends to W neighbors; O(n·W) complexity (Mistral)

---

## 10. Hallucination & Grounding

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

## 11. Embeddings & Vector Search

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

## Interview Quick-Reference

**"Explain the Transformer architecture"**
→ Token embeddings + positional encoding → N layers each: LayerNorm + Multi-Head Self-Attention (Q·Kᵀ/√d scaled softmax weighted sum of V) + residual, LayerNorm + FFN + residual → linear layer + softmax over vocab.

**"Why is RAG better than fine-tuning for factual Q&A?"**
→ Fine-tuning bakes knowledge into weights (can't update easily, may forget). RAG retrieves at inference time — updatable, inspectable, citable. Fine-tuning better for behavior/style changes; RAG better for knowledge-intensive tasks.

**"What is LoRA and why use it?"**
→ LoRA adds trainable low-rank decomposition (B·A) to frozen weight matrices. Updates only r×(d+k) instead of d×k parameters. Reduces trainable parameters by 1000×+ while matching full fine-tune quality for most tasks.

**"How does KV cache work?"**
→ During autoregressive generation, Q/K/V matrices of past tokens are recomputed on every new token. KV cache stores K and V for all past tokens, so each new step only computes for the new token. Critical for inference efficiency; trades memory for compute.

**"What's the difference between RLHF and DPO?"**
→ RLHF: train reward model from preferences → use PPO to optimize policy against reward model. DPO: directly optimize preference data as a classification loss, no reward model or RL needed. DPO is simpler, more stable, nearly equivalent quality.

**"How would you reduce hallucinations in production?"**
→ RAG to ground answers in retrieved context, temperature = 0 for factual tasks, system prompt with "say I don't know if uncertain," self-consistency sampling, output validation layer.
