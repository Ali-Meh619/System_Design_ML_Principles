# Low-Level System Design (LLD)

> LLD interviews test whether you can translate a real-world problem into clean, extensible OOP code. The goal is not to write a complete application — it is to show structured thinking: identify entities, define responsibilities, apply the right design pattern, and handle concurrency where relevant.

---

## The LLD Interview Framework

Follow this every time:

1. **Clarify requirements** — functional (what it does) and non-functional (scale, thread-safety, extensibility)
2. **Identify core entities** — the nouns in the problem become classes
3. **Define relationships** — *is-a* (inheritance) vs *has-a* (composition). Prefer composition.
4. **Define interfaces** — depend on abstractions, not concretions (Dependency Inversion)
5. **Choose design patterns** — match the problem shape to a known pattern
6. **Handle edge cases** — concurrency, null inputs, capacity limits, invalid state transitions

---

## SOLID Principles *(the foundation)*

| Principle | One-line rule | Violation signal |
|---|---|---|
| **S**ingle Responsibility | One class = one reason to change | Class named `UserManagerAndEmailSender` |
| **O**pen/Closed | Open for extension, closed for modification | Adding a feature requires editing existing classes |
| **L**iskov Substitution | Subclass must be usable wherever parent is used | Subclass throws exceptions the parent never throws |
| **I**nterface Segregation | Clients shouldn't depend on methods they don't use | Interface with 15 methods, most returning `NotImplemented` |
| **D**ependency Inversion | Depend on abstractions, not concrete classes | `OrderService` directly instantiates `StripePayment()` |

---

## Design Patterns Quick Reference

### Creational Patterns

**Singleton** — one instance, globally accessible. Use for config, connection pools, loggers.

```python
class Singleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# Thread-safe version (import threading)
import threading

class ThreadSafeSingleton:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:       # double-checked locking
                    cls._instance = super().__new__(cls)
        return cls._instance
```

> **Pitfall:** double-checked locking is required — check outside the lock (fast path), then again inside (correctness).

---

**Factory** — decouple object creation from usage. Caller asks for a type, factory returns the right subclass.

```python
class Notification:
    def send(self, message): pass

class EmailNotification(Notification):
    def send(self, message): print(f"Email: {message}")

class SMSNotification(Notification):
    def send(self, message): print(f"SMS: {message}")

class PushNotification(Notification):
    def send(self, message): print(f"Push: {message}")

class NotificationFactory:
    @staticmethod
    def create(channel: str) -> Notification:
        options = {"email": EmailNotification, "sms": SMSNotification, "push": PushNotification}
        if channel not in options:
            raise ValueError(f"Unknown channel: {channel}")
        return options[channel]()
```

---

**Builder** — construct complex objects step-by-step. Use when a constructor would need many optional parameters.

```python
class QueryBuilder:
    def __init__(self):
        self._table = None
        self._conditions = []
        self._limit = None

    def from_table(self, table):
        self._table = table
        return self           # return self enables method chaining

    def where(self, condition):
        self._conditions.append(condition)
        return self

    def limit(self, n):
        self._limit = n
        return self

    def build(self):
        query = f"SELECT * FROM {self._table}"
        if self._conditions:
            query += " WHERE " + " AND ".join(self._conditions)
        if self._limit:
            query += f" LIMIT {self._limit}"
        return query

# Usage
query = QueryBuilder().from_table("users").where("age > 18").limit(50).build()
```

---

### Structural Patterns

**Decorator** — add behaviour to an object at runtime without changing its class. Wrap, don't subclass.

```python
class Coffee:
    def cost(self): return 2
    def description(self): return "Coffee"

class MilkDecorator:
    def __init__(self, coffee):
        self._coffee = coffee
    def cost(self): return self._coffee.cost() + 0.5
    def description(self): return self._coffee.description() + ", Milk"

class SugarDecorator:
    def __init__(self, coffee):
        self._coffee = coffee
    def cost(self): return self._coffee.cost() + 0.25
    def description(self): return self._coffee.description() + ", Sugar"

# Stack decorators
drink = SugarDecorator(MilkDecorator(Coffee()))
print(drink.cost())          # 2.75
print(drink.description())   # Coffee, Milk, Sugar
```

---

**Composite** — treat individual objects and groups of objects uniformly. Use for tree structures (file system, UI components, org chart).

```python
class FileSystemItem:
    def get_size(self): pass
    def display(self, indent=0): pass

class File(FileSystemItem):
    def __init__(self, name, size):
        self.name = name
        self.size = size
    def get_size(self): return self.size
    def display(self, indent=0): print(" " * indent + f"📄 {self.name} ({self.size}B)")

class Directory(FileSystemItem):
    def __init__(self, name):
        self.name = name
        self.children = []
    def add(self, item): self.children.append(item)
    def get_size(self): return sum(c.get_size() for c in self.children)
    def display(self, indent=0):
        print(" " * indent + f"📁 {self.name}/")
        for child in self.children:
            child.display(indent + 2)
```

---

### Behavioural Patterns

**Observer** — one-to-many dependency. When one object changes state, all dependents are notified automatically. Use for event systems, notifications, UI data binding.

```python
class EventBus:
    def __init__(self):
        self._subscribers = {}      # event_type → list of callbacks

    def subscribe(self, event, callback):
        self._subscribers.setdefault(event, []).append(callback)

    def unsubscribe(self, event, callback):
        if event in self._subscribers:
            self._subscribers[event].remove(callback)

    def publish(self, event, data=None):
        for callback in self._subscribers.get(event, []):
            callback(data)

# Usage
bus = EventBus()
bus.subscribe("order.placed", lambda d: print(f"Send email for order {d}"))
bus.subscribe("order.placed", lambda d: print(f"Update inventory for order {d}"))
bus.publish("order.placed", data={"order_id": 42})
```

---

**Strategy** — define a family of algorithms, encapsulate each one, make them interchangeable. Eliminates `if/elif` chains that grow with new requirements.

```python
class SortStrategy:
    def sort(self, data): pass

class QuickSort(SortStrategy):
    def sort(self, data): return sorted(data)          # simplified

class MergeSort(SortStrategy):
    def sort(self, data): return sorted(data)          # simplified

class Sorter:
    def __init__(self, strategy: SortStrategy):
        self._strategy = strategy
    def set_strategy(self, strategy): self._strategy = strategy
    def sort(self, data): return self._strategy.sort(data)
```

---

**State** — allow an object to change behaviour when its internal state changes. Each state is a class. Eliminates large `if state == X` blocks.

```python
class State:
    def insert_coin(self, machine): pass
    def press_button(self, machine): pass

class IdleState(State):
    def insert_coin(self, machine):
        print("Coin inserted")
        machine.state = HasCoinState()
    def press_button(self, machine):
        print("Insert coin first")

class HasCoinState(State):
    def insert_coin(self, machine):
        print("Coin already inserted")
    def press_button(self, machine):
        if machine.count > 0:
            print("Dispensing item")
            machine.count -= 1
            machine.state = IdleState()
        else:
            print("Out of stock")
            machine.state = EmptyState()

class EmptyState(State):
    def insert_coin(self, machine): print("Out of stock — returning coin")
    def press_button(self, machine): print("Out of stock")

class VendingMachine:
    def __init__(self, count):
        self.count = count
        self.state = IdleState() if count > 0 else EmptyState()
    def insert_coin(self): self.state.insert_coin(self)
    def press_button(self): self.state.press_button(self)
```

---

**Command** — encapsulate a request as an object. Enables undo/redo, queuing, logging of operations.

```python
class Command:
    def execute(self): pass
    def undo(self): pass

class TextEditor:
    def __init__(self): self.content = ""
    def insert(self, text): self.content += text
    def delete(self, n): self.content = self.content[:-n]

class InsertCommand(Command):
    def __init__(self, editor, text):
        self.editor = editor
        self.text = text
    def execute(self): self.editor.insert(self.text)
    def undo(self):    self.editor.delete(len(self.text))

class CommandHistory:
    def __init__(self): self.history = []
    def execute(self, cmd):
        cmd.execute()
        self.history.append(cmd)
    def undo(self):
        if self.history:
            self.history.pop().undo()
```

---

## Classic LLD Questions

### 1. LRU Cache

**Pattern:** HashMap + Doubly Linked List. HashMap gives O(1) lookup; DLL gives O(1) move-to-front and evict-from-tail.

```python
class Node:
    def __init__(self, key=0, val=0):
        self.key = key
        self.val = val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = {}                     # key → Node
        self.head = Node()                  # dummy head (most recent)
        self.tail = Node()                  # dummy tail (least recent)
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _insert_front(self, node):          # insert after head
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key):
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._remove(node)
        self._insert_front(node)            # move to most-recent
        return node.val

    def put(self, key, val):
        if key in self.cache:
            self._remove(self.cache[key])
        node = Node(key, val)
        self.cache[key] = node
        self._insert_front(node)
        if len(self.cache) > self.capacity:
            lru = self.tail.prev            # evict least-recent
            self._remove(lru)
            del self.cache[lru.key]
```

---

### 2. Parking Lot

**Key entities:** `ParkingLot`, `Level`, `Spot` (subclasses: `CompactSpot`, `LargeSpot`, `HandicappedSpot`), `Vehicle` (subclasses: `Car`, `Truck`, `Motorcycle`), `Ticket`.

```python
from enum import Enum
from datetime import datetime

class SpotSize(Enum): COMPACT = 1; LARGE = 2; HANDICAPPED = 3
class VehicleType(Enum): MOTORCYCLE = 1; CAR = 2; TRUCK = 3

class Vehicle:
    def __init__(self, plate, vtype: VehicleType):
        self.plate = plate
        self.vtype = vtype
    def fits(self, spot): pass              # subclass decides

class Car(Vehicle):
    def __init__(self, plate):
        super().__init__(plate, VehicleType.CAR)
    def fits(self, spot):
        return spot.size in (SpotSize.COMPACT, SpotSize.LARGE)

class Spot:
    def __init__(self, level, number, size: SpotSize):
        self.level = level
        self.number = number
        self.size = size
        self.vehicle = None
    def is_free(self): return self.vehicle is None
    def park(self, vehicle): self.vehicle = vehicle
    def remove(self): self.vehicle = None

class Ticket:
    def __init__(self, spot, vehicle):
        self.spot = spot
        self.vehicle = vehicle
        self.entry_time = datetime.now()
    def fee(self, rate_per_hour=2.0):
        hours = (datetime.now() - self.entry_time).seconds / 3600
        return round(hours * rate_per_hour, 2)

class ParkingLot:
    def __init__(self, levels):
        self.levels = levels                # list of lists of Spot

    def park(self, vehicle):
        for level in self.levels:
            for spot in level:
                if spot.is_free() and vehicle.fits(spot):
                    spot.park(vehicle)
                    return Ticket(spot, vehicle)
        return None                         # lot full

    def unpark(self, ticket):
        fee = ticket.fee()
        ticket.spot.remove()
        return fee
```

**Extension points:** add `ParkingFeeStrategy` (Strategy pattern) for different pricing models; add `Observer` to notify when lot becomes full.

---

### 3. Elevator System

**Pattern:** State (IDLE, MOVING_UP, MOVING_DOWN, MAINTENANCE) + Strategy for scheduling (SCAN/LOOK algorithm).

```python
from enum import Enum

class Direction(Enum): UP = 1; DOWN = -1; IDLE = 0

class ElevatorState(Enum): IDLE = 0; MOVING = 1; MAINTENANCE = 2

class Elevator:
    def __init__(self, id, floors):
        self.id = id
        self.current_floor = 0
        self.direction = Direction.IDLE
        self.state = ElevatorState.IDLE
        self.requests = set()               # floors to stop at

    def add_request(self, floor):
        self.requests.add(floor)

    def step(self):
        if not self.requests or self.state == ElevatorState.MAINTENANCE:
            self.direction = Direction.IDLE
            return
        target = self._next_stop()
        if target > self.current_floor:
            self.current_floor += 1; self.direction = Direction.UP
        elif target < self.current_floor:
            self.current_floor -= 1; self.direction = Direction.DOWN
        if self.current_floor in self.requests:
            print(f"Elevator {self.id} opening doors at floor {self.current_floor}")
            self.requests.remove(self.current_floor)

    def _next_stop(self):
        # SCAN: continue in current direction while requests exist
        if self.direction == Direction.UP:
            above = [f for f in self.requests if f >= self.current_floor]
            if above: return min(above)
        elif self.direction == Direction.DOWN:
            below = [f for f in self.requests if f <= self.current_floor]
            if below: return max(below)
        return min(self.requests, key=lambda f: abs(f - self.current_floor))

class ElevatorController:
    def __init__(self, elevators):
        self.elevators = elevators

    def request(self, floor, direction: Direction):
        # assign to elevator with fewest requests heading that way
        best = min(self.elevators, key=lambda e: len(e.requests))
        best.add_request(floor)
```

---

### 4. Rate Limiter (Token Bucket)

```python
import time
import threading

class TokenBucketRateLimiter:
    def __init__(self, capacity, refill_rate):
        self.capacity = capacity            # max tokens
        self.tokens = capacity
        self.refill_rate = refill_rate      # tokens per second
        self.last_refill = time.time()
        self.lock = threading.Lock()

    def _refill(self):
        now = time.time()
        elapsed = now - self.last_refill
        added = elapsed * self.refill_rate
        self.tokens = min(self.capacity, self.tokens + added)
        self.last_refill = now

    def allow(self):
        with self.lock:
            self._refill()
            if self.tokens >= 1:
                self.tokens -= 1
                return True
            return False                    # rate limit exceeded
```

---

### 5. In-Memory Key-Value Store (with TTL)

```python
import time
import threading

class KVStore:
    def __init__(self):
        self._store = {}                    # key → (value, expiry_time or None)
        self._lock = threading.RLock()

    def set(self, key, value, ttl=None):
        with self._lock:
            expiry = time.time() + ttl if ttl else None
            self._store[key] = (value, expiry)

    def get(self, key):
        with self._lock:
            if key not in self._store:
                return None
            value, expiry = self._store[key]
            if expiry and time.time() > expiry:
                del self._store[key]        # lazy expiry
                return None
            return value

    def delete(self, key):
        with self._lock:
            self._store.pop(key, None)
```

---

### 6. Pub/Sub Message Broker

```python
import threading
from collections import defaultdict

class MessageBroker:
    def __init__(self):
        self._topics = defaultdict(list)    # topic → list of subscriber queues
        self._lock = threading.Lock()

    def subscribe(self, topic):
        q = []
        with self._lock:
            self._topics[topic].append(q)
        return q                            # caller polls this list

    def publish(self, topic, message):
        with self._lock:
            subscribers = list(self._topics[topic])
        for q in subscribers:
            q.append(message)               # deliver to each subscriber
```

---

### 7. ATM (State Pattern)

**States:** `IdleState` → `CardInsertedState` → `PINEnteredState` → `TransactionState` → back to `IdleState`

```python
class ATMState:
    def insert_card(self, atm): pass
    def enter_pin(self, atm, pin): pass
    def select_amount(self, atm, amount): pass
    def eject_card(self, atm): pass

class IdleState(ATMState):
    def insert_card(self, atm):
        print("Card inserted")
        atm.state = CardInsertedState()
    def enter_pin(self, atm, pin): print("Insert card first")

class CardInsertedState(ATMState):
    def enter_pin(self, atm, pin):
        if atm.validate_pin(pin):
            print("PIN correct")
            atm.state = PINEnteredState()
        else:
            print("Wrong PIN")
    def eject_card(self, atm):
        print("Card ejected"); atm.state = IdleState()

class PINEnteredState(ATMState):
    def select_amount(self, atm, amount):
        if amount <= atm.balance:
            atm.balance -= amount
            print(f"Dispensing ${amount}")
            atm.state = IdleState()
        else:
            print("Insufficient funds")
    def eject_card(self, atm):
        print("Card ejected"); atm.state = IdleState()

class ATM:
    def __init__(self, balance):
        self.balance = balance
        self.state = IdleState()
        self._correct_pin = "1234"
    def validate_pin(self, pin): return pin == self._correct_pin
    def insert_card(self): self.state.insert_card(self)
    def enter_pin(self, pin): self.state.enter_pin(self, pin)
    def select_amount(self, amt): self.state.select_amount(self, amt)
    def eject_card(self): self.state.eject_card(self)
```

---

## Concurrency in LLD

Most LLD questions in senior interviews require thread-safe implementations.

| Situation | Tool |
|---|---|
| Single mutable value | `threading.Lock()` |
| Reentrant (same thread re-acquires) | `threading.RLock()` |
| Multiple readers, one writer | `threading.RLock()` with read/write tracking |
| Wait for condition | `threading.Condition()` |
| Producer-consumer queue | `queue.Queue()` (thread-safe built-in) |
| One-time initialization | Double-checked locking with `Lock` |
| Atomic counter | `threading.Lock()` around `+=` (Python GIL doesn't protect compound ops) |

**Thread-safe Singleton (double-checked locking):**

```python
import threading

class Config:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:           # fast path (no lock)
            with cls._lock:
                if cls._instance is None:   # slow path (with lock)
                    cls._instance = super().__new__(cls)
        return cls._instance
```

**Producer-Consumer (Blocking Queue):**

```python
import queue
import threading

class PrinterQueue:
    def __init__(self): self._q = queue.Queue(maxsize=10)

    def add_job(self, job):
        self._q.put(job)               # blocks if full

    def process(self):
        while True:
            job = self._q.get()        # blocks if empty
            print(f"Printing: {job}")
            self._q.task_done()
```

---

## Design Pattern Selector

| Problem shape | Pattern |
|---|---|
| One global instance | Singleton |
| Create objects without specifying exact class | Factory / Abstract Factory |
| Build complex objects step by step | Builder |
| Add behaviour without changing class | Decorator |
| Tree of objects, treat uniformly | Composite |
| One change notifies many | Observer |
| Swap algorithms at runtime | Strategy |
| Object changes behaviour with state | State |
| Encapsulate request, support undo | Command |
| Common algorithm skeleton, steps vary | Template Method |
| Simplify complex subsystem | Facade |
| Incompatible interfaces | Adapter |
| Expensive object recreation | Flyweight / Object Pool |

---

## LLD Interview Cheat Sheet

| Question | Core Pattern | Key Classes |
|---|---|---|
| LRU Cache | HashMap + DLL | `Node`, `LRUCache` |
| Parking Lot | Inheritance + Strategy | `Vehicle`, `Spot`, `Ticket`, `ParkingLot` |
| Elevator | State + Strategy (SCAN) | `Elevator`, `ElevatorController`, `Direction` |
| Vending Machine | State | `IdleState`, `HasCoinState`, `EmptyState` |
| ATM | State | `IdleState`, `CardInsertedState`, `PINEnteredState` |
| Rate Limiter | Strategy + Lock | `TokenBucketRateLimiter`, `SlidingWindowLimiter` |
| In-Memory KV Store | Lock + lazy TTL | `KVStore` |
| Pub/Sub Broker | Observer | `MessageBroker`, subscribers |
| Text Editor (undo) | Command | `Command`, `InsertCommand`, `CommandHistory` |
| Notification System | Factory + Observer | `NotificationFactory`, `EmailNotification`, `SMSNotification` |
| File System | Composite | `File`, `Directory (FileSystemItem)` |
| Coffee / Pizza (add-ons) | Decorator | `BaseCoffee`, `MilkDecorator`, `SugarDecorator` |
