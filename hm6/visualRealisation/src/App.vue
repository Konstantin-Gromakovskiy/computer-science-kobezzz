<script setup lang="ts">
import { computed, ref, shallowRef } from "vue";
import {
  CircularBuffer,
  type CircularBufferSnapshot,
} from "../../circularBuffer";

type Operation = "push" | "unshift" | "pop" | "shift" | "reset";

interface RingNode {
  index: number;
  value: number;
  x: number;
  y: number;
  occupied: boolean;
  isStart: boolean;
  isEnd: boolean;
  isChanged: boolean;
}

const INITIAL_CAPACITY = 8;

const capacityInput = ref(INITIAL_CAPACITY);
const valueInput = ref(1);
const errorMessage = ref("");
const statusMessage = ref("Буфер готов к работе.");
const lastAction = ref<Operation>("reset");
const changedIndexes = ref<number[]>([]);

const buffer = shallowRef(createBuffer(INITIAL_CAPACITY));
const snapshot = ref(buffer.value.snapshot());

function createBuffer(capacity: number) {
  return new CircularBuffer(capacity);
}

function positiveInteger(value: number) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("capacity must be a positive integer");
  }

  return value;
}

function refreshSnapshot(
  action: Operation,
  previous: CircularBufferSnapshot,
  nextStatus: string,
) {
  const next = buffer.value.snapshot();
  snapshot.value = next;
  changedIndexes.value = findChangedIndexes(previous, next, action);
  lastAction.value = action;
  errorMessage.value = "";
  statusMessage.value = nextStatus;
}

function findChangedIndexes(
  previous: CircularBufferSnapshot,
  next: CircularBufferSnapshot,
  action: Operation,
) {
  if (action === "reset") {
    return next.buffer.map((_, index) => index);
  }

  const changes = new Set<number>();

  for (let index = 0; index < next.buffer.length; index += 1) {
    if (previous.buffer[index] !== next.buffer[index]) {
      changes.add(index);
    }
  }

  if (previous.start !== next.start) {
    changes.add(previous.start);
    changes.add(next.start);
  }

  if (previous.end !== next.end) {
    changes.add(previous.end);
    changes.add(next.end);
  }

  return [...changes];
}

function execute(action: Operation) {
  const previous = snapshot.value;

  try {
    if (action === "push") {
      buffer.value.push(valueInput.value);
      refreshSnapshot(action, previous, `push(${valueInput.value})`);
      valueInput.value += 1;
      return;
    }

    if (action === "unshift") {
      buffer.value.unshift(valueInput.value);
      refreshSnapshot(action, previous, `unshift(${valueInput.value})`);
      valueInput.value += 1;
      return;
    }

    if (action === "pop") {
      const removed = buffer.value.pop();
      refreshSnapshot(action, previous, `pop() -> ${removed}`);
      return;
    }

    const removed = buffer.value.shift();
    refreshSnapshot(action, previous, `shift() -> ${removed}`);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "unknown buffer error";
  }
}

function resetBuffer() {
  try {
    const nextCapacity = positiveInteger(capacityInput.value);
    buffer.value = createBuffer(nextCapacity);
    refreshSnapshot("reset", snapshot.value, `Новый буфер на ${nextCapacity} ячеек.`);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "cannot reset buffer";
  }
}

const isEmpty = computed(() => snapshot.value.length === 0);
const isFull = computed(() => snapshot.value.length === snapshot.value.capacity);

const nodeSize = computed(() => {
  const { capacity } = snapshot.value;

  if (capacity <= 6) return 90;
  if (capacity <= 10) return 78;
  if (capacity <= 14) return 66;
  return 58;
});

const ringDiameter = computed(() => {
  const candidate = 420 + snapshot.value.capacity * 12;
  return Math.min(660, Math.max(460, candidate));
});

const ringNodes = computed<RingNode[]>(() => {
  const { buffer: cells, occupiedIndexes, start, end } = snapshot.value;
  const occupied = new Set(occupiedIndexes);
  const animated = new Set(changedIndexes.value);
  const center = ringDiameter.value / 2;
  const radius = ringDiameter.value / 2 - nodeSize.value / 2 - 24;

  return cells.map((value, index) => {
    const angle = ((index / cells.length) * Math.PI * 2) - Math.PI / 2;
    const x = center + Math.cos(angle) * radius - nodeSize.value / 2;
    const y = center + Math.sin(angle) * radius - nodeSize.value / 2;

    return {
      index,
      value,
      x,
      y,
      occupied: occupied.has(index),
      isStart: start === index,
      isEnd: end === index,
      isChanged: animated.has(index),
    };
  });
});

const logicalEntries = computed(() =>
  snapshot.value.logical.map((value, logicalIndex) => ({
    logicalIndex,
    physicalIndex: snapshot.value.occupiedIndexes[logicalIndex],
    value,
  })),
);

const progress = computed(() =>
  `${snapshot.value.length} / ${snapshot.value.capacity}`,
);
</script>

<template>
  <main class="layout">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Circular Buffer Visualisation</p>
        <h1>Кольцевой буфер как живое кольцо</h1>
        <p class="lead">
          Алгоритм остаётся в
          <code>circularBuffer.ts</code>, а интерфейс только вызывает его методы и
          показывает снимок состояния после каждой операции.
        </p>
      </div>

      <div class="hero-card">
        <div class="hero-stat">
          <span>Последняя операция</span>
          <strong>{{ lastAction }}</strong>
        </div>
        <div class="hero-stat">
          <span>Заполнение</span>
          <strong>{{ progress }}</strong>
        </div>
        <div class="hero-stat">
          <span>Логический порядок</span>
          <strong>{{ snapshot.logical.join(" -> ") || "пусто" }}</strong>
        </div>
      </div>
    </section>

    <section class="controls card">
      <div class="control-grid">
        <label class="field">
          <span>Размер буфера</span>
          <input v-model.number="capacityInput" type="number" min="1" step="1" />
        </label>

        <label class="field">
          <span>Следующее значение</span>
          <input v-model.number="valueInput" type="number" step="1" />
        </label>

        <button class="button ghost" type="button" @click="resetBuffer">
          Reset buffer
        </button>
      </div>

      <div class="action-row">
        <button class="button accent" type="button" :disabled="isFull" @click="execute('push')">
          push
        </button>
        <button class="button accent" type="button" :disabled="isFull" @click="execute('unshift')">
          unshift
        </button>
        <button class="button" type="button" :disabled="isEmpty" @click="execute('pop')">
          pop
        </button>
        <button class="button" type="button" :disabled="isEmpty" @click="execute('shift')">
          shift
        </button>
      </div>

      <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
      <p v-else class="message status">{{ statusMessage }}</p>
    </section>

    <section class="visual-grid">
      <section class="card ring-panel">
        <div
          class="ring"
          :style="{
            width: `${ringDiameter}px`,
            height: `${ringDiameter}px`,
          }"
        >
          <div class="ring-track"></div>

          <div class="ring-core">
            <span>start: {{ snapshot.start }}</span>
            <span>end: {{ snapshot.end }}</span>
            <strong>{{ progress }}</strong>
          </div>

          <article
            v-for="node in ringNodes"
            :key="node.index"
            class="ring-node"
            :class="{
              occupied: node.occupied,
              start: node.isStart,
              end: node.isEnd,
              changed: node.isChanged,
            }"
            :style="{
              width: `${nodeSize}px`,
              height: `${nodeSize}px`,
              left: `${node.x}px`,
              top: `${node.y}px`,
            }"
          >
            <span class="physical-index">#{{ node.index }}</span>
            <strong>{{ node.occupied ? node.value : "·" }}</strong>
            <div class="badges">
              <span v-if="node.isStart" class="badge">start</span>
              <span v-if="node.isEnd" class="badge end-badge">end</span>
            </div>
          </article>
        </div>
      </section>

      <section class="card data-panel">
        <div class="panel-heading">
          <h2>Логический порядок</h2>
          <p>То, что возвращает буфер при обходе от <code>start</code>.</p>
        </div>

        <div class="logical-list">
          <div
            v-for="entry in logicalEntries"
            :key="entry.logicalIndex"
            class="logical-chip"
          >
            <span>L{{ entry.logicalIndex }}</span>
            <strong>{{ entry.value }}</strong>
            <small>buffer[{{ entry.physicalIndex }}]</small>
          </div>

          <p v-if="logicalEntries.length === 0" class="empty-hint">
            Буфер пуст. Добавьте элементы через <code>push</code> или
            <code>unshift</code>.
          </p>
        </div>

        <div class="panel-heading">
          <h2>Физический массив</h2>
          <p>Каждая ячейка соответствует внутреннему массиву из snapshot.</p>
        </div>

        <div class="physical-grid">
          <div
            v-for="(item, index) in snapshot.buffer"
            :key="`physical-${index}`"
            class="physical-cell"
            :class="{
              occupied: snapshot.occupiedIndexes.includes(index),
              changed: changedIndexes.includes(index),
            }"
          >
            <span>{{ index }}</span>
            <strong>{{ item }}</strong>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>
