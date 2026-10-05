<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface WordItem {
  id: number
  text: string
  isHidden: boolean
  isRevealed: boolean
  lineIndex: number
}

const presets = [
  {
    title: 'อิติปิโส (พุทธคุณ)',
    text: 'อิติปิ โส ภะคะวา อะระหัง สัมมาสัมพุทโธ วิชชาจะระณะสัมปันโน สุคะโต โลกะวิทู อะนุตตะโร ปุริสะทัมมะสาระถิ สัตถา เทวะมะนุสสานัง พุทโธ ภะคะวาติ'
  },
  {
    title: 'พาหุง (ท่อนแรก)',
    text: 'พาหุง สะหัสสะมะภินิมมิตะสาวุธันตัง ครีเมขะลัง อุทิตะโฆระสะเสนะมารัง ทานาทิธัมมะวิธินา ชิตะวา มุนินโท ตันเตชะสา ภะวะตุ เต ชะยะมังคะลานิ'
  },
  {
    title: 'ชินบัญชร (ย่อ)',
    text: 'ชินะปัญชะระปะริตตัง มัง รักขะตุ สัพพะทา'
  }
]

const initialPreset = presets[0] ?? { title: '', text: '' }
const inputText = ref<string>(initialPreset.text)
const processedWords = ref<WordItem[]>([])
const currentRatio = ref<number>(0.5)

// ขนาดฟอนต์เริ่มต้น (1.5rem)
const fontSize = ref<number>(1.5)

// ดัชนีคำซ่อนปัจจุบัน
const activeHiddenIndex = ref<number>(-1)

// คำซ่อนทั้งหมด
const hiddenWords = computed(() => processedWords.value.filter(w => w.isHidden))

// ปรับขนาดฟอนต์
const changeFontSize = (delta: number) => {
  const newSize = fontSize.value + delta
  if (newSize >= 1.1 && newSize <= 2.5) {
    fontSize.value = Number(newSize.toFixed(1))
  }
}

// สุ่มซ่อนคำ
const generateTest = (hideRatio: number): void => {
  if (!inputText.value.trim()) return
  currentRatio.value = hideRatio

  const rawWords = inputText.value.trim().split(/\s+/)
  let currentLine = 0
  let wordsInLine = 0

  processedWords.value = rawWords.map((word, index) => {
    const shouldHide = Math.random() < hideRatio

    if (wordsInLine >= 8) {
      currentLine++
      wordsInLine = 0
    }
    wordsInLine++

    return {
      id: index,
      text: word,
      isHidden: shouldHide,
      isRevealed: false,
      lineIndex: currentLine
    }
  })

  activeHiddenIndex.value = hiddenWords.value.length > 0 ? 0 : -1
}

// คลิกเปิด/ปิด คำซ่อน
const toggleWord = (wordObj: WordItem) => {
  if (wordObj.isHidden) {
    wordObj.isRevealed = !wordObj.isRevealed
    const idx = hiddenWords.value.findIndex(w => w.id === wordObj.id)
    if (idx !== -1) activeHiddenIndex.value = idx
  }
}

// เปิด/ปิด เฉลยทั้งหมด
const toggleAll = (reveal: boolean) => {
  processedWords.value.forEach(w => {
    if (w.isHidden) w.isRevealed = reveal
  })
}

// ย้าย Cursor และ Auto เปิดเฉลย
const moveFocusAndAutoReveal = (newIndex: number) => {
  if (newIndex >= 0 && newIndex < hiddenWords.value.length) {
    activeHiddenIndex.value = newIndex
    const nextWord = hiddenWords.value[newIndex]
    if (nextWord) nextWord.isRevealed = true
  }
}

// คีย์บอร์ดคอนโทรล
const handleKeyDown = (event: KeyboardEvent) => {
  if (hiddenWords.value.length === 0) return

  const target = event.target as HTMLElement
  if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) return

  // Shift + C: สลับเปิด/ปิดทั้งแถวปัจจุบัน
  if (event.shiftKey && (event.key === 'C' || event.key === 'c' || event.key === 'ฉ')) {
    event.preventDefault()
    if (activeHiddenIndex.value >= 0 && activeHiddenIndex.value < hiddenWords.value.length) {
      const activeWord = hiddenWords.value[activeHiddenIndex.value]
      const currentLine = activeWord?.lineIndex ?? -1

      const lineWords = processedWords.value.filter(w => w.isHidden && w.lineIndex === currentLine)
      const isAnyUnrevealed = lineWords.some(w => !w.isRevealed)

      lineWords.forEach(w => {
        w.isRevealed = isAnyUnrevealed
      })
    }
    return
  }

  // ลูกศรขวา / ลง
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    moveFocusAndAutoReveal(activeHiddenIndex.value + 1)
    return
  }

  // ลูกศรซ้าย / ขึ้น
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault()
    moveFocusAndAutoReveal(activeHiddenIndex.value - 1)
    return
  }
}

const selectPreset = (text: string) => {
  inputText.value = text
  generateTest(currentRatio.value)
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  generateTest(0.5)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="gemini-app font-sarabun">
    
    <!-- Top Header -->
    <header class="app-header">
      <div class="brand">
        <span class="sparkle-icon">✨</span>
        <h1 class="title">บาลีฝึกท่องจำ</h1>
      </div>

      <!-- Tools: ปรับขนาดตัวหนังสือ -->
      <div class="font-controls">
        <span class="tool-label">ขนาดอักษร:</span>
        <button @click="changeFontSize(-0.1)" class="btn-tool" title="ลดขนาด">A-</button>
        <span class="font-indicator">{{ Math.round((fontSize / 1.5) * 100) }}%</span>
        <button @click="changeFontSize(0.1)" class="btn-tool" title="เพิ่มขนาด">A+</button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      
      <!-- Control Panel สไตล์ Notion -->
      <section class="control-card">
        <div class="preset-row">
          <span class="label">บทสวด:</span>
          <div class="preset-pills">
            <button 
              v-for="p in presets" 
              :key="p.title"
              @click="selectPreset(p.text)"
              class="pill-btn"
            >
              {{ p.title }}
            </button>
          </div>
        </div>

        <textarea
          v-model="inputText"
          rows="2"
          class="notion-input"
          placeholder="พิมพ์หรือวางบทสวดบาลี..."
        ></textarea>

        <div class="action-row">
          <div class="diff-group">
            <span class="label">ระดับซ่อน:</span>
            <button @click="generateTest(0.25)" class="btn-diff">25%</button>
            <button @click="generateTest(0.50)" class="btn-diff">50%</button>
            <button @click="generateTest(0.75)" class="btn-diff">75%</button>
            <button @click="generateTest(1.00)" class="btn-diff dark">100%</button>
          </div>

          <div class="toggle-group">
            <button @click="toggleAll(true)" class="btn-ghost">👁️ เฉลยหมด</button>
            <button @click="toggleAll(false)" class="btn-ghost">🙈 ซ่อนหมด</button>
          </div>
        </div>
      </section>

      <!-- Display Canvas หน้าอ่านสไตล์ Gemini -->
      <article class="reader-canvas">
        <template v-if="processedWords.length > 0">
          <div 
            class="reading-content"
            :style="{ fontSize: `${fontSize}rem` }"
          >
            <span
              v-for="item in processedWords"
              :key="item.id"
              class="word-wrap"
            >
              <!-- คำที่ถูกซ่อน -->
              <span
                v-if="item.isHidden"
                @click="toggleWord(item)"
                class="hidden-slot"
                :class="{
                  'is-revealed': item.isRevealed,
                  'is-active': hiddenWords[activeHiddenIndex]?.id === item.id
                }"
              >
                <!-- ข้อความจริงที่จะแสดงเมื่อ Hover หรือคลิกเปิด -->
                <span class="slot-text">{{ item.text }}</span>
              </span>

              <!-- คำปกติ -->
              <span v-else class="plain-word">{{ item.text }}</span>
            </span>
          </div>
        </template>

        <div v-else class="empty-state">
          <p>เลือกบทสวดมนต์ด้านบนเพื่อเริ่มฝึกท่องจำ</p>
        </div>
      </article>

    </main>

    <!-- Footer Shortcuts Bar -->
    <footer class="app-footer">
      <span>💡 <b>คีย์บอร์ด:</b> กดปุ่มลูกศร <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> เพื่อเลื่อนและ Auto เปิดเฉลย | <kbd>Shift</kbd> + <kbd>C</kbd> สลับเปิด/ปิดทั้งแถว</span>
    </footer>

  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=TH+Sarabun+New:ital,wght@0,400;0,700;1,400;1,700&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #f8f9fa;
  color: #1f1f1f;
}

#app {
  width: 100%;
  height: 100%;
  max-width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  display: block !important;
}

.font-sarabun {
  font-family: 'TH Sarabun New', sans-serif;
}

.gemini-app {
  width: 100vw;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 1rem 1.5rem;
  background-color: #f8f9fa;
}

/* Header */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e3e3e3;
  margin-bottom: 0.75rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sparkle-icon {
  font-size: 1.5rem;
}

.title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f1f1f;
}

.font-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  border: 1px solid #e3e3e3;
  font-size: 1.1rem;
}

.tool-label {
  color: #666;
}

.btn-tool {
  background: #f1f3f4;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-tool:hover {
  background: #e2e7eb;
}

.font-indicator {
  font-size: 1.1rem;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

/* Main Workspace */
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
}

/* Control Card Notion Style */
.control-card {
  background: #ffffff;
  border: 1px solid #e3e3e3;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.preset-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.label {
  font-size: 1.2rem;
  font-weight: 600;
  color: #444746;
}

.preset-pills {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.pill-btn {
  background: #f1f3f4;
  border: none;
  color: #3c4043;
  padding: 0.2rem 0.65rem;
  border-radius: 16px;
  font-size: 1.15rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pill-btn:hover {
  background: #e8eaed;
  color: #1f1f1f;
}

.notion-input {
  width: 100%;
  padding: 0.4rem 0.65rem;
  border: 1px solid #e3e3e3;
  border-radius: 8px;
  font-size: 1.25rem;
  font-family: inherit;
  background: #f8f9fa;
  color: #1f1f1f;
  outline: none;
  resize: none;
}

.notion-input:focus {
  border-color: #0b57d0;
  background: #ffffff;
}

.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.diff-group, .toggle-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.btn-diff {
  background: #ffffff;
  border: 1px solid #e3e3e3;
  color: #444746;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 1.1rem;
  cursor: pointer;
}

.btn-diff:hover, .btn-diff.dark {
  background: #0b57d0;
  color: #ffffff;
  border-color: #0b57d0;
}

.btn-ghost {
  background: transparent;
  border: none;
  color: #0b57d0;
  font-size: 1.15rem;
  cursor: pointer;
  padding: 0 0.25rem;
}

.btn-ghost:hover {
  text-decoration: underline;
}

/* Reader Canvas */
.reader-canvas {
  flex: 1;
  background: #ffffff;
  border: 1px solid #e3e3e3;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  overflow-y: auto;
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
}

.reading-content {
  line-height: 2.2;
  color: #1f1f1f;
  transition: font-size 0.2s ease;
}

.word-wrap {
  display: inline-block;
  margin-right: 0.6rem;
}

.plain-word {
  color: #1f1f1f;
}

/* ซ่อนคำด้วยเส้นประแทนกล่อง เพื่อคงความสูงบรรทัดให้เท่าข้อความ */
.hidden-slot {
  display: inline;
  position: relative;
  padding: 0;
  margin: 0 0.08rem;
  border-bottom: 2px dashed #9aa4b2;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.18s ease;
}

.hidden-slot .slot-text {
  opacity: 0;
  visibility: hidden;
  color: #0d4bbf;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  transition: opacity 0.18s ease;
}

.hidden-slot:hover {
  border-color: #1f5fe8;
  border-bottom-style: solid;
}

.hidden-slot:hover .slot-text {
  opacity: 1;
  visibility: visible;
}

.hidden-slot.is-revealed {
  border-color: #8ab4f8;
  border-bottom-style: solid;
}

.hidden-slot.is-revealed .slot-text {
  opacity: 1;
  visibility: visible;
}

.hidden-slot.is-active {
  border-color: #1f5fe8;
  border-bottom-style: solid;
}

.empty-state {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #70757a;
  font-size: 1.4rem;
}

/* Footer Bar */
.app-footer {
  text-align: center;
  padding-top: 0.5rem;
  font-size: 1.1rem;
  color: #5f6368;
}

kbd {
  background: #f1f3f4;
  border: 1px solid #dadce0;
  border-radius: 4px;
  padding: 0.05rem 0.3rem;
  font-family: monospace;
  font-size: 0.95rem;
}
</style>
