# Deep Learning

> Neural networks, optimization, CNNs, RNNs, attention, and training at scale. These are the topics that come up when a company wants to know you actually understand what's happening under the hood — not just `model.fit()`.

---

## 1. Neural Network Fundamentals

A neural network is a composition of linear transformations interleaved with non-linear activation functions.

```
Input x → [Linear: Wx + b] → [Activation σ] → [Linear: W'h + b'] → [Activation σ'] → Output
```

**Why non-linearities?** Without them, stacking linear layers collapses to a single linear transformation. Non-linearities allow the network to approximate any function.

### Activation Functions

| Function | Formula | Pros | Cons | Use case |
|----------|---------|------|------|----------|
| **Sigmoid** | `1/(1+e^-x)` | Output [0,1]; probabilities | Vanishing gradient for large \|x\|; saturates | Output layer (binary classification) |
| **Tanh** | `(e^x - e^-x)/(e^x + e^-x)` | Zero-centered; [-1,1] | Still vanishes for large \|x\| | RNNs hidden state |
| **ReLU** | `max(0, x)` | No vanishing gradient; fast | Dying ReLU: dead neurons if always negative | Default for hidden layers |
| **Leaky ReLU** | `max(αx, x), α≈0.01` | Fixes dying ReLU | Extra hyperparameter | When ReLU neurons die |
| **GELU** | `x·Φ(x)` | Smooth, stochastic; better than ReLU empirically | Slower to compute | Transformers, BERT, GPT |
| **Softmax** | `e^xᵢ / Σe^xⱼ` | Outputs sum to 1; probabilities | Can saturate; numerically unstable (use log-softmax) | Output layer (multiclass) |

**Dying ReLU problem:** If a neuron's pre-activation is always negative, gradient is 0, weights never update. Fix: Leaky ReLU, ELU, careful weight init.

---

## 2. Weight Initialization

Poor initialization causes vanishing/exploding gradients before training even starts. The goal: keep the variance of activations and gradients roughly constant across layers.

### Why It Matters

If all weights start at zero: every neuron computes the same output, every gradient is the same, the network never breaks symmetry — it stays stuck. You must initialize with random values, but the *scale* matters enormously.

**Too large:** Activations explode → saturated neurons → vanishing gradients (for sigmoid/tanh)
**Too small:** Activations shrink to zero → gradients vanish immediately

### Initialization Schemes

| Method | Formula | Designed for | Key property |
|--------|---------|-------------|-------------|
| **Random Normal** | `N(0, 0.01)` | — (naïve) | Often too small for deep nets |
| **Xavier / Glorot** | `Uniform(-√(6/(nᵢₙ+nₒᵤₜ)), √(...))` | Sigmoid / Tanh | Keeps variance equal in/out |
| **He (Kaiming)** | `N(0, √(2/nᵢₙ))` | **ReLU** | Corrects for ReLU killing half its inputs |
| **Orthogonal** | Initialize weight matrix as random orthogonal matrix | Deep RNNs | Preserves gradient magnitude exactly |
| **Pretrained weights** | Copy from a pretrained model | Transfer learning | Best starting point when available |

**Xavier derivation intuition:** For a linear layer `y = Wx`, if each `wᵢⱼ ~ N(0, σ²)`, then `Var(y) = nᵢₙ · σ² · Var(x)`. To keep `Var(y) = Var(x)`, we need `σ² = 1/nᵢₙ`. Xavier averages fan-in and fan-out: `σ² = 2/(nᵢₙ + nₒᵤₜ)`.

**He initialization:** ReLU zeroes out half the values, reducing variance by 2×. He corrects by doubling: `σ² = 2/nᵢₙ`.

```python
# PyTorch defaults (already correct for common cases)
nn.Linear   →  Kaiming Uniform by default
nn.Conv2d   →  Kaiming Uniform by default
nn.Embedding → Normal(0, 1) by default

# Manual init
torch.nn.init.xavier_uniform_(layer.weight)   # for tanh/sigmoid
torch.nn.init.kaiming_normal_(layer.weight, mode='fan_in', nonlinearity='relu')
```

### Batch Normalization Reduces Init Sensitivity

BatchNorm normalizes activations at each layer, making the network much less sensitive to initialization. With BatchNorm, you can often get away with less careful initialization. But with LayerNorm (Transformers), initialization still matters.

---

## 3. Backpropagation

The algorithm that computes gradients by applying the **chain rule** backward through the computation graph.

```
Forward pass:   compute loss L
Backward pass:  ∂L/∂w = ∂L/∂z · ∂z/∂w    (chain rule)
```

**Key insight:** Each layer's gradient depends on the next layer's gradient multiplied by the local Jacobian. This is why deep networks suffer from:

- **Vanishing gradients:** Products of many small values → gradient ≈ 0 → early layers stop learning. Solved by: ReLU, skip connections (ResNet), layer normalization.
- **Exploding gradients:** Products of many large values → gradient → ∞ → training diverges. Solved by: gradient clipping, careful initialization.

**Gradient clipping:** `if ||g|| > threshold: g = g * threshold / ||g||`

---

## 4. Optimization Algorithms

### SGD vs Adaptive Methods

| Optimizer | Update rule | Key properties | When to use |
|----------|-------------|---------------|-------------|
| **SGD** | `w -= η·g` | Simple; can generalize better with momentum | Image models with tuned LR schedule |
| **SGD + Momentum** | `v = β·v - η·g; w += v` | Accelerates in consistent directions; dampens oscillations | Most CV tasks |
| **RMSprop** | `s = β·s + (1-β)·g²; w -= η·g/√(s+ε)` | Adaptive per-parameter LR; handles non-stationary | RNNs |
| **Adam** | Momentum + RMSprop; bias correction | Fast convergence; default choice | Transformers, NLP, general DL |
| **AdamW** | Adam + decoupled weight decay | Fixes L2 regularization in Adam | BERT, GPT, fine-tuning |

**Adam update rule:**
```
m = β₁·m + (1-β₁)·g          # 1st moment (momentum)
v = β₂·v + (1-β₂)·g²         # 2nd moment (variance)
m̂ = m/(1-β₁ᵗ)                # bias correction
v̂ = v/(1-β₂ᵗ)                # bias correction
w -= η · m̂/(√v̂ + ε)
```
Default: β₁=0.9, β₂=0.999, ε=1e-8

**Adam's L2 problem:** Adam scales gradient by `1/√v`, so weight decay `λw` gets divided by `√v` too — it's not true L2 regularization. **AdamW** applies weight decay separately: `w = w - η·(m̂/√v̂) - η·λ·w`.

---

## 5. Learning Rate Scheduling

Learning rate is often the most important hyperparameter. Start high (explore), end low (refine).

| Schedule | How it works | Use case |
|---------|-------------|----------|
| **Step Decay** | Multiply by γ every N epochs | Simple; requires manual tuning |
| **Cosine Annealing** | LR = η_min + 0.5(η_max - η_min)(1 + cos(πt/T)) | Standard in modern DL; smooth decline |
| **Warmup + Cosine** | Linear warmup for K steps, then cosine decay | Transformers — avoids unstable early training |
| **Cyclic LR** | Oscillate between LR bounds | Escapes local minima; good with SGD |
| **One Cycle** | Quick rise then slow decline | Fast training; Leslie Smith's approach |

**Warmup intuition:** At the start, weights are random so gradients are noisy. A high LR would diverge. Warmup slowly increases LR until weights are stable enough to handle it.

---

## 6. Regularization in Neural Networks

### Dropout

Randomly zero out neuron activations with probability p during training.

```python
# Training
mask = (random(shape) > p)
h = h * mask / (1 - p)   # scale to maintain expected value

# Inference
h = h   # no dropout; expected output already correct
```

- Creates implicit ensemble of 2^n subnetworks
- p = 0.5 for hidden layers, 0.1-0.2 for inputs
- Not effective for convolutional layers (use DropBlock instead)

### Batch Normalization

Normalize each mini-batch to have zero mean and unit variance, then apply learnable scale (γ) and shift (β).

```
BN(x) = γ · (x - μ_batch) / √(σ²_batch + ε) + β
```

**Why it helps:**
- Reduces internal covariate shift (layer inputs stabilized)
- Acts as regularizer (noise from batch statistics)
- Allows higher learning rates
- Reduces sensitivity to initialization

**BN vs Layer Norm:**

| | Batch Norm | Layer Norm |
|-|-----------|-----------|
| Normalize over | Batch dimension (per feature) | Feature dimension (per sample) |
| Good for | CNNs, large batches | Transformers, RNNs, small/variable batches |
| Inference | Uses running statistics | No dependency on other samples |

---

## 7. Convolutional Neural Networks (CNNs)

Designed for spatial data (images, audio spectrograms, 1D signals) by exploiting **translation invariance** and **locality**.

### Convolution Operation

```
Output[i,j] = Σ Σ Input[i+m, j+n] · Kernel[m,n]
```

- **Local connectivity:** Each neuron sees only a small receptive field
- **Weight sharing:** Same kernel applied everywhere → drastically fewer parameters
- **Strides:** Skip pixels to downsample (stride=2 halves spatial dims)
- **Padding:** `same` padding keeps spatial dimensions; `valid` shrinks

### Key Layers

| Layer | Purpose |
|-------|---------|
| **Conv2D** | Learn spatial features |
| **MaxPool** | Downsample, translation-invariant feature detection |
| **GlobalAvgPool** | Replace flattening; average entire feature map |
| **BatchNorm** | Normalize after convolution |
| **1×1 Conv** | Change channel depth without spatial operation; "bottleneck" |

### Receptive Field

The region of input a neuron "sees." Deeper layers have larger receptive fields due to stacked convolutions.

```
3×3 conv after 3×3 conv → 5×5 effective receptive field (2 layers)
Dilated conv with dilation=2 → expands receptive field without more parameters
```

### Classic Architectures (Know the Concepts)

| Model | Key innovation | Concept |
|-------|--------------|---------|
| **AlexNet** | ReLU, dropout, GPU training | First modern deep CNN |
| **VGG** | Very deep (16-19 layers) with small 3×3 filters | Deep but slow |
| **ResNet** | Skip connections (residual blocks) | Solved vanishing gradients; can train 100+ layers |
| **InceptionNet** | Parallel branches with different filter sizes | Multi-scale feature extraction |
| **EfficientNet** | Compound scaling (width × depth × resolution together) | State-of-art on ImageNet per parameter count |

**ResNet skip connections:**
```
y = F(x, W) + x    ← instead of y = F(x, W)
```
If F = 0, layer becomes identity. Gradient flows directly through shortcut → no vanishing.

---

## 8. Recurrent Neural Networks & LSTMs

### Vanilla RNN

Processes sequences by maintaining hidden state `h`:

```
hₜ = tanh(Wₕ · hₜ₋₁ + Wₓ · xₜ + b)
```

**Problem:** Vanishing gradient over long sequences. Gradients are multiplied by `Wₕ` at every step. If `|Wₕ| < 1`, gradient decays to zero; if `|Wₕ| > 1`, it explodes.

### Long Short-Term Memory (LSTM)

Adds a **cell state** (`c`) as a "highway" with gated writes and reads:

```
Forget gate:  f = σ(Wf·[h,x] + b)    ← what to erase from cell
Input gate:   i = σ(Wi·[h,x] + b)    ← what new info to add
Cell update:  c̃ = tanh(Wc·[h,x] + b)
Cell state:   cₜ = f·cₜ₋₁ + i·c̃     ← gated update; gradient highway
Output gate:  o = σ(Wo·[h,x] + b)
Hidden state: hₜ = o · tanh(cₜ)
```

**Why it works:** Cell state `c` only undergoes additive updates (not multiplicative), so gradients can flow back through time without vanishing.

**GRU:** Simplified LSTM with 2 gates instead of 3; fewer parameters; similar performance.

### When to still use RNNs/LSTMs in 2025

For most sequence tasks, Transformers win. But LSTMs are still used in:
- Real-time streaming (low latency, no full context needed)
- Very long sequences where attention is O(n²) is too expensive
- On-device / embedded ML

---

## 9. Attention Mechanism

The precursor to Transformers. Instead of forcing all information through a fixed-size hidden state, attention lets the decoder **look back at all encoder outputs**.

```
Attention(Q, K, V) = softmax(QKᵀ / √dₖ) · V
```

- **Query (Q):** What we're looking for (current decoder state)
- **Key (K):** What each encoder output offers
- **Value (V):** The actual information to retrieve

The dot product `QKᵀ` computes similarity scores. Softmax converts to attention weights. Weighted sum of V is the context vector.

**Why scale by √dₖ?** Large dot products push softmax into saturation (very small gradients). Scaling keeps the distribution well-behaved.

### Multi-Head Attention

Run h parallel attention heads with different learned projections, then concatenate:

```
MultiHead(Q,K,V) = Concat(head₁,...,headₕ) · Wₒ
where headᵢ = Attention(Q·Wᵢᵠ, K·Wᵢᵏ, V·Wᵢᵛ)
```

Allows the model to attend to information from different representation subspaces simultaneously.

---

## 10. Transfer Learning & Fine-Tuning

Train on a large dataset (ImageNet, Common Crawl), then adapt to a specific task.

### Strategies

| Strategy | When to use | How |
|---------|-------------|-----|
| **Feature extraction** | Small target dataset; features generalize well | Freeze all pretrained layers; only train classifier head |
| **Fine-tuning (partial)** | Medium dataset; lower layers too general | Freeze early layers; unfreeze later layers + head |
| **Full fine-tuning** | Large target dataset | Unfreeze everything; use small LR (e.g., 1e-5) |

**Learning rate tip:** Use a smaller LR for pretrained layers, larger for new head ("discriminative LR"). This avoids overwriting useful pretrained representations.

### ImageNet Pretrained CNN Strategy

```
Early layers → edges, textures (universal; keep frozen)
Middle layers → shapes, parts (sometimes fine-tune)
Late layers → task-specific features (fine-tune)
Head → replace entirely for new task
```

---

## 11. Loss Functions for Deep Learning

| Loss | Formula | Use case |
|------|---------|----------|
| **Binary CE** | `-y·log(p) - (1-y)·log(1-p)` | Binary classification |
| **Categorical CE** | `-Σ yᵢ·log(pᵢ)` | Multiclass classification |
| **Focal Loss** | `-α(1-p)^γ · log(p)` | Class imbalance (object detection) |
| **MSE** | `(y-ŷ)²` | Regression; sensitive to outliers |
| **Huber Loss** | MSE for small errors, MAE for large | Robust regression |
| **Contrastive Loss** | Pull same-class embeddings together, push different apart | Siamese networks |
| **Triplet Loss** | anchor-positive < anchor-negative by margin | Metric learning, face recognition |

**Focal Loss intuition:** γ > 0 down-weights easy examples (1-p)^γ → model focuses on hard examples. Used in RetinaNet for object detection with severe foreground/background imbalance.

---

## 12. Training at Scale

### Batch Size Effect

Larger batches → more stable gradients but:
- Often worse generalization (sharp minima in loss landscape)
- Higher LR needed to compensate (linear scaling rule: LR ∝ batch_size)
- Memory limitations on GPU

**Linear scaling rule (Goyal et al.):** When multiplying batch size by k, multiply LR by k. But this breaks for very large batches → use warmup.

### Mixed Precision Training (FP16/BF16)

Store weights in FP32 but compute forward/backward passes in FP16:

| | FP32 | FP16 | BF16 |
|-|------|------|------|
| Memory | 4 bytes | 2 bytes | 2 bytes |
| Dynamic range | Wide | Narrow (overflow risk) | Wide |
| Precision | High | Lower (underflow risk) | Lower |
| Use case | Master weights | Computation | Preferred in TPUs/Ampere GPUs |

**Gradient scaling:** Multiply loss by large factor before backward pass to prevent FP16 underflow; divide gradients back before optimizer step.

### Data Parallelism vs Model Parallelism

| | Data Parallelism | Model Parallelism |
|-|-----------------|-------------------|
| What | Each GPU gets a full model; data is split | Model is split across GPUs |
| When | Model fits in single GPU | Model too large for one GPU (LLMs) |
| Sync | Gradient averaging (AllReduce) | Pipeline or tensor parallelism |

---

## 13. Common Failure Modes & Debugging

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Loss doesn't decrease | LR too low, wrong loss, data bug | Overfit single batch first |
| Loss explodes | LR too high, gradient explode | Reduce LR, clip gradients, check input scale |
| Train loss low, val loss high | Overfitting | Dropout, regularization, more data |
| Both losses plateau early | LR too high; landed in flat region | LR warmup/decay, Adam |
| Validation loss oscillates | LR too high | Reduce LR, use scheduler |
| Dead neurons | ReLU dying | Leaky ReLU, check init, lower LR |
| Slow convergence | Vanishing gradient | BatchNorm, skip connections, better init |

**The overfit-single-batch test:** Before full training, overfit a single mini-batch. If train loss doesn't reach ~0, there's a bug in model/loss/data — fix this first.

---

## 14. Transformers In Depth

The Transformer is the most important architecture in modern deep learning. It powers every major LLM, vision model (ViT), and multimodal model. Unlike RNNs, it processes the entire sequence in parallel, making it highly GPU-efficient.

### Full Architecture Diagram

```
                    ┌─────────────────────────────────────────┐
                    │           TRANSFORMER BLOCK (×N)        │
                    │                                         │
Input tokens        │  ┌──────────┐                          │
   │                │  │ LayerNorm │ ← Pre-norm (modern)      │
   ▼                │  └────┬─────┘                          │
[Token Embedding]   │       ▼                                 │
   +                │  ┌──────────────────────┐              │
[Positional Enc]    │  │  Multi-Head           │              │
   │                │  │  Self-Attention       │              │
   └──────────────► │  └──────────┬───────────┘              │
                    │             │                           │
                    │       ┌─────┴─────┐                    │
                    │       │  Residual  │ x + Attn(x)        │
                    │       └─────┬─────┘                    │
                    │             ▼                           │
                    │       ┌──────────┐                      │
                    │       │LayerNorm │                      │
                    │       └────┬─────┘                      │
                    │            ▼                            │
                    │  ┌──────────────────────┐              │
                    │  │  Feed-Forward Network │              │
                    │  │  Linear → GELU → Linear│             │
                    │  └──────────┬───────────┘              │
                    │             │                           │
                    │       ┌─────┴─────┐                    │
                    │       │  Residual  │ x + FFN(x)         │
                    │       └─────┬─────┘                    │
                    └─────────────┼───────────────────────────┘
                                  │ (repeat N times)
                                  ▼
                            [LayerNorm]
                                  │
                            [Linear → Softmax]
                                  │
                           Output probabilities
```

### Scaled Dot-Product Attention — Step by Step

```
Given input X ∈ R^(seq_len × d_model):

1. Project: Q = X·Wᵠ,  K = X·Wᵏ,  V = X·Wᵛ
   (each W ∈ R^(d_model × d_head))

2. Compute scores: S = Q·Kᵀ / √d_head
   (S ∈ R^(seq_len × seq_len) — the attention matrix)

3. Mask (decoder only): set future positions to -∞

4. Normalize: A = softmax(S)
   (A ∈ R^(seq_len × seq_len) — attention weights, each row sums to 1)

5. Weighted sum: Output = A · V
   (Output ∈ R^(seq_len × d_head))
```

**Why divide by √d_head?**
Dot products grow with dimensionality: `E[q·k] ≈ d_head · σ²`. For d_head = 64, this is 8×. Large values push softmax into saturation → near-zero gradients. Dividing by `√d_head` brings values back to unit scale.

**Attention matrix intuition:**
- Row `i` represents "what does token i attend to?"
- Column `j` represents "how much do all tokens attend to token j?"
- `A[i,j]` = attention weight from token i to token j

### Multi-Head Attention — Why Multiple Heads?

```
MultiHead(Q,K,V) = Concat(head₁,...,headₕ) · Wₒ
headᵢ = Attention(Q·Wᵢᵠ, K·Wᵢᵏ, V·Wᵢᵛ)

Dimensions:
  d_model = 512,  h = 8 heads,  d_head = 64 each
  Total parameters per head: 3 × (d_model × d_head)
  Output projection Wₒ: (h·d_head) × d_model = d_model × d_model
```

Different heads learn to attend to different types of relationships simultaneously:
- Head 1: syntactic agreement (subject-verb)
- Head 2: coreference ("it" → "the cat")
- Head 3: positional adjacency
- Head 4: semantic similarity

### Causal Masking (Decoder)

In language modeling (GPT-style), token at position `t` must **not** see future positions. Achieved by masking the upper triangle of the attention matrix with `-∞` before softmax:

```
Attention mask for seq_len = 4:
     t₁  t₂  t₃  t₄
t₁ [  0  -∞  -∞  -∞ ]
t₂ [  0   0  -∞  -∞ ]
t₃ [  0   0   0  -∞ ]
t₄ [  0   0   0   0 ]

After softmax: upper triangle becomes 0 → no future leakage
```

### Positional Encoding in Detail

**Sinusoidal (original paper):**
```
PE(pos, 2i)   = sin(pos / 10000^(2i/d))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d))
```
The frequency decreases with dimension index — high dims encode coarse position, low dims encode fine position. Allows the model to compute relative positions via linear combinations: `PE(pos+k)` is a linear function of `PE(pos)`.

**RoPE (Rotary Position Embedding) — current standard:**
Instead of adding position to embeddings, rotate Q and K vectors by an angle proportional to position *before* computing the dot product:

```
Rₒₜ(qₘ) · Rₒₜ(kₙ)ᵀ only depends on (m-n) — the relative distance
```

Why RoPE is preferred:
- Attention scores naturally depend on relative positions, not absolute
- Enables context length extension (YaRN, dynamic NTK scaling)
- No additional parameters

### Feed-Forward Network (FFN)

```
FFN(x) = W₂ · GELU(W₁x + b₁) + b₂

Typical dimensions:
  d_model = 4096  (LLaMA-7B)
  d_ff    = 11008 = 4 × 4096 × (2/3)  (SwiGLU variant)
```

The FFN constitutes ~2/3 of total parameters. Research suggests it acts as a key-value memory store — different neurons fire for different input patterns.

**SwiGLU (modern variant, used in LLaMA):**
```
SwiGLU(x, W, V) = Swish(xW) ⊙ (xV)
```
Gating mechanism that selectively activates features. Outperforms standard GELU in practice.

### Pre-Norm vs Post-Norm

| | Post-Norm (original) | Pre-Norm (modern) |
|-|---------------------|------------------|
| **Where** | After residual: `LayerNorm(x + F(x))` | Before sublayer: `x + F(LayerNorm(x))` |
| **Training** | Harder to train (gradients through LN) | More stable; standard in modern LLMs |
| **Performance** | Slightly better when trained | Pre-norm usually fine with warmup |

Almost all modern LLMs (LLaMA, Mistral, GPT-NeoX) use **Pre-Norm** with RMSNorm (simpler than LayerNorm, no mean subtraction).

### Encoder vs Decoder vs Encoder-Decoder

| Architecture | Attention type | Pre-training | Best for |
|-------------|---------------|-------------|---------|
| **Encoder only** (BERT) | Bidirectional self-attention | Masked LM | Classification, NER, embeddings |
| **Decoder only** (GPT) | Causal (masked) self-attention | Causal LM | Text generation, chat |
| **Encoder-Decoder** (T5) | Bidirectional encoder + causal decoder + cross-attention | Seq2Seq denoising | Translation, summarization, QA |

**Cross-attention in encoder-decoder:** The decoder Q attends to the encoder K/V — each decoder position can look at the full input sequence:
```
Cross-Attention:  Q = decoder state,  K = V = encoder output
```

### Computational Complexity

| Component | Time | Space | Note |
|-----------|------|-------|------|
| Self-attention | O(n²·d) | O(n²) | Quadratic in sequence length! |
| FFN | O(n·d²) | O(d²) | Linear in sequence length |
| Embedding | O(n·d) | O(V·d) | V = vocabulary size |

**The quadratic bottleneck:** For n=32K tokens, n² = 10⁹ attention scores. Solutions:
- **FlashAttention:** Tiled GPU computation, avoids materializing full matrix → same output, O(n) memory
- **Sliding window attention (Mistral):** Each token attends to W neighbors only → O(n·W)
- **Linear attention:** Approximate kernelized attention → O(n)

### Vision Transformer (ViT)

Patch images into 16×16 tokens, project each patch to d_model, add positional encoding, feed into standard Transformer encoder:

```
224×224 image → 14×14 = 196 patches → 197 tokens (+ [CLS]) → Transformer encoder → classify
```

Key insight: with enough data, ViT matches or beats CNNs. CNNs have inductive bias (translation equivariance) baked in; ViTs learn it from data.

---

## Interview Quick-Reference

**"Explain vanishing gradients"**
→ In deep networks, gradients are products of many partial derivatives. If each < 1 (sigmoid/tanh saturated), the product → 0 and early layers don't learn. Fix: ReLU, skip connections, BatchNorm, gradient clipping.

**"Why does BatchNorm help training?"**
→ Stabilizes layer input distributions (internal covariate shift), acts as regularizer, allows higher LR, reduces sensitivity to initialization. Use LayerNorm for Transformers (variable batch/sequence lengths).

**"Adam vs SGD — when would you pick SGD?"**
→ Adam converges faster and is the default. But SGD with momentum + tuned LR schedule often achieves better final accuracy for large-scale vision tasks (CIFAR, ImageNet). Adam can over-adapt and find sharp minima.

**"How does ResNet solve the degradation problem?"**
→ Skip/residual connections let gradients flow directly to earlier layers without going through weight matrices. The network only needs to learn the *residual* F(x), which is easier than learning H(x) from scratch.

**"Difference between Dropout and BatchNorm?"**
→ Dropout adds noise to activations (regularization by masking). BatchNorm normalizes activations and adds learnable scale/shift (training stability + mild regularization). They're complementary; using both is common.

**"Why use He initialization over Xavier for ReLU?"**
→ Xavier assumes symmetric activations around zero. ReLU kills half the inputs (x < 0 → 0), halving the effective variance. He doubles the variance to compensate: σ² = 2/nᵢₙ. Using Xavier with ReLU leads to vanishing activations in deep networks.

**"Explain the Transformer's self-attention complexity"**
→ For a sequence of n tokens and model dimension d, self-attention is O(n²·d) time and O(n²) space — quadratic in sequence length. This is the core bottleneck for long contexts. FlashAttention uses tiled GPU SRAM computation to achieve O(n) memory while computing the same result. Sliding window attention limits each token to W neighbors: O(n·W).

**"Why does multi-head attention work better than single-head?"**
→ Single head of dimension d gives one "view" of token relationships. h heads of dimension d/h capture h different relationship types simultaneously (syntax, semantics, coreference, etc.) with the same total parameter count. The concatenation then mixes all these views via Wₒ.

**"Pre-Norm vs Post-Norm — what changed and why?"**
→ Original Transformer used Post-Norm (LayerNorm after residual), which is harder to train as gradients must flow through LayerNorm. Modern LLMs use Pre-Norm (LayerNorm before sublayer), which gives gradients a clean residual pathway and makes training more stable, especially at scale. Most use RMSNorm (no mean subtraction, faster) instead of full LayerNorm.
