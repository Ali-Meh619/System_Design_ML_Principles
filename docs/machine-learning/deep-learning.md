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

Designed for spatial or grid-like data (images, spectrogram-like matrices, 1D signals) by exploiting **translation invariance** and **locality**.

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

## 12. Generative Models

Generative models learn the underlying data distribution P(x) and can generate new samples. They are among the most commonly asked deep learning interview topics.

### Autoencoders

Compress data into a low-dimensional latent space, then reconstruct. The bottleneck forces the network to learn a compressed representation.

```
Input x → [Encoder] → Latent z (bottleneck) → [Decoder] → Reconstructed x̂
Loss = ||x - x̂||²  (reconstruction error)
```

| Variant | Key difference | Use case |
|---------|---------------|----------|
| **Vanilla AE** | Deterministic bottleneck | Dimensionality reduction, denoising |
| **Denoising AE** | Add noise to input, reconstruct clean version | Robust feature learning |
| **Sparse AE** | L1 penalty on latent activations | Feature discovery with sparsity |
| **Variational AE (VAE)** | Latent space is a probability distribution | Generation, interpolation |

### Variational Autoencoders (VAEs)

Instead of encoding to a fixed point, encode to a **distribution** (mean μ and variance σ²). Sample from this distribution to decode.

```
Input x → Encoder → (μ, σ²) → z = μ + σ·ε (reparameterization trick) → Decoder → x̂

Loss = Reconstruction Loss + KL Divergence
     = ||x - x̂||² + KL(q(z|x) || p(z))
```

**Reparameterization trick:** To backpropagate through sampling, express z = μ + σ·ε where ε ~ N(0,1). Gradients flow through μ and σ, not through the sampling operation.

**KL Divergence term:** Regularizes the latent space to be close to N(0,1), ensuring smooth interpolation between data points.

### Generative Adversarial Networks (GANs)

Two networks in a minimax game:
- **Generator G:** Takes random noise z → generates fake data G(z)
- **Discriminator D:** Classifies inputs as real or fake

```
Random noise z → [Generator G] → Fake image G(z) ─┐
Real image x ──────────────────────────────────────┤→ [Discriminator D] → Real/Fake
                                                   │
min_G max_D  E[log D(x)] + E[log(1 - D(G(z)))]
```

**Training dynamics:**
1. Train D to distinguish real from fake (maximize correct classification)
2. Train G to fool D (minimize D's ability to tell fake from real)
3. At equilibrium, G produces data indistinguishable from real

**Common GAN problems:**

| Problem | What happens | Fix |
|---------|-------------|-----|
| **Mode collapse** | Generator produces limited variety of outputs | Wasserstein loss, minibatch discrimination |
| **Training instability** | Loss oscillates, never converges | Spectral normalization, progressive growing |
| **Vanishing gradients for G** | D becomes too good, G gradient → 0 | Wasserstein GAN (WGAN), gradient penalty |

**Key GAN variants:**
- **DCGAN:** Convolutional architecture, first stable GAN for images
- **WGAN:** Uses Wasserstein distance, much more stable training
- **StyleGAN:** State-of-art face generation, style-based generator
- **Conditional GAN (cGAN):** Condition generation on a label or image (pix2pix)

### Diffusion Models (DDPM)

The current state-of-the-art for image generation (DALL-E, Stable Diffusion, Midjourney).

```
Forward process (fixed):   x₀ → x₁ → x₂ → ... → xₜ  (gradually add Gaussian noise)
Reverse process (learned): xₜ → xₜ₋₁ → ... → x₀    (learn to denoise step by step)
```

**Key intuition:** Training is simple — add noise to data, train a neural network (U-Net) to predict and remove the noise. At generation time, start from pure noise and iteratively denoise.

**Why diffusion beats GANs:**
- No adversarial training instability
- No mode collapse — learns the full distribution
- Better sample quality and diversity
- Easier to train (simple MSE loss on noise prediction)

**Trade-off:** Diffusion is slow at inference (many denoising steps). Solutions: DDIM (fewer steps), latent diffusion (work in compressed space), distillation.

### Comparison of Generative Models

| | VAE | GAN | Diffusion |
|-|-----|-----|-----------|
| Training | Stable | Unstable | Stable |
| Sample quality | Blurry | Sharp | Best |
| Diversity | Good | Mode collapse risk | Best |
| Speed | Fast | Fast | Slow |
| Latent space | Smooth, interpretable | No clear latent space | No clear latent space |
| Use case | Representation learning, interpolation | Image synthesis, style transfer | Image/video generation, art |

---

## 13. Knowledge Distillation

Transfer knowledge from a large "teacher" model to a smaller "student" model. The student learns to match the teacher's output distribution (soft labels), not just the hard labels.

```
Input x → Teacher (large, frozen) → soft predictions (logits / T)
       → Student (small, trainable) → soft predictions (logits / T)

Loss = α · KL(teacher_soft, student_soft) + (1-α) · CE(hard_labels, student_hard)
```

**Why soft labels help:** A teacher predicting [cat: 0.7, dog: 0.2, bird: 0.1] conveys richer information than the hard label "cat" — it tells the student that this image somewhat resembles a dog. This "dark knowledge" helps the student generalize better.

**Temperature T:** Higher T softens probability distribution, making the dark knowledge more visible. Typical T = 3-20 during distillation; T = 1 at inference.

### Distillation Use Cases

| Scenario | Teacher → Student | Why |
|---------|------------------|-----|
| **Model compression** | BERT-large → DistilBERT | 60% size, 97% performance, 2× faster |
| **LLM distillation** | GPT-4 → small fine-tuned model | Cost reduction for specific tasks |
| **Ensemble → single model** | 5 models → 1 model | Production simplicity |
| **Self-distillation** | Model → same architecture | Born-Again Networks; improves over original |

**Interview tip:** Distillation is how most production LLM applications work — you don't run GPT-4 for every request. You distill its behavior for your specific task into a smaller, cheaper model.

---

## 14. Compression And Efficient Adaptation

Large neural networks are often too expensive to serve directly. Compression changes the deployment shape, so validate after every compression step.

| Technique | What it changes | Main risk |
|-----------|-----------------|-----------|
| **Quantization** | Stores weights/activations in lower precision such as INT8 or INT4 | Average benchmarks may hide failures in rare skills, schema following, or calibration. |
| **Pruning** | Removes weights, channels, heads, layers, or blocks | Unstructured sparsity may not speed up without hardware support; structured pruning can damage quality. |
| **Layer dropping / depth reduction** | Removes entire transformer blocks based on importance | Fast but can remove capabilities unevenly. |
| **Knowledge distillation** | Trains a smaller student to match a larger teacher | Student may inherit teacher mistakes and lose edge-case behavior. |
| **PEFT recovery** | Tunes adapters after compression | Can recover targeted behavior but may overfit if validation slices are weak. |

### Quantization Methods

| Method | Mechanism | When to use |
|--------|-----------|-------------|
| **PTQ** | Quantize after training using calibration data | Fastest path for inference compression. |
| **GPTQ** | Layer-wise weight quantization minimizing reconstruction error | Common for LLM weight-only quantization. |
| **AWQ** | Protects weights with high activation importance | Strong practical default for 4-bit serving. |
| **SmoothQuant** | Moves activation outliers into weights before quantization | Useful when activation quantization is the bottleneck. |
| **QAT** | Simulates quantization during training | More expensive, useful when PTQ quality loss is unacceptable. |

### Pruning Taxonomy

| Type | Removes | Production note |
|------|---------|-----------------|
| **Unstructured pruning** | Individual weights | Smaller checkpoints, but speedup needs sparse kernels. |
| **Structured pruning** | Channels, heads, neurons, or blocks | More likely to speed up on standard hardware. |
| **Movement pruning** | Weights moving toward zero during fine-tuning | Good for task-specific compression. |
| **SparseGPT / Wanda-style pruning** | One-shot pruning using weight/activation statistics | Useful when retraining budget is limited. |
| **Layer dropping** | Full layers selected by importance | Simple speedup, but must test reasoning and long-context regressions. |

### Compression Stack Ordering

A common safe order:

1. start from a validated base or fine-tuned model
2. prune or drop layers only if needed for latency/cost
3. quantize with representative calibration data
4. run adapter recovery or short fine-tuning if quality drops
5. validate on general benchmarks, task benchmarks, and hard production slices
6. compare latency, memory, cost, calibration, and failure modes before release

**Key interview point:** Compression is not done when perplexity looks fine. Validate structured output, rare classes, calibration, safety, and slice-level regressions.

---

## 15. Data Augmentation

Artificially expand training data by applying label-preserving transformations. Often more impactful than model improvements.

### Vision Augmentation

| Technique | Transform | Effect |
|-----------|----------|--------|
| **Random crop + resize** | Crop random region, resize to original | Translation invariance; most impactful single augmentation |
| **Horizontal flip** | Mirror image | Doubles data; don't use for asymmetric tasks (text OCR) |
| **Color jitter** | Random brightness, contrast, saturation, hue | Robustness to lighting conditions |
| **Random erasing / Cutout** | Black out random patches | Forces model to use all features, not just dominant ones |
| **Mixup** | Blend two images and their labels: `x̃ = λx₁ + (1-λ)x₂` | Smoother decision boundaries; reduces overfitting |
| **CutMix** | Paste a patch from one image onto another; blend labels | Combines benefits of Cutout and Mixup |
| **RandAugment** | Random sequence of N augmentations from a pool | AutoML-style; single hyperparameter M (magnitude) |
| **AutoAugment** | RL-searched augmentation policies | Best quality; expensive to find |

### Text Augmentation

| Technique | How | Use case |
|-----------|-----|---------|
| **Synonym replacement** | Replace words with synonyms | Simple; low risk |
| **Back-translation** | Translate to French → back to English | Paraphrasing; maintains meaning |
| **Random insertion / deletion** | Add or remove random words | Robustness |
| **EDA (Easy Data Augmentation)** | Combine above techniques | Small datasets |
| **LLM-based augmentation** | Use GPT to generate paraphrases | Highest quality; expensive |

**Key principle:** Augmentations must be label-preserving. Flipping a chest X-ray horizontally would swap left/right lungs — a medical error.

---

## 16. Self-Supervised Learning

Learn representations from unlabeled data by creating pretext tasks. The model learns features that transfer well to downstream tasks, eliminating the need for expensive labels.

### Contrastive Learning (SimCLR, MoCo)

```
Image → Augmentation 1 → Encoder → z₁ ─┐
     → Augmentation 2 → Encoder → z₂ ─┤→ Pull z₁, z₂ together (positive pair)
                                        └→ Push z₁, z_other apart (negative pairs)
```

**SimCLR loss (NT-Xent):** Maximize agreement between different views of the same image, minimize agreement with other images in the batch.

**Key insight:** Large batch sizes are critical (SimCLR uses 4096+) because you need many negative pairs. MoCo avoids this by maintaining a momentum-updated queue of negatives.

### Non-Contrastive Methods (BYOL, SimSiam)

Learn without explicit negative pairs. BYOL uses a momentum-updated target network:
```
Online: Image → augment → encoder → predictor → output
Target: Image → augment → momentum_encoder → target
Loss = ||output - target||²    (target is stop-gradient)
```

**Why it doesn't collapse:** The asymmetry between online (with predictor) and target (momentum-updated) networks prevents the trivial solution of mapping everything to the same vector.

### Masked Image Modeling (MAE)

Inspired by BERT's masked language modeling, but for images:
```
Image → mask 75% of patches → Encoder (on visible patches) → Decoder → reconstruct masked patches
```

Extremely data-efficient; works with standard ViT architecture.

### Where Self-Supervised Learning Is Used

- **Pre-training vision models** when labeled data is scarce (medical imaging, satellite)
- **Pre-training language models** (BERT, GPT — these ARE self-supervised)
- **Embedding learning** for retrieval and similarity search
- **Foundation models** that transfer to many downstream tasks

---

## 17. Training at Scale

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

### Training Stability Checklist

| Symptom | Likely issue | Fix |
|---------|--------------|-----|
| NaNs early in training | FP16 overflow, LR too high, bad initialization | Use BF16 if available, lower LR, add warmup, clip gradients. |
| Loss flatlines | Underflow, frozen wrong modules, bad labels | Check gradient norms, verify trainable parameters, overfit a small batch. |
| QLoRA unstable | Quantized base plus adapter updates too aggressive | Lower adapter LR, use BF16 adapters, tune rank/alpha, inspect calibration data. |
| QAT quality drop | Quantization simulation not representative | Use representative batches and compare per-slice metrics. |
| Long-sequence OOM | Activation memory dominates | Gradient checkpointing, sequence packing, shorter context, or context parallelism. |
| Distributed divergence | Sync, seed, or mixed-precision mismatch | Compare single-GPU run, check all-reduce, deterministic seeds, and loss scaling. |

### Data Parallelism vs Model Parallelism

| | Data Parallelism | Model Parallelism |
|-|-----------------|-------------------|
| What | Each GPU gets a full model; data is split | Model is split across GPUs |
| When | Model fits in single GPU | Model too large for one GPU (LLMs) |
| Sync | Gradient averaging (AllReduce) | Pipeline or tensor parallelism |

### Distributed Training Strategies

| Strategy | What is sharded/replicated | Communication cost | Use when |
|----------|----------------------------|--------------------|----------|
| **Data parallelism** | Full model replicated; data split | Gradient all-reduce after backward pass | Model fits on each GPU. |
| **FSDP / ZeRO** | Parameters, gradients, and optimizer states sharded | All-gather/reduce-scatter around layers | Optimizer state or model no longer fits per GPU. |
| **Tensor parallelism** | Individual matrix multiplications split across GPUs | Communication inside many layers | Dense layers are too large for one device. |
| **Pipeline parallelism** | Layers split into stages | Activation passing between stages; bubble overhead | Model is too deep or too large for one device. |
| **Gradient checkpointing** | Activations recomputed instead of stored | Extra compute during backward pass | Activation memory is the bottleneck. |
| **Sequence/context parallelism** | Long sequence dimension split | Attention communication across sequence shards | Long-context training exceeds memory. |

Micro-batching reduces pipeline bubbles, but too many parallelism modes at once can make debugging and performance tuning much harder.

### Gradient Accumulation

When the desired batch size doesn't fit in GPU memory, accumulate gradients over multiple mini-batches before updating weights:

```
Effective batch size = mini_batch_size × accumulation_steps

Step 1: Forward + backward (mini-batch 1) → accumulate gradients
Step 2: Forward + backward (mini-batch 2) → accumulate gradients
Step 3: Forward + backward (mini-batch 3) → accumulate gradients
Step 4: optimizer.step() → update weights with averaged gradients
         optimizer.zero_grad() → reset
```

This achieves the same gradient as a large batch without the memory cost. Trade-off: slower training (more forward/backward passes per update), but mathematically equivalent to large-batch training.

### Grouped Query Attention (GQA) & Multi-Query Attention (MQA)

Standard multi-head attention uses separate K, V projections per head. This creates a massive KV cache during inference.

| Method | K/V heads | KV cache size | Quality | Used by |
|--------|-----------|--------------|---------|---------|
| **Multi-Head (MHA)** | h heads each | 100% (baseline) | Best | GPT-3, BERT |
| **Multi-Query (MQA)** | 1 shared K/V | 1/h of baseline | Slight drop | PaLM, Falcon |
| **Grouped Query (GQA)** | g groups share K/V | g/h of baseline | Near MHA | LLaMA-2 70B, Mistral |

```
MHA:  Q₁→K₁V₁, Q₂→K₂V₂, Q₃→K₃V₃, Q₄→K₄V₄   (4 separate KV)
GQA:  Q₁→K₁V₁, Q₂→K₁V₁, Q₃→K₂V₂, Q₄→K₂V₂   (2 shared groups)
MQA:  Q₁→K₁V₁, Q₂→K₁V₁, Q₃→K₁V₁, Q₄→K₁V₁   (1 shared KV)
```

**Why GQA is the current standard:** MQA saves the most memory but hurts quality. GQA with g = h/4 or h/8 preserves nearly all quality while cutting KV cache by 4-8×. Critical for serving large models efficiently.

---

## 18. Common Failure Modes & Debugging

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

## 19. Transformers In Depth

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

**"Explain GANs and their training challenges"**
→ Two networks in a minimax game: Generator creates fake data, Discriminator classifies real vs fake. Main challenges: mode collapse (generator produces limited variety), training instability (loss oscillates), vanishing gradients for the generator when the discriminator is too good. Fixes: Wasserstein loss (WGAN), spectral normalization, progressive growing. Diffusion models have largely replaced GANs for image generation due to more stable training and better diversity.

**"What is knowledge distillation?"**
→ Train a small student model to match a large teacher model's soft predictions (logits / temperature). Soft labels carry "dark knowledge" — a cat image that somewhat resembles a dog teaches more than the hard label "cat" alone. Temperature T > 1 softens the distribution to expose this knowledge. Used to create DistilBERT (60% of BERT's size, 97% performance), and to distill GPT-4 behavior into smaller task-specific models.

**"What is GQA and why is it important?"**
→ Grouped Query Attention shares K/V projections across groups of query heads instead of having unique K/V per head. LLaMA-2 70B uses 8 KV groups for 64 query heads, reducing KV cache by 8×. It's the sweet spot between Multi-Head Attention (best quality, huge KV cache) and Multi-Query Attention (smallest KV cache, quality drop). Critical for efficient LLM serving.

**"How does self-supervised learning work?"**
→ Learn representations from unlabeled data via pretext tasks. Contrastive methods (SimCLR): pull augmented views of the same image together, push different images apart. Masked methods (MAE): mask 75% of image patches, train to reconstruct. Language models (BERT, GPT) are inherently self-supervised — predicting masked/next tokens. Self-supervised pre-training enables foundation models that transfer to many downstream tasks with minimal labeled data.
