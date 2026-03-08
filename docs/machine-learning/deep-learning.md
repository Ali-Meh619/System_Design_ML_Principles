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

## 2. Backpropagation

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

## 3. Optimization Algorithms

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

## 4. Learning Rate Scheduling

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

## 5. Regularization in Neural Networks

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

## 6. Convolutional Neural Networks (CNNs)

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

## 7. Recurrent Neural Networks & LSTMs

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

## 8. Attention Mechanism

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

## 9. Transfer Learning & Fine-Tuning

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

## 10. Loss Functions for Deep Learning

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

## 11. Training at Scale

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

## 12. Common Failure Modes & Debugging

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
