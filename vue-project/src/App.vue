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
    text: 'พาหุง สะหัสสะมะภินิมมิตะสาวุธันตัง\nครีเมขะลัง อุทิตะโฆระสะเสนะมารัง\nทานาทิธัมมะวิธินา ชิตะวา มุนินโท\nตันเตชะสา ภะวะตุ เต ชะยะมังคะลานิ'
  },
  {
    title: 'ชินบัญชร (ย่อ)',
    text: 'ชินะปัญชะระปะริตตัง\nมัง รักขะตุ สัพพะทา'
  }
]

const initialPreset = presets[0] ?? { title: '', text: '' }
const inputText = ref<string>(initialPreset.text)
const processedWords = ref<WordItem[]>([])
const currentRatio = ref<number>(0.5)
const fontSize = ref<number>(1.5)
const activeHiddenIndex = ref<number>(-1)

const hiddenWords = computed(() => processedWords.value.filter(w => w.isHidden))

const groupedLines = computed(() => {
  const map = new Map<number, WordItem[]>()
  processedWords.value.forEach(w => {
    if (!map.has(w.lineIndex)) map.set(w.lineIndex, [])
    map.get(w.lineIndex)!.push(w)
  })
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([lineIndex, words]) => ({ lineIndex, words }))
})

const changeFontSize = (delta: number) => {
  const newSize = fontSize.value + delta
  if (newSize >= 1.1 && newSize <= 2.5) {
    fontSize.value = Number(newSize.toFixed(1))
  }
}

const generateTest = (hideRatio: number): void => {
  if (!inputText.value.trim()) return
  currentRatio.value = hideRatio

  const rawLines = inputText.value.split('\n')
  const items: WordItem[] = []
  let id = 0

  rawLines.forEach((line, lineIdx) => {
    const words = line.trim().split(/\s+/).filter(w => w.length > 0)
    words.forEach(word => {
      items.push({
        id: id++,
        text: word,
        isHidden: Math.random() < hideRatio,
        isRevealed: false,
        lineIndex: lineIdx
      })
    })
  })

  processedWords.value = items
  activeHiddenIndex.value = hiddenWords.value.length > 0 ? 0 : -1
}

const toggleWord = (wordObj: WordItem) => {
  if (wordObj.isHidden) {
    wordObj.isRevealed = !wordObj.isRevealed
    const idx = hiddenWords.value.findIndex(w => w.id === wordObj.id)
    if (idx !== -1) activeHiddenIndex.value = idx
  }
}

const toggleAll = (reveal: boolean) => {
  processedWords.value.forEach(w => {
    if (w.isHidden) w.isRevealed = reveal
  })
}

// ปิดคำที่เปิดไว้ล่าสุด (ถอยหลังทีละคำ)
const undoReveal = () => {
  let lastRevealedIdx = -1
  for (let i = hiddenWords.value.length - 1; i >= 0; i--) {
    if (hiddenWords.value[i]?.isRevealed) {
      lastRevealedIdx = i
      break
    }
  }
  if (lastRevealedIdx !== -1) {
    const word = hiddenWords.value[lastRevealedIdx]
    if (word) word.isRevealed = false
    activeHiddenIndex.value = lastRevealedIdx
  }
}

const moveFocusAndAutoReveal = (newIndex: number) => {
  if (newIndex >= 0 && newIndex < hiddenWords.value.length) {
    activeHiddenIndex.value = newIndex
    const nextWord = hiddenWords.value[newIndex]
    if (nextWord) nextWord.isRevealed = true
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (hiddenWords.value.length === 0) return

  const target = event.target as HTMLElement
  if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) return

    // Shift + C: toggle เปิด/ปิดทั้งหมด
  if (event.shiftKey && (event.key === 'C' || event.key === 'c' || event.key === 'ฉ')) {
    event.preventDefault()
    const allRevealed = hiddenWords.value.every(w => w.isRevealed)
    toggleAll(!allRevealed)
    return
  }

  // Delete / Backspace: ปิดคำที่เปิดไว้ล่าสุด ถอยหลังทีละคำ
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    undoReveal()
    return
  }

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    moveFocusAndAutoReveal(activeHiddenIndex.value + 1)
    return
  }

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

// ============ Export เป็นไฟล์ HTML แบบออฟไลน์ ============
const exportHTML = () => {
  if (processedWords.value.length === 0) return

  const wordsData = processedWords.value.map(w => ({
    text: w.text,
    isHidden: w.isHidden,
    isRevealed: w.isRevealed,
    lineIndex: w.lineIndex
  }))
  const wordsJson = JSON.stringify(wordsData)
  const initialFontSize = fontSize.value

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>บาลีฝึกท่องจำ</title>
<style>
  :root { --font-size: ${initialFontSize}rem; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'TH Sarabun New', 'Sarabun', 'Leelawadee UI', 'Tahoma', sans-serif;
    background: #f8f9fa; color: #1f1f1f; padding: 2rem 1rem;
    min-height: 100vh;
  }
  .container {
    max-width: 1200px; margin: 0 auto; background: #fff;
    border-radius: 12px; padding: 2rem 3rem;
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  }
  h1 { font-size: 1.8rem; margin-bottom: 1rem; font-weight: 700; }
  .toolbar {
    display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;
    margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e3e3e3;
  }
  .toolbar button {
    background: #f1f3f4; border: none; padding: 0.35rem 0.8rem;
    border-radius: 8px; cursor: pointer; font-family: inherit;
    font-size: 1rem; transition: background 0.2s;
  }
  .toolbar button:hover { background: #e2e7eb; }
  .toolbar .font-label {
    padding: 0.35rem 0.5rem; font-size: 1rem; color: #444;
    min-width: 3.5rem; text-align: center;
  }
  .content {
    line-height: 2.2; font-size: var(--font-size);
    transition: font-size 0.2s ease;
  }
  .line { margin-bottom: 0.25rem; }
  .word { display: inline-block; margin-right: 0.6rem; }
  .hidden-slot {
    display: inline; position: relative;
    border-bottom: 2px dashed #9aa4b2;
    cursor: pointer; user-select: none;
    transition: border-color 0.18s ease;
  }
  .hidden-slot .slot-text {
    opacity: 0; visibility: hidden;
    color: #0d4bbf; font-weight: 700; letter-spacing: 0.02em;
    white-space: nowrap; transition: opacity 0.18s ease;
  }
  .hidden-slot:hover { border-color: #1f5fe8; border-bottom-style: solid; }
  .hidden-slot:hover .slot-text { opacity: 1; visibility: visible; }
  .hidden-slot.is-revealed { border-color: #8ab4f8; border-bottom-style: solid; }
  .hidden-slot.is-revealed .slot-text { opacity: 1; visibility: visible; }
  .hidden-slot.is-active { border-color: #1f5fe8; border-bottom-style: solid; }
  .footer {
    margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e3e3e3;
    font-size: 0.95rem; color: #5f6368; text-align: center;
  }
  kbd {
    background: #f1f3f4; border: 1px solid #dadce0; border-radius: 4px;
    padding: 0.05rem 0.3rem; font-family: monospace; font-size: 0.9em;
  }
</style>
</head>
<body>
<div class="container">
  <h1>✨ บาลีฝึกท่องจำ</h1>
  <div class="toolbar">
    <button onclick="revealAll(true)">👁️ เฉลยหมด</button>
    <button onclick="revealAll(false)">🙈 ซ่อนหมด</button>
    <button onclick="undoReveal()">⌫ ปิดคำล่าสุด</button>
    <button onclick="changeFont(-0.1)">A-</button>
    <span class="font-label" id="fontLabel">100%</span>
    <button onclick="changeFont(0.1)">A+</button>
  </div>
  <div class="content" id="content"></div>
  <div class="footer">
    💡 <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> เลื่อน + Auto เปิดเฉลย |
    <kbd>Delete</kbd> / <kbd>Backspace</kbd> ปิดคำล่าสุดถอยหลังทีละคำ |
    <kbd>Shift</kbd>+<kbd>C</kbd> ปิดคำที่เปิดทั้งหมด
  </div>
</div>
<script>
(function() {
  var words = ${wordsJson};
  var baseFontSize = ${initialFontSize};
  var currentFontSize = baseFontSize;
  var activeIndex = -1;
  var hiddenWords = words.filter(function(w) { return w.isHidden; });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function render() {
    var byLine = new Map();
    words.forEach(function(w) {
      if (!byLine.has(w.lineIndex)) byLine.set(w.lineIndex, []);
      byLine.get(w.lineIndex).push(w);
    });
    var container = document.getElementById('content');
    container.innerHTML = '';
    Array.from(byLine.keys()).sort(function(a, b) { return a - b; }).forEach(function(lineIdx) {
      var lineEl = document.createElement('div');
      lineEl.className = 'line';
      byLine.get(lineIdx).forEach(function(w) {
        var wrap = document.createElement('span');
        wrap.className = 'word';
        if (w.isHidden) {
          var slot = document.createElement('span');
          var isActive = activeIndex >= 0 && hiddenWords[activeIndex] === w;
          slot.className = 'hidden-slot'
            + (w.isRevealed ? ' is-revealed' : '')
            + (isActive ? ' is-active' : '');
          slot.innerHTML = '<span class="slot-text">' + escapeHtml(w.text) + '</span>';
          slot.addEventListener('click', function() {
            w.isRevealed = !w.isRevealed;
            var i = hiddenWords.indexOf(w);
            if (i >= 0) activeIndex = i;
            render();
          });
          wrap.appendChild(slot);
        } else {
          var p = document.createElement('span');
          p.textContent = w.text;
          wrap.appendChild(p);
        }
        lineEl.appendChild(wrap);
      });
      container.appendChild(lineEl);
    });
  }

  window.revealAll = function(reveal) {
    words.forEach(function(w) { if (w.isHidden) w.isRevealed = reveal; });
    render();
  };

  window.undoReveal = function() {
    var lastRevealedIdx = -1;
    for (var i = hiddenWords.length - 1; i >= 0; i--) {
      if (hiddenWords[i].isRevealed) { lastRevealedIdx = i; break; }
    }
    if (lastRevealedIdx !== -1) {
      hiddenWords[lastRevealedIdx].isRevealed = false;
      activeIndex = lastRevealedIdx;
      render();
    }
  };

  window.changeFont = function(delta) {
    var next = Math.round((currentFontSize + delta) * 10) / 10;
    if (next >= 1.1 && next <= 2.5) {
      currentFontSize = next;
      document.documentElement.style.setProperty('--font-size', currentFontSize + 'rem');
      document.getElementById('fontLabel').textContent =
        Math.round((currentFontSize / 1.5) * 100) + '%';
    }
  };

  document.addEventListener('keydown', function(e) {
    if (hiddenWords.length === 0) return;
        // Shift+C: toggle เปิด/ปิดทั้งหมด
    if (e.shiftKey && (e.key === 'C' || e.key === 'c' || e.key === 'ฉ')) {
      e.preventDefault();
      var allRevealed = hiddenWords.every(function(w) { return w.isRevealed; });
      window.revealAll(!allRevealed);
      return;
    }
    // Delete / Backspace: ปิดคำล่าสุดถอยหลังทีละคำ
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      window.undoReveal();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeIndex + 1 < hiddenWords.length) {
        activeIndex++;
        hiddenWords[activeIndex].isRevealed = true;
        render();
      }
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeIndex - 1 >= 0) {
        activeIndex--;
        hiddenWords[activeIndex].isRevealed = true;
        render();
      }
      return;
    }
  });

  document.getElementById('fontLabel').textContent =
    Math.round((currentFontSize / 1.5) * 100) + '%';
  render();
})();
<\/script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bali-practice-${Date.now()}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
    <header class="app-header">
      <div class="brand">
        <span class="sparkle-icon">✨</span>
        <h1 class="title">บาลีฝึกท่องจำ</h1>
      </div>

      <div class="header-right">
        <button @click="exportHTML" class="btn-export" title="ดาวน์โหลดไฟล์ HTML สำหรับฝึกออฟไลน์">
          ⬇️ Export HTML
        </button>

        <div class="font-controls">
          <span class="tool-label">ขนาดอักษร:</span>
          <button @click="changeFontSize(-0.1)" class="btn-tool" title="ลดขนาด">A-</button>
          <span class="font-indicator">{{ Math.round((fontSize / 1.5) * 100) }}%</span>
          <button @click="changeFontSize(0.1)" class="btn-tool" title="เพิ่มขนาด">A+</button>
        </div>
      </div>
    </header>

    <main class="app-main">
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
          rows="3"
          class="notion-input"
          placeholder="พิมพ์หรือวางบทสวดบาลี... (ขึ้นบรรทัดใหม่ได้ตามต้องการ)"
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
            <button @click="undoReveal" class="btn-ghost" title="ปิดคำที่เปิดไว้ล่าสุด (ถอยหลังทีละคำ)">⌫ ปิดคำล่าสุด</button>
          </div>
        </div>
      </section>

      <article class="reader-canvas">
        <template v-if="groupedLines.length > 0">
          <div
            class="reading-content"
            :style="{ fontSize: `${fontSize}rem` }"
          >
            <div
              v-for="line in groupedLines"
              :key="line.lineIndex"
              class="reading-line"
            >
              <span
                v-for="item in line.words"
                :key="item.id"
                class="word-wrap"
              >
                <span
                  v-if="item.isHidden"
                  @click="toggleWord(item)"
                  class="hidden-slot"
                  :class="{
                    'is-revealed': item.isRevealed,
                    'is-active': hiddenWords[activeHiddenIndex]?.id === item.id
                  }"
                >
                  <span class="slot-text">{{ item.text }}</span>
                </span>
                <span v-else class="plain-word">{{ item.text }}</span>
              </span>
            </div>
          </div>
        </template>

        <div v-else class="empty-state">
          <p>เลือกบทสวดมนต์ด้านบนเพื่อเริ่มฝึกท่องจำ</p>
        </div>
      </article>
    </main>

    <footer class="app-footer">
      <span>
        💡 <b>คีย์บอร์ด:</b>
        <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> เลื่อน + Auto เปิดเฉลย |
        <kbd>Delete</kbd>/<kbd>Backspace</kbd> ปิดคำล่าสุดถอยหลังทีละคำ |
        <kbd>Shift</kbd>+<kbd>C</kbd> ปิดคำที่เปิดทั้งหมด
      </span>
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

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e3e3e3;
  margin-bottom: 0.75rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sparkle-icon { font-size: 1.5rem; }

.title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f1f1f;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-export {
  background: #0b57d0;
  color: #fff;
  border: none;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}

.btn-export:hover { background: #0842a0; }

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

.tool-label { color: #666; }

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

.btn-tool:hover { background: #e2e7eb; }

.font-indicator {
  font-size: 1.1rem;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
}

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
  resize: vertical;
  min-height: 3.5rem;
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
  flex-wrap: wrap;
}

.btn-diff {
  background: #ffffff;
  border: 1px solid #e3e3e3;
  color: #444746;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 1.1rem;
  cursor: pointer;
  font-family: inherit;
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
  font-family: inherit;
}

.btn-ghost:hover { text-decoration: underline; }

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

.reading-line {
  display: block;
  margin-bottom: 0.25rem;
}

.word-wrap {
  display: inline-block;
  margin-right: 0.6rem;
}

.plain-word { color: #1f1f1f; }

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

.app-footer {
  text-align: center;
  padding-top: 0.5rem;
  font-size: 1.05rem;
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