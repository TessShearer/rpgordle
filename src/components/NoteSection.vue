<template>
  <div class="note-section">
    <h3 class="note-section-title">{{ title }}</h3>
    <div class="note-input-row">
      <input
        class="note-input"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="loading"
        @input="$emit('update:modelValue', $event.target.value)"
        @keydown.enter="$emit('add')"
      />
      <button
        class="btn btn-press note-add-btn"
        :disabled="loading || !modelValue?.trim()"
        @click="$emit('add')"
      >{{ loading ? '…' : 'Add Note' }}</button>
    </div>
    <div v-if="notes.length" class="notes-list" :class="{ 'notes-list--2col': columns === 2 }">
      <div v-for="note in notes" :key="note.id" class="note-item">
        <span class="note-text">{{ note.text }}</span>
        <button class="note-delete-btn" title="Delete note" @click="$emit('delete', note.id)">✕</button>
      </div>
    </div>
    <p v-else class="notes-empty">No notes yet.</p>
  </div>
</template>

<script setup>
defineProps({
  title:       String,
  notes:       Array,
  loading:     Boolean,
  modelValue:  String,
  placeholder: { type: String, default: 'Add a note...' },
  columns:     { type: Number, default: 1 },
})
defineEmits(['update:modelValue', 'add', 'delete'])
</script>
