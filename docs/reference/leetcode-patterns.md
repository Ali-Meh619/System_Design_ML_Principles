# LeetCode Question Patterns

> **How to use this guide:** Start with Pattern 0 every single time. Match the problem's "shape" to a pattern. Then apply the template. Most LeetCode problems are one of ~17 patterns in disguise — recognizing the pattern is 80% of the solution.

---

## Pattern 0 — The Pattern Chooser *(use this first, every time)*

Read the prompt and match the "shape":

| Problem Shape | Pattern |
|---|---|
| Contiguous subarray/substring | **Sliding Window** or **Prefix Sum** |
| Sorted / need min/max boundary / "min feasible" | **Binary Search** (index or answer-space) |
| "Top K / Kth / merge K sorted / stream" | **Heap** |
| "All combinations / generate all / choose or not" | **Backtracking** |
| "Shortest path / fewest steps" | **BFS** (unweighted) / **Dijkstra** (weighted) |
| "Dependency / ordering / prerequisites" | **Topological Sort** |
| "Connected components / dynamic connectivity" | **DFS/BFS / Union-Find** |
| "Optimal value with repeated substructure" | **DP** (1D / 2D / interval / bitmask) |
| "Overlap intervals / meeting rooms" | **Sort + sweep / heap ends** |
| "Parentheses / next greater/smaller" | **Stack** (often monotonic) |
| Tree asks "subtree info / aggregate from leaves" | **Postorder DFS returning a tuple** |
| "Prefix search / autocomplete / word dictionary" | **Trie** |
| "Reach end / maximize reach / earliest finish" | **Greedy** |
| "Range sum / range min-max with updates" | **Segment Tree / BIT** |
| "Sliding window max/min" | **Monotonic Deque** |
| Bit operations / XOR / subsets of bits | **Bit Manipulation** |
| "Is palindrome / longest palindrome" | **Two Pointers** (expand or l/r shrink) |
| "Longest consecutive sequence" (unsorted) | **Hash Set** (Arrays & Hashing, not Sliding Window) |

> **Decision shortcuts:**
> - Two indices over the **same** array → Two Pointers or Sliding Window
> - Two **separate** lists/strings → DP or Merge
> - Graph with costs → Dijkstra; graph with 0/1 costs → 0-1 BFS; negative costs → Bellman-Ford
> - "All" / "every" / "generate" → Backtracking or DP
> - "Does pair/complement exist?" → Two-Sum hash map
> - "k numbers sum to target" → sort + fix outer + two-pointer inner
> - "Directed graph has cycle?" → DFS 3-color; "undirected?" → simple visited + skip parent

---

## 1 — Arrays & Hashing

**Recognize:** duplicates, counts, grouping, "exists", anagrams, prefix sums, "subarray sum = k", "longest subarray with property"

### Pattern A — Frequency / Index Map

```python
# Count occurrences
cnt = {}
for x in nums:
    cnt[x] = cnt.get(x, 0) + 1

# First-index map (earliest only — never overwrite)
pos = {}
for i, x in enumerate(nums):
    if x not in pos:
        pos[x] = i
```

> **Pitfall:** "Longest/first" problems usually need the **earliest** index only — don't overwrite it.

### Pattern B — Prefix Sum Map

**Count subarrays with sum = k:**

```python
def subarraySum(nums, k):
    count = 0
    prefix = 0
    seen = {0: 1}            # empty prefix has been seen once

    for n in nums:
        prefix += n

        if prefix - k in seen:       # explicit check: don't add 0 for missing keys
            count += seen[prefix - k]

        seen[prefix] = seen.get(prefix, 0) + 1

    return count
```

> **Why `if prefix - k in seen` instead of `count += seen.get(..., 0)`:** the explicit guard makes the intent readable — we only count when a valid complement exists. Both are correct; this form is easier to explain in an interview.

**Longest subarray with sum = k:** store the **earliest index** of each prefix sum (not the count).

```python
def longestSubarraySum(nums, k):
    first = {0: -1}
    pref = best = 0
    for i, x in enumerate(nums):
        pref += x
        if pref - k in first:
            best = max(best, i - first[pref - k])
        if pref not in first:
            first[pref] = i     # earliest only
    return best
```

### Pattern C — Sorting as an Enabler

- Convert "pair/triple existence" → sort then **two pointers**
- Convert "grouping by value" → sort then **sweep/merge**

### Pattern D — Two-Sum / Complement Lookup *(most common hash pattern)*

```python
def twoSum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
```

> Generalize: "does a pair / triple / complement exist?" → build the map as you scan, look up what you need.

### Pattern E — Dutch National Flag (3-way partition)

```python
def sortColors(nums):
    lo = mid = 0; hi = len(nums) - 1
    while mid <= hi:
        if   nums[mid] == 0: nums[lo], nums[mid] = nums[mid], nums[lo]; lo += 1; mid += 1
        elif nums[mid] == 1: mid += 1
        else:                nums[mid], nums[hi] = nums[hi], nums[mid]; hi -= 1
```

> Also called 3-pointer partition. Use whenever you need to partition an array into 3 groups in O(n) / O(1).

### Pattern F — Longest Consecutive Sequence *(hash set, O(n))*

**Recognize:** "longest consecutive sequence", "no sorting allowed", elements are integers.

> Common misconception: this looks like sliding window but the array is **unsorted** — sliding window needs a sorted/ordered structure. Use a set for O(1) membership instead.

```python
def longestConsecutive(nums):
    num_set = set(nums)
    best = 0
    for n in num_set:
        if n - 1 not in num_set:        # only start from the beginning of a sequence
            cur, length = n, 1
            while cur + 1 in num_set:
                cur += 1
                length += 1
            best = max(best, length)
    return best
```

> The `if n - 1 not in num_set` guard ensures each sequence is traversed exactly once → O(n) total even though there's a nested loop.

**Time/Space:** O(n) / O(n) — or O(n log n) if sorting is required

---

## 2 — Two Pointers

**Recognize:** sorted array, palindrome check, partitioning, remove duplicates in-place, merge two sorted sequences

### Pattern A — Left/Right Shrink

```python
l, r = 0, len(nums) - 1
while l < r:
    if condition_needs_smaller:
        r -= 1
    else:
        l += 1
```

### Pattern B — Slow/Fast (In-Place Write)

```python
write = 0
for read in range(len(nums)):
    if keep(nums[read]):
        nums[write] = nums[read]
        write += 1
return write   # write = new length
```

> **Pitfall:** Be explicit about what `write` means — it's the *next free slot*, so the final valid array is `nums[:write]`.

### Pattern C — Palindrome Check

**Recognize:** "valid palindrome", "is string/number a palindrome", "check if reversed equals original"

```python
# Basic palindrome (exact match)
def isPalindrome(s):
    l, r = 0, len(s) - 1
    while l < r:
        if s[l] != s[r]:
            return False
        l += 1; r -= 1
    return True

# Valid palindrome — skip non-alphanumeric, ignore case (LC 125)
def validPalindrome(s):
    l, r = 0, len(s) - 1
    while l < r:
        while l < r and not s[l].isalnum(): l += 1
        while l < r and not s[r].isalnum(): r -= 1
        if s[l].lower() != s[r].lower():
            return False
        l += 1; r -= 1
    return True
```

> The two-pointer palindrome check is O(n) / O(1). For "almost palindrome" (allow removing one char), try both `isPalindrome(s[l+1:r+1])` and `isPalindrome(s[l:r])` when a mismatch is found.

### Pattern D — 3Sum (sort + fix one + inner two pointers)

```python
def threeSum(nums):
    nums.sort(); res = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i-1]: continue   # skip outer duplicates
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if   s < 0: l += 1
            elif s > 0: r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l+1]: l += 1  # skip inner dups
                while l < r and nums[r] == nums[r-1]: r -= 1
                l += 1; r -= 1
    return res
```

> Generalizes to k-Sum: fix (k-2) outer pointers recursively, run two-pointer at the innermost level. Always sort first.

**Time/Space:** O(n) / O(1)

---

## 3 — Sliding Window *(the "contiguous" hammer)*

**Recognize:** substring/subarray, "longest", "minimum window", "at most K distinct", "replace K chars", "all subarrays of size K"

### Pattern A — Variable Window (shrink while invalid)

**Example — Longest Substring Without Repeating Characters (LC 3):**

```python
def lengthOfLongestSubstring(s):
    seen = {}       # char → last seen index
    l = best = 0
    for r, ch in enumerate(s):
        if ch in seen and seen[ch] >= l:
            l = seen[ch] + 1    # jump left past the duplicate
        seen[ch] = r
        best = max(best, r - l + 1)
    return best
```

> `seen[ch] >= l` is the guard — the previous occurrence must still be **inside** the current window to matter. Without it, a character seen before the window's left boundary would wrongly shrink the window.

**General template (count-based shrink, works for "at most K distinct" etc.):**

```python
def variable_window(s, is_invalid):
    cnt = {}
    l = best = 0
    for r, ch in enumerate(s):
        cnt[ch] = cnt.get(ch, 0) + 1
        while is_invalid(cnt):          # shrink left until valid
            cnt[s[l]] -= 1
            if cnt[s[l]] == 0:
                del cnt[s[l]]
            l += 1
        best = max(best, r - l + 1)
    return best
```

### Pattern B — Fixed Window Size

```python
def max_sum_fixed_k(nums, k):
    cur = sum(nums[:k])
    best = cur
    for i in range(k, len(nums)):
        cur += nums[i] - nums[i - k]
        best = max(best, cur)
    return best
```

### Pattern C — Exactly K Trick

When asked for "**exactly** K distinct / sum / occurrences":

```
exactly(K) = atMost(K) - atMost(K - 1)
```

Implement `atMost(k)` with the variable window template above, then subtract.

> **Pitfall:** Sliding window **fails** when the condition is non-monotonic (e.g., "min-length subarray with sum ≥ k" with **negatives** present). Use prefix sums + binary search or DP instead.

**Time/Space:** O(n) / O(k) where k = window constraint space

---

## 4 — Stack *(including Monotonic Stack)*

**Recognize:** parentheses, parsing, "next greater/smaller element", histogram areas, temperature spans, buildings with ocean view

### Pattern A — Monotonic Stack (each element pushed and popped once → O(n))

```python
def nextGreater(nums):
    ans = [-1] * len(nums)
    st = []       # stack of indices
    for i, x in enumerate(nums):
        while st and nums[st[-1]] < x:   # x is greater than top
            ans[st.pop()] = x
        st.append(i)
    return ans
```

> For "next **smaller**": flip the comparison to `nums[st[-1]] > x`.

### Pattern B — Parentheses / Balanced Brackets

```python
def isValid(s):
    st = []
    match = {')': '(', ']': '[', '}': '{'}
    for ch in s:
        if ch in match:
            if not st or st[-1] != match[ch]:
                return False
            st.pop()
        else:
            st.append(ch)
    return not st
```

### Pattern C — Largest Rectangle in Histogram

Push index; when stack top is "blocked" by shorter bar, pop and compute area `h * (i - st[-1] - 1)`. Append sentinel `-1` at the end.

> **Pitfall:** "Strictly greater" vs "greater or equal" changes whether duplicates pop correctly. Use `<` for "next strictly greater".

**Time/Space:** O(n) / O(n)

---

## 5 — Binary Search *(2 types)*

**Recognize:** sorted array **OR** answer is monotonic ("minimum feasible X", "maximize the minimum", "pack in M days", "minimum speed")

### Pattern A — Binary Search on Answer (first True)

```python
def first_true(lo, hi, ok):
    """Returns the smallest value in [lo, hi] where ok(value) is True."""
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

Usage: `first_true(1, max_val, lambda cap: can_ship_in_D_days(cap))`

### Pattern B — Search in Rotated / Special Arrays

Key idea: **one half is always sorted** → use that half to decide direction.

```python
def search_rotated(nums, target):
    l, r = 0, len(nums) - 1
    while l <= r:
        m = (l + r) // 2
        if nums[m] == target:
            return m
        if nums[l] <= nums[m]:          # left half is sorted
            if nums[l] <= target < nums[m]:
                r = m - 1
            else:
                l = m + 1
        else:                           # right half is sorted
            if nums[m] < target <= nums[r]:
                l = m + 1
            else:
                r = m - 1
    return -1
```

### Pattern C — Leftmost / Rightmost Occurrence (find search range)

```python
import bisect

def searchRange(nums, target):
    lo = bisect.bisect_left(nums, target)
    hi = bisect.bisect_right(nums, target) - 1
    if lo >= len(nums) or nums[lo] != target:
        return [-1, -1]
    return [lo, hi]
```

Or manually: for **leftmost**, use `hi = mid` when `nums[mid] >= target`; for **rightmost**, use `lo = mid + 1` when `nums[mid] <= target`.

### Pattern D — Peak / Mountain Array

```python
def findPeakElement(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < nums[mid + 1]:
            lo = mid + 1          # ascending — peak is to the right
        else:
            hi = mid              # descending — peak is here or to the left
    return lo
```

> **Pitfall:** Always define the loop invariant — "the answer is still in `[lo, hi]`" — and prove both branches maintain it.

**Time/Space:** O(log n) / O(1)

---

## 6 — Linked List *(5 must-memorize moves)*

**Recognize:** reverse, detect cycle, find middle, merge sorted lists, reorder

### A — Dummy Head (build / merge lists)

```python
dummy = ListNode(0)
tail = dummy
# ... build list by setting tail.next = new_node; tail = tail.next
return dummy.next
```

### B — Reverse a Linked List

```python
def reverse(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev, cur = cur, nxt
    return prev
```

### C — Fast / Slow Pointers (find middle / detect cycle)

```python
slow = fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next
# slow is now at the middle
```

### D — Merge Two Sorted Lists

```python
def mergeTwoLists(l1, l2):
    dummy = ListNode(0); tail = dummy
    while l1 and l2:
        if l1.val <= l2.val:
            tail.next = l1; l1 = l1.next
        else:
            tail.next = l2; l2 = l2.next
        tail = tail.next
    tail.next = l1 or l2
    return dummy.next
```

### E — Floyd's Cycle Detection (find cycle entry)

```python
def detectCycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:                   # cycle confirmed
            slow = head
            while slow != fast:            # find entry point
                slow = slow.next
                fast = fast.next
            return slow
    return None
```

### F — Nth Node from End (two pointers with gap K)

```python
def removeNthFromEnd(head, n):
    dummy = ListNode(0); dummy.next = head
    fast = slow = dummy
    for _ in range(n + 1):   # advance fast n+1 steps
        fast = fast.next
    while fast:               # move both until fast hits end
        slow = slow.next; fast = fast.next
    slow.next = slow.next.next   # delete target
    return dummy.next
```

> When fast reaches `None`, slow is right before the Nth-from-end node. The `+1` offset lets slow stop at the **predecessor** (needed for deletion).

> **Pitfall:** Save `nxt = cur.next` before any rewiring — you will lose the list otherwise.

---

## 7 — Trees *(DFS / BFS + return-a-tuple trick)*

**Recognize:** path sum, subtree property, LCA, diameter, validate BST, level order, zigzag

### Pattern A — Postorder DFS Returning a Tuple

The "return-a-tuple" trick powers: diameter, balanced check, largest BST subtree, camera coverage.

```python
def dfs(node):
    if not node:
        return base_tuple          # e.g., (True, 0) for (is_balanced, height)
    left  = dfs(node.left)
    right = dfs(node.right)
    return combine(left, right, node)
```

**Example — tree diameter:**

```python
def diameterOfBinaryTree(root):
    best = 0
    def dfs(node):
        nonlocal best
        if not node: return 0
        l, r = dfs(node.left), dfs(node.right)
        best = max(best, l + r)
        return 1 + max(l, r)
    dfs(root)
    return best
```

### Pattern B — BFS Level Order

```python
def levelOrder(root):
    if not root: return []
    current = [root]; res = []
    while current:
        level = []
        next_level = []
        for node in current:
            level.append(node.val)
            if node.left:  next_level.append(node.left)
            if node.right: next_level.append(node.right)
        res.append(level)
        current = next_level
    return res
```

> Two-list swap: `current` holds this level's nodes, `next_level` collects the next. Swap at the end of each level. No deque needed — naturally expresses "process level by level".

### Pattern C — BST Properties

**Key insight:** in-order DFS (left → node → right) visits a valid BST in **strictly ascending order**. Collect values into a list and check that every element is greater than the previous.

**Validate BST:**

```python
def isValidBST(root):
    vals = []
    def inorder(node):
        if not node:
            return
        inorder(node.left)
        vals.append(node.val)
        inorder(node.right)
    inorder(root)
    return all(vals[i] < vals[i + 1] for i in range(len(vals) - 1))
```

> The list makes the logic obvious: a valid BST's in-order traversal must be strictly increasing. `<` not `<=` because duplicates are not allowed in a standard BST.

**Kth Smallest in BST** — same in-order traversal, stop early:

```python
def kthSmallest(root, k):
    vals = []
    def inorder(node):
        if not node or len(vals) == k:
            return
        inorder(node.left)
        vals.append(node.val)
        inorder(node.right)
    inorder(root)
    return vals[-1]
```

**Closest value** — binary search on the BST structure (no traversal needed):

```python
def closestValue(root, target):
    closest = root.val
    while root:
        if abs(root.val - target) < abs(closest - target):
            closest = root.val
        root = root.left if target < root.val else root.right
    return closest
```

### Pattern D — LCA (Lowest Common Ancestor)

```python
def lowestCommonAncestor(root, p, q):
    if not root or root is p or root is q:
        return root
    left  = lowestCommonAncestor(root.left,  p, q)
    right = lowestCommonAncestor(root.right, p, q)
    return root if left and right else left or right
```

> **Logic:** if both left and right return non-None, current node is the LCA. Otherwise bubble up whichever side found a match.

### Pattern E — Path-Tracking DFS (root-to-leaf paths)

```python
def pathSum(root, target):
    res = []
    def dfs(node, remaining, path):
        if not node: return
        path.append(node.val)
        if not node.left and not node.right and remaining == node.val:
            res.append(path[:])
        else:
            dfs(node.left,  remaining - node.val, path)
            dfs(node.right, remaining - node.val, path)
        path.pop()                           # backtrack
    dfs(root, target, [])
    return res
```

> Use this whenever you need to collect/aggregate along a root-to-leaf path. The `path.pop()` is the backtrack step.

---

## 8 — Heap / Priority Queue

**Recognize:** top K, kth largest/smallest, merge K sorted lists, streaming median, scheduling by earliest finish time

### Pattern A — Top K Elements (min-heap of size K)

```python
import heapq

def topK(nums, k):
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)    # evict the smallest
    return sorted(h, reverse=True)
```

> For **top K largest**: use a min-heap of size K (keeps K largest, evicts smallest).
> For **top K smallest**: use a max-heap of size K with negated values.

### Pattern B — K-Way Merge

```python
import heapq

def mergeKLists(lists):
    dummy = ListNode(0); tail = dummy
    h = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(h, (node.val, i, node))
    while h:
        val, i, node = heapq.heappop(h)
        tail.next = node; tail = tail.next
        if node.next:
            heapq.heappush(h, (node.next.val, i, node.next))
    return dummy.next
```

**Time:** O(N log K) where N = total elements, K = number of lists

### Pattern C — Two Heaps (Running Median)

```python
import heapq

class MedianFinder:
    def __init__(self):
        self.lo = []   # max-heap (negate values): stores lower half
        self.hi = []   # min-heap: stores upper half

    def addNum(self, num):
        heapq.heappush(self.lo, -num)
        heapq.heappush(self.hi, -heapq.heappop(self.lo))
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def findMedian(self):
        if len(self.lo) > len(self.hi):
            return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2
```

---

## 9 — Backtracking *(3 families)*

**Recognize:** "generate all", subsets/permutations, constraint satisfaction, word search, N-Queens, Sudoku

> **Core template:** make a choice → recurse → undo the choice (backtrack).

### Pattern A — Subsets (choose / skip each element)

```python
def subsets(nums):
    res = []; path = []
    def bt(i):
        if i == len(nums):
            res.append(path[:]); return
        bt(i + 1)                    # skip nums[i]
        path.append(nums[i])
        bt(i + 1)                    # take nums[i]
        path.pop()
    bt(0)
    return res
```

### Pattern B — Permutations (used[] array)

```python
def permute(nums):
    res = []; used = [False] * len(nums); path = []
    def bt():
        if len(path) == len(nums):
            res.append(path[:]); return
        for i in range(len(nums)):
            if used[i]: continue
            used[i] = True; path.append(nums[i])
            bt()
            path.pop(); used[i] = False
    bt()
    return res
```

### Pattern C — Combination Sum (reuse vs no-reuse)

```python
def combinationSum(candidates, target):
    res = []; path = []
    def bt(i, remaining):
        if remaining == 0:
            res.append(path[:]); return
        if remaining < 0 or i == len(candidates):
            return
        # include candidates[i] — allow reuse: recurse with same i
        path.append(candidates[i])
        bt(i, remaining - candidates[i])
        path.pop()
        # skip candidates[i] — no reuse: recurse with i+1
        bt(i + 1, remaining)
    bt(0, target)
    return res
```

> **Pitfall — Duplicates:** Sort first, then skip duplicates at the same recursion depth:
> ```python
> if i > start and candidates[i] == candidates[i-1]: continue
> ```

### Pattern D — Grid Word Search (DFS + backtracking)

```python
def exist(board, word):
    rows, cols = len(board), len(board[0])
    def dfs(r, c, i):
        if i == len(word): return True
        if not (0 <= r < rows and 0 <= c < cols): return False
        if board[r][c] != word[i]: return False
        tmp, board[r][c] = board[r][c], '#'    # mark visited
        found = any(dfs(r+dr, c+dc, i+1) for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)])
        board[r][c] = tmp                       # restore (backtrack)
        return found
    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))
```

> **Trick:** mutate the board cell to `'#'` to mark it visited without an extra set — then restore it. Time: O(rows × cols × 4^len(word)).

**Time:** O(2^n) subsets, O(n!) permutations — backtracking prunes aggressively in practice.

---

## 10 — Tries *(prefix problems)*

**Recognize:** prefix search, dictionary lookup with wildcards, autocomplete, word search II (many words), "starts with"

### Basic Trie Implementation

```python
class TrieNode:
    def __init__(self):
        self.ch = {}
        self.end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for c in word:
            node = node.ch.setdefault(c, TrieNode())
        node.end = True

    def search(self, word):
        node = self.root
        for c in word:
            if c not in node.ch: return False
            node = node.ch[c]
        return node.end

    def startsWith(self, prefix):
        node = self.root
        for c in prefix:
            if c not in node.ch: return False
            node = node.ch[c]
        return True
```

### Autocomplete Optimization

Store a list of **top-3 suggestions** at each Trie node, updated on insert. Query is then O(prefix_length) — no DFS needed at query time.

### Word Search II (Backtracking + Trie)

Build a Trie from all words. DFS the grid, walk the Trie simultaneously. When `node.end == True`, record the found word and clear `node.end` to avoid duplicates.

**Time:** O(W × L) to build, O(prefix_len) to query

---

## 11 — Graphs (Unweighted) — DFS / BFS / Topo / Bipartite

**Recognize:** connected components, "number of islands", shortest steps (unweighted), prerequisites/ordering, graph coloring

### Pattern A — BFS Shortest Path (unweighted)

```python
def bfs_shortest(start, adj):
    q = [start]; dist = {start: 0}
    i = 0
    while i < len(q):
        u = q[i]; i += 1
        for v in adj[u]:
            if v not in dist:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist
```

> Index-based BFS: advance a pointer `i` instead of popping from the front. Same O(V+E) complexity, no imports needed.

### Pattern B — Grid BFS/DFS

```python
def numIslands(grid):
    if not grid: return 0
    rows, cols = len(grid), len(grid[0])
    visited = set(); count = 0
    def bfs(r, c):
        q = [(r, c)]; visited.add((r, c))
        i = 0
        while i < len(q):
            row, col = q[i]; i += 1
            for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:
                nr, nc = row+dr, col+dc
                if 0<=nr<rows and 0<=nc<cols and grid[nr][nc]=='1' and (nr,nc) not in visited:
                    visited.add((nr, nc)); q.append((nr, nc))
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1' and (r,c) not in visited:
                bfs(r, c); count += 1
    return count
```

### Pattern C — Topological Sort (Kahn's Algorithm)

```python
def topoSort(n, edges):
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in edges:
        adj[u].append(v); indeg[v] += 1
    q = [i for i in range(n) if indeg[i] == 0]
    i = 0
    while i < len(q):
        u = q[i]; i += 1
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0: q.append(v)
    return q if len(q) == n else []          # [] = cycle detected
```

### Pattern D — Bipartite Check (2-coloring)

```python
def isBipartite(graph):
    color = {}
    for start in range(len(graph)):
        if start in color: continue
        q = [start]; color[start] = 0
        i = 0
        while i < len(q):
            u = q[i]; i += 1
            for v in graph[u]:
                if v not in color:
                    color[v] = 1 - color[u]; q.append(v)
                elif color[v] == color[u]:
                    return False
    return True
```

### Pattern E — DFS Cycle Detection in Directed Graph (3-color)

```python
def hasCycle(n, adj):
    # 0 = unvisited (white), 1 = in current path (gray), 2 = done (black)
    state = [0] * n
    def dfs(u):
        state[u] = 1                       # mark gray (in stack)
        for v in adj[u]:
            if state[v] == 1: return True  # back edge → cycle
            if state[v] == 0 and dfs(v): return True
        state[u] = 2                       # mark black (done)
        return False
    return any(state[u] == 0 and dfs(u) for u in range(n))
```

> Use 3-color (not simple `visited`) for **directed** graphs. For undirected graphs, simple `visited` + "don't go to parent" is enough.

---

## 12 — Advanced Graphs (Weighted / DSU / MST)

### Pattern A — Dijkstra (non-negative weights)

```python
import heapq

def dijkstra(n, adj, src):
    INF = float('inf')
    dist = [INF] * n; dist[src] = 0
    h = [(0, src)]
    while h:
        d, u = heapq.heappop(h)
        if d != dist[u]: continue        # stale entry — skip
        for v, w in adj[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(h, (nd, v))
    return dist
```

> **Stale check:** `if d != dist[u]: continue` is more efficient than a `visited` set.

### Pattern B — 0-1 BFS (edge weights are 0 or 1 only)

```python
from collections import deque

def zeroOneBFS(n, adj, src):
    dist = [float('inf')] * n; dist[src] = 0
    q = deque([src])
    while q:
        u = q.popleft()
        for v, w in adj[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                if w == 0: q.appendleft(v)   # 0-cost: to front
                else:      q.append(v)        # 1-cost: to back
    return dist
```

**Why it works:** deque acts as a priority queue when weights are only 0 or 1. O(V + E) vs O((V+E) log V) for Dijkstra.

### Pattern C — Union-Find / DSU (connectivity, Kruskal MST)

```python
class DSU:
    def __init__(self, n):
        self.p = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]   # path compression (halving)
            x = self.p[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb: return False            # already connected
        if self.rank[ra] < self.rank[rb]: ra, rb = rb, ra
        self.p[rb] = ra
        if self.rank[ra] == self.rank[rb]: self.rank[ra] += 1
        return True
```

**Kruskal MST:** sort edges by weight → greedily union if they connect different components.

### Pattern D — Bellman-Ford (negative weights / detect negative cycle)

```python
def bellmanFord(n, edges, src):
    dist = [float('inf')] * n; dist[src] = 0
    for _ in range(n - 1):                   # relax n-1 times
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    # Check for negative cycle: if any edge can still be relaxed
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            return None                       # negative cycle exists
    return dist
```

---

## 13 — Dynamic Programming — Full Coverage

### A) 1D DP (Linear / Rolling)

**Recognize:** "max/min/count" with choices per index; "number of ways"; "rob"; "decode ways"; "jump game cost"

**Rule:** define `dp[i]` meaning clearly before coding. The transition must depend only on earlier states.

**Pattern 1 — Take/Skip (House Robber family)**

```python
def rob(nums):
    take = skip = 0
    for x in nums:
        take, skip = skip + x, max(skip, take)
    return max(take, skip)
```

**Pattern 2 — Count Ways (Climb Stairs / Decode Ways)**

```python
def climbStairs(n):
    a, b = 1, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b
```

**Pattern 3 — Kadane (max subarray)**

```python
def maxSubArray(nums):
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
```

**Pattern 4 — LIS (Longest Increasing Subsequence)**

```python
import bisect

def lengthOfLIS(nums):
    tails = []                           # tails[i] = smallest tail of all IS of length i+1
    for x in nums:
        pos = bisect.bisect_left(tails, x)
        if pos == len(tails): tails.append(x)
        else:                  tails[pos] = x
    return len(tails)                    # O(n log n)
```

### B) 2D DP (Grids / Strings / Knapsack)

**Recognize:** two indices i, j; grid movement; string alignment; "pick items up to weight W"

**Pattern 1 — Grid DP (min path sum)**

```python
def minPathSum(grid):
    m, n = len(grid), len(grid[0])
    dp = [[0] * n for _ in range(m)]
    dp[0][0] = grid[0][0]
    for i in range(m):
        for j in range(n):
            if i == j == 0: continue
            best = float('inf')
            if i > 0: best = min(best, dp[i-1][j])
            if j > 0: best = min(best, dp[i][j-1])
            dp[i][j] = best + grid[i][j]
    return dp[m-1][n-1]
```

**Pattern 2 — String DP (LCS / Edit Distance family)**

```python
def lcs(a, b):
    n, m = len(a), len(b)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n - 1, -1, -1):
        for j in range(m - 1, -1, -1):
            dp[i][j] = (1 + dp[i+1][j+1]) if a[i] == b[j] else max(dp[i+1][j], dp[i][j+1])
    return dp[0][0]
```

**Edit distance:** `dp[i][j] = dp[i+1][j+1]` if chars match, else `1 + min(dp[i+1][j], dp[i][j+1], dp[i+1][j+1])`.

**Pattern 3 — Knapsack**

```python
# 0/1 knapsack (each item used at most once)
def knapsack01(weights, values, W):
    dp = [0] * (W + 1)
    for w, v in zip(weights, values):
        for cap in range(W, w - 1, -1):   # BACKWARDS prevents reuse
            dp[cap] = max(dp[cap], dp[cap - w] + v)
    return dp[W]

# Unbounded knapsack (item can be reused)
def knapsackUnbounded(weights, values, W):
    dp = [0] * (W + 1)
    for w, v in zip(weights, values):
        for cap in range(w, W + 1):        # FORWARDS allows reuse
            dp[cap] = max(dp[cap], dp[cap - w] + v)
    return dp[W]
```

### E) State Machine DP *(stock buy/sell family)*

**Recognize:** "buy/sell with cooldown / transaction limit / fee", multiple states per index

```python
# Best Time to Buy/Sell Stock with Cooldown
def maxProfit(prices):
    hold  = float('-inf')   # holding a stock
    cash  = 0               # not holding, can buy
    cool  = 0               # cooldown (just sold)
    for p in prices:
        hold, cash, cool = max(hold, cash - p), max(cash, cool), hold + p
    return max(cash, cool)
```

> **Key insight:** define states that capture all relevant history, then write transitions. With `k` transactions: `dp[i][k][0/1]` (day, txns left, holding/not).

### F) Palindrome DP *(expand-from-center or 2D DP)*

```python
# Count all palindromic substrings — O(n²) expand-from-center
def countSubstrings(s):
    count = 0
    def expand(l, r):
        nonlocal count
        while l >= 0 and r < len(s) and s[l] == s[r]:
            count += 1; l -= 1; r += 1
    for i in range(len(s)):
        expand(i, i)      # odd-length
        expand(i, i + 1)  # even-length
    return count

# 2D DP: dp[i][j] = True if s[i..j] is palindrome
# dp[i][j] = (s[i] == s[j]) and (j - i < 2 or dp[i+1][j-1])
```

> Manacher's algorithm does this in O(n) but expand-from-center is interview-sufficient and far easier to recall.

### C) Interval DP *(the "forgotten" DP category)*

**Recognize:** "best result for subarray [l..r]", burst balloons, palindrome partition, matrix chain multiplication, stone merging

```python
# Template: dp[l][r] = best answer for interval l..r
# Enumerate all interval lengths, then split points

n = len(arr)
dp = [[0] * n for _ in range(n)]

for length in range(2, n + 1):           # interval length
    for l in range(n - length + 1):
        r = l + length - 1
        for k in range(l, r):            # split point
            dp[l][r] = max(dp[l][r], dp[l][k] + dp[k+1][r] + cost(l, k, r))
```

**Time:** O(n³) — acceptable for n ≤ 500.

### D) Bitmask DP *(subset DP)*

**Recognize:** n ≤ 20, "visit all nodes / assign all tasks / cover all states", TSP-like, "state = set of chosen items"

```python
# dp[mask] or dp[mask][i]
# mask is a bitmask representing which elements have been used
# iterate over all 2^n subsets

n = 5
dp = [float('inf')] * (1 << n)
dp[0] = 0   # base case: empty set

for mask in range(1 << n):
    for i in range(n):
        if mask & (1 << i): continue          # i already in mask
        new_mask = mask | (1 << i)
        dp[new_mask] = min(dp[new_mask], dp[mask] + cost(mask, i))
```

---

## 14 — Greedy *(with invariant proof)*

**Recognize:** "minimum operations", "can you reach the end", "choose earliest finishing", "maximize number of tasks/events", "assign to minimize max"

> **Key test:** Can you state a monotonic invariant — a property that stays true and never needs to be undone? If yes, greedy works. If no, it's probably DP.

### Pattern A — Reachability Greedy (Jump Game)

```python
def canJump(nums):
    far = 0
    for i, x in enumerate(nums):
        if i > far: return False    # can't reach index i
        far = max(far, i + x)
    return True
```

### Pattern B — Interval Scheduling (maximize non-overlapping)

```python
def maxEvents(intervals):
    intervals.sort(key=lambda x: x[1])   # sort by END time
    count = 0; last_end = float('-inf')
    for start, end in intervals:
        if start > last_end:              # no overlap
            count += 1; last_end = end
    return count
```

### Pattern C — Greedy with a Heap (task scheduling, meeting rooms II)

```python
import heapq

def minMeetingRooms(intervals):
    intervals.sort()                     # sort by start
    h = []                               # min-heap of end times
    for start, end in intervals:
        if h and h[0] <= start:
            heapq.heapreplace(h, end)    # reuse earliest-freed room
        else:
            heapq.heappush(h, end)       # need new room
    return len(h)
```

---

## 15 — Intervals *(3 core patterns)*

**Recognize:** merge overlapping, minimum rooms/resources needed, event scheduling, sweep line

### Pattern A — Merge Intervals (sort by start)

```python
def merge(intervals):
    intervals.sort()
    res = []
    for s, e in intervals:
        if not res or res[-1][1] < s:
            res.append([s, e])
        else:
            res[-1][1] = max(res[-1][1], e)
    return res
```

### Pattern B — Insert Interval

```python
def insert(intervals, newInterval):
    res = []; i = 0; n = len(intervals)
    while i < n and intervals[i][1] < newInterval[0]:
        res.append(intervals[i]); i += 1
    while i < n and intervals[i][0] <= newInterval[1]:
        newInterval[0] = min(newInterval[0], intervals[i][0])
        newInterval[1] = max(newInterval[1], intervals[i][1])
        i += 1
    res.append(newInterval)
    res.extend(intervals[i:])
    return res
```

### Pattern C — Sweep Line / Difference Array

```python
def minRooms_sweep(intervals):
    events = []
    for s, e in intervals:
        events.append((s, 1))
        events.append((e, -1))
    events.sort(key=lambda x: (x[0], x[1]))  # end (-1) before start (+1) at same time
    rooms = max_rooms = 0
    for _, delta in events:
        rooms += delta
        max_rooms = max(max_rooms, rooms)
    return max_rooms
```

---

## 16 — Monotonic Deque *(sliding window max/min)*

**Recognize:** "maximum/minimum in every window of size K", "subarray min/max", "largest rectangle" variations, "shortest subarray with sum ≥ k"

> **Core insight:** A standard sliding window with `max()` is O(nk). The deque keeps a decreasing sequence of candidates — `max` is always the front. Each element is pushed and popped at most once → **O(n) total**.

### Sliding Window Maximum

```python
from collections import deque

def maxSlidingWindow(nums, k):
    dq = deque()   # stores indices; front = index of current max
    res = []
    for i, x in enumerate(nums):
        # Remove indices outside the window
        while dq and dq[0] < i - k + 1:
            dq.popleft()
        # Remove indices whose values are smaller than x (they can never be max)
        while dq and nums[dq[-1]] < x:
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            res.append(nums[dq[0]])   # front is always the max
    return res
```

### Sliding Window Minimum

Same template — flip `<` to `>` in the inner while loop.

### Monotonic Queue for DP Optimization

When a DP recurrence is `dp[i] = max(dp[j]) + cost` over a valid range of j, a monotonic deque turns O(n²) DP into O(n).

**Time/Space:** O(n) / O(k)

---

## 17 — Segment Tree & BIT *(range queries with updates)*

**Recognize:** "range sum / range min / range max query", "point update then query", "inversion count", "count of smaller numbers after self"

> **Rule of thumb:** If you need `O(log n)` point updates AND range queries, reach for BIT (Fenwick Tree) for sums, or Segment Tree for anything more complex (range min/max, lazy propagation).

### Binary Indexed Tree (Fenwick Tree) — Range Sum + Point Update

```python
class BIT:
    def __init__(self, n):
        self.n = n
        self.tree = [0] * (n + 1)   # 1-indexed

    def update(self, i, delta):
        while i <= self.n:
            self.tree[i] += delta
            i += i & (-i)           # move to parent

    def query(self, i):             # prefix sum [1..i]
        s = 0
        while i > 0:
            s += self.tree[i]
            i -= i & (-i)           # move to predecessor
        return s

    def range_query(self, l, r):    # sum [l..r]
        return self.query(r) - self.query(l - 1)
```

### Segment Tree — Range Min/Max with Point Update

```python
class SegTree:
    def __init__(self, nums):
        self.n = len(nums)
        self.tree = [float('inf')] * (4 * self.n)
        self.build(nums, 1, 0, self.n - 1)

    def build(self, nums, node, start, end):
        if start == end:
            self.tree[node] = nums[start]
        else:
            mid = (start + end) // 2
            self.build(nums, 2*node,   start, mid)
            self.build(nums, 2*node+1, mid+1, end)
            self.tree[node] = min(self.tree[2*node], self.tree[2*node+1])

    def update(self, node, start, end, idx, val):
        if start == end:
            self.tree[node] = val
        else:
            mid = (start + end) // 2
            if idx <= mid: self.update(2*node,   start, mid,   idx, val)
            else:          self.update(2*node+1, mid+1, end,   idx, val)
            self.tree[node] = min(self.tree[2*node], self.tree[2*node+1])

    def query(self, node, start, end, l, r):
        if r < start or end < l: return float('inf')   # out of range
        if l <= start and end <= r: return self.tree[node]  # fully covered
        mid = (start + end) // 2
        return min(self.query(2*node,   start, mid,   l, r),
                   self.query(2*node+1, mid+1, end, l, r))
```

**Usage:**
```python
st = SegTree(nums)
st.update(1, 0, st.n-1, idx, new_val)
result = st.query(1, 0, st.n-1, l, r)
```

---

## 18 — Math & Bit Manipulation

### Math Patterns

```python
from math import gcd

# GCD / LCM — water jug, divisibility
lcm = lambda a, b: a * b // gcd(a, b)
can_fill = lambda x, y, t: t <= x + y and t % gcd(x, y) == 0

# Modular arithmetic (large counts)
MOD = 10**9 + 7
result = (a * b) % MOD
# Modular inverse (Fermat's little theorem, MOD must be prime)
inv = pow(a, MOD - 2, MOD)

# Fast exponentiation
pow(base, exp, mod)   # Python built-in: O(log exp)

# Integer square root (avoid float precision issues)
import math
isqrt = math.isqrt(n)   # exact integer sqrt, no float
```

### Combinatorics

```python
# nCr mod p using Pascal's triangle — O(n²), use when n ≤ 1000
def build_pascal(n, MOD):
    C = [[0] * (n+1) for _ in range(n+1)]
    for i in range(n+1):
        C[i][0] = 1
        for j in range(1, i+1):
            C[i][j] = (C[i-1][j-1] + C[i-1][j]) % MOD
    return C

# nCr mod p using Fermat's little theorem — O(n), use when n ≤ 10^6
def nCr(n, r, MOD):
    if r > n: return 0
    num = den = 1
    for i in range(r):
        num = num * (n - i) % MOD
        den = den * (i + 1) % MOD
    return num * pow(den, MOD - 2, MOD) % MOD   # den^(MOD-2) = modular inverse
```

> **When:** counting arrangements, paths in grid (only right/down), parentheses expressions, or any "choose k from n" question.

### Bit Manipulation Patterns

```python
# Test if bit k is set
(n >> k) & 1

# Set bit k
n | (1 << k)

# Clear bit k
n & ~(1 << k)

# Remove lowest set bit
n & (n - 1)

# Count set bits
bin(n).count('1')    # or: import math; math.popcount(n) in Python 3.10+

# XOR cancellation (find single number)
def singleNumber(nums):
    x = 0
    for v in nums: x ^= v
    return x

# Iterate over all non-empty subsets of a mask
sub = mask
while sub:
    process(sub)
    sub = (sub - 1) & mask

# Check if n is a power of 2
n > 0 and (n & (n - 1)) == 0

# Lowest set bit (useful in BIT / DSU)
lowbit = n & (-n)
```

---

## 19 — Greedy: Intervals & Scheduling *(extended)*

> Covered partly in Patterns 14 & 15. Here are the 3 classic interval problems and their exact approaches.

| Problem | Sort by | Data structure | Decision |
|---|---|---|---|
| **Merge intervals** | Start | Array | Merge if overlap |
| **Non-overlapping intervals** (min remove) | End | Counter | Keep if no overlap |
| **Meeting Rooms II** (min rooms) | Start | Min-heap of ends | Reuse or add room |
| **Task scheduler** (min idle) | Frequency | Max-heap | Always schedule most frequent next |

---

## Quick Reference: Time & Space Complexity Cheat Sheet

| Pattern | Time | Space | Notes |
|---|---|---|---|
| Arrays / Hashing | O(n) | O(n) | |
| Two-Sum hash lookup | O(n) | O(n) | Single pass |
| Dutch National Flag | O(n) | O(1) | 3-pointer in-place partition |
| Longest Consecutive Seq | O(n) | O(n) | Hash set, start only at seq beginning |
| Two Pointers (l/r) | O(n) | O(1) | Sorted array |
| Palindrome check | O(n) | O(1) | l/r shrink, skip non-alnum for LC 125 |
| 3Sum | O(n²) | O(1) | Sort + fix outer + inner two pointers |
| Sliding Window | O(n) | O(k) | k = window constraint |
| Monotonic Stack | O(n) | O(n) | Each element pushed+popped once |
| Monotonic Deque | O(n) | O(k) | Sliding window max/min |
| Binary Search | O(log n) | O(1) | |
| Linked List ops | O(n) | O(1) | |
| Nth from end | O(n) | O(1) | Two pointers with gap |
| Tree DFS | O(n) | O(h) | h = height; O(log n) balanced, O(n) skewed |
| Tree BFS | O(n) | O(w) | w = max width ≈ n/2 last level |
| LCA | O(n) | O(h) | Recursive postorder |
| Heap (top K) | O(n log k) | O(k) | |
| K-way merge | O(N log k) | O(k) | N = total elements |
| Backtracking subsets | O(2^n) | O(n) | |
| Backtracking perms | O(n! × n) | O(n) | |
| Grid word search | O(rows×cols×4^L) | O(L) | L = word length |
| Trie insert/search | O(L) | O(A × L × N) | L=word len, A=alphabet, N=words |
| BFS / DFS (graph) | O(V + E) | O(V) | |
| Directed cycle (3-color) | O(V + E) | O(V) | DFS with white/gray/black states |
| Dijkstra | O((V+E) log V) | O(V) | Min-heap |
| 0-1 BFS | O(V + E) | O(V) | Deque instead of heap |
| Bellman-Ford | O(V × E) | O(V) | Handles negative edges |
| Union-Find | O(α(n)) ≈ O(1) | O(n) | With path compression + union by rank |
| Topological Sort | O(V + E) | O(V) | Kahn's (BFS-based) |
| 1D DP | O(n) | O(1) rolling | |
| State machine DP | O(n × states) | O(states) | Stock buy/sell family |
| Palindrome (expand) | O(n²) | O(1) | Expand-from-center |
| 2D DP | O(n × m) | O(m) rolling | |
| Interval DP | O(n³) | O(n²) | n ≤ 500 typical |
| Bitmask DP | O(2^n × n) | O(2^n) | n ≤ 20 typical |
| LIS (patience) | O(n log n) | O(n) | |
| BIT (Fenwick) | O(log n) per op | O(n) | Range sum + point update |
| Segment Tree | O(log n) per op | O(n) | Range min/max/sum + updates |
| nCr mod p (Fermat) | O(n) | O(1) | For n ≤ 10^6, MOD prime |

---

## When Patterns Combine *(common hard-problem combos)*

| Problem Type | Pattern Combo |
|---|---|
| "Shortest path with constraint (fuel/cost)" | BFS on `(node, constraint_state)` |
| "Top K with streaming updates" | Heap + Hash Map (for deletion) |
| "Count valid subarrays" | Sliding Window + Two Pointers or Prefix Sum |
| "Word search in grid with many words" | Backtracking + Trie (prune paths early) |
| "Schedule tasks with cooldown" | Greedy + Heap or math formula |
| "Range query with updates" | Segment Tree or BIT |
| "All paths / min-cost path in DAG" | Topological sort + DP |
| "Partition into subsets" | Backtracking + bitmask DP if n ≤ 20 |
| "Minimize max / maximize min" | Binary search on answer + greedy/BFS check |
| "Palindrome substrings / partitions" | Interval DP or expand-from-center |
