<template>
  <MobileBlock v-if="isMobile" />
  <div v-else class="layout">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <!-- nginx N + wrench logo -->
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Background -->
          <rect width="28" height="28" rx="6" fill="#0c1e12"/>
          <!-- nginx N -->
          <path d="M4 4L4 20L7 20L7 11L17 20L20 20L20 4L17 4L17 13L7 4Z" fill="#4ade80"/>
          <!-- Dark badge behind wrench -->
          <circle cx="21" cy="21" r="8" fill="#0c1e12"/>
          <!-- Open-end wrench, rotated 45deg -->
          <g transform="translate(21,21) rotate(-45)">
            <rect x="-1" y="1" width="2" height="6" rx="1" fill="#4ade80"/>
            <rect x="-3.5" y="-5.5" width="2.5" height="6" rx="1" fill="#4ade80"/>
            <rect x="1" y="-5.5" width="2.5" height="6" rx="1" fill="#4ade80"/>
          </g>
        </svg>
        <span class="header-title">{{ t('header_title') }}</span>
      </div>
      <button class="help-btn" @click="showHelp = true" title="Help">?</button>
    </header>

    <!-- Help Modal -->
    <Teleport to="body">
      <div v-if="showHelp" class="modal-backdrop" @click.self="showHelp = false">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ t('help_title') }}</h2>
            <button class="modal-close" @click="showHelp = false">✕</button>
          </div>
          <div class="modal-body">
            <section>
              <h3>{{ t('help_start_title') }}</h3>
              <p v-html="t('help_start_desc')"></p>
            </section>

            <section>
              <h3>{{ t('help_tabs_title') }}</h3>
              <ul>
                <li v-html="t('help_tab_formatted')"></li>
                <li v-html="t('help_tab_tree')"></li>
                <li v-html="t('help_tab_summary')"></li>
                <li v-html="t('help_tab_locations')"></li>
                <li v-html="t('help_tab_diagram')"></li>
              </ul>
            </section>

            <section>
              <h3>{{ t('help_locations_title') }}</h3>
              <ul>
                <li v-html="t('help_loc_global_test')"></li>
                <li v-html="t('help_loc_search')"></li>
                <li v-html="t('help_loc_detail')"></li>
                <li v-html="t('help_loc_delete')"></li>
                <li>{{ t('help_loc_jump') }}</li>
              </ul>
            </section>

            <section>
              <h3>{{ t('help_diagram_title') }}</h3>
              <ul>
                <li>{{ t('help_diag_visual') }}</li>
                <li>{{ t('help_diag_upstream') }}</li>
                <li>{{ t('help_diag_click') }}</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Main -->
    <div class="main">
      <!-- Left: Input -->
      <div class="pane pane-left">
        <div class="pane-header">
          <span class="pane-label">nginx.conf</span>
          <div class="pane-header-actions">
            <div class="sample-dropdown-wrap" ref="sampleWrapRef">
              <button class="btn-sample" @click="toggleSampleMenu">{{ t('sample_load') }}</button>
              <div v-if="sampleMenuOpen" class="sample-menu">
                <button
                  v-for="s in SAMPLES"
                  :key="s.key"
                  class="sample-item"
                  @click="loadSample(s)"
                >{{ s.label }}</button>
              </div>
            </div>
            <button class="btn-clear" @click="clearInput">{{ t('btn_clear') }}</button>
          </div>
        </div>

        <!-- Include file tabs -->
        <div v-if="includeKeys.length" class="file-tabs">
          <button
            class="file-tab"
            :class="{ active: activeInputTab === 'main' }"
            @click="activeInputTab = 'main'"
          >nginx.conf</button>
          <button
            v-for="key in includeKeys"
            :key="key"
            class="file-tab"
            :class="{ active: activeInputTab === key }"
            @click="activeInputTab = key"
            :title="key"
          >{{ fileTabName(key) }}</button>
        </div>

        <div v-show="activeInputTab === 'main'" class="input-editor-wrap">
          <div class="line-gutter" ref="lineGutterRef">
            <div v-for="n in lineCount" :key="n" class="ln">{{ n }}</div>
          </div>
          <textarea
            ref="inputRef"
            v-model="input"
            class="input-area"
            :placeholder="t('input_placeholder')"
            spellcheck="false"
            @scroll="onInputScroll"
            @keydown.tab.prevent="onTabKey"
          ></textarea>
        </div>

        <!-- Include file viewer (read-only) -->
        <div v-if="activeInputTab !== 'main'" class="input-editor-wrap include-readonly">
          <div class="include-path-bar">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span class="include-path-text">{{ activeInputTab }}</span>
            <span class="readonly-badge">read-only</span>
          </div>
          <textarea
            ref="includeViewerRef"
            class="input-area"
            readonly
            :value="includesMap[activeInputTab]"
            spellcheck="false"
          ></textarea>
        </div>

        <div class="input-footer">
          <button class="btn-primary" @click="run">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Parse &amp; Format
          </button>
          <button
            v-if="vscode"
            class="btn-save"
            :class="saveState"
            @click="saveFile"
            :disabled="saveState === 'saving'"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            {{ saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved!' : saveState === 'error' ? 'Error' : 'Save' }}
          </button>
          <div class="autoparse-wrap">
            <button
              class="btn-autoparse"
              :class="{ active: autoparse }"
              @click="autoparse = !autoparse"
            >
              <span class="autoparse-dot"></span>
              Auto
            </button>
            <div class="autoparse-tooltip">
              <strong>Auto Parse</strong>
              <span>입력 후 0.5초가 지나면 자동으로 파싱합니다.</span>
              <span>OFF 상태에서는 Parse &amp; Format 버튼을 직접 눌러야 합니다.</span>
            </div>
          </div>
          <span v-if="parsed && !error" class="stat-text">{{ t('stat_nodes', { n: nodeCount }) }}</span>
        </div>
      </div>

      <!-- Right: Output -->
      <div class="pane pane-right">
        <!-- Error -->
        <div v-if="error" class="error-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{{ error }}</span>
        </div>

        <!-- Tabs -->
        <div v-if="parsed && !error" class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
            <span v-if="tab.badge" class="tab-badge" :class="`tab-badge-${tab.badgeColor}`">{{ tab.badge }}</span>
          </button>
          <div class="tabs-spacer"></div>
          <template v-if="activeTab === 'formatted'">
            <div class="indent-selector">
              <button
                v-for="opt in indentOptions"
                :key="opt.value"
                class="indent-btn"
                :class="{ active: indentStr === opt.value }"
                @click="indentStr = opt.value"
              >{{ opt.label }}</button>
            </div>
            <button class="btn-ghost copy-btn" @click="copyFormatted">
              {{ copied ? t('btn_copied') : t('btn_copy') }}
            </button>
          </template>
        </div>

        <!-- Placeholder -->
        <div v-if="!parsed && !error" class="placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3a3a4f" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          <p v-html="t('placeholder_paste')"></p>
        </div>

        <!-- Find Bar (Formatted tab) -->
        <Transition name="find">
          <div v-if="findOpen && parsed && !error && activeTab === 'formatted'" class="find-bar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              ref="findInputRef"
              v-model="findQuery"
              class="find-input"
              :placeholder="t('find_placeholder')"
              @keydown.enter.exact.prevent="findNext"
              @keydown.shift.enter.prevent="findPrev"
              @keydown.escape.prevent="closeFindBar"
            />
            <span class="find-count" :class="{ 'find-count-empty': findQuery && !findMatches.length }">{{ findCountText }}</span>
            <button class="find-nav" @click="findPrev" :disabled="!findMatches.length" title="Previous">↑</button>
            <button class="find-nav" @click="findNext" :disabled="!findMatches.length" title="Next">↓</button>
            <button class="find-close" @click="closeFindBar">✕</button>
          </div>
        </Transition>

        <!-- Formatted Tab -->
        <div v-if="parsed && !error && activeTab === 'formatted'" class="output-area formatted-area" ref="formattedAreaRef">
          <div class="code-with-lines">
            <div v-for="(line, i) in highlightedLinesWithSearch" :key="i" class="code-line">
              <span class="line-num">{{ i + 1 }}</span>
              <span class="line-content" v-html="line"></span>
            </div>
          </div>
        </div>

        <!-- Tree Tab -->
        <div v-if="parsed && !error && activeTab === 'tree'" class="output-area tree-area">
          <TreeNode v-for="(node, i) in ast" :key="i" :node="node" :depth="0" />
        </div>

        <!-- Summary Tab -->
        <div v-if="parsed && !error && activeTab === 'summary'" class="output-area summary-area">
          <SummaryView :summary="summaryData" />
        </div>

        <!-- Locations Tab -->
        <div v-if="parsed && !error && activeTab === 'locations'" class="output-area summary-area">
          <LocationAnalyzer :ast="ast" />
        </div>

        <!-- Diagram Tab -->
        <div v-if="parsed && !error && activeTab === 'diagram'" class="output-area diagram-area">
          <DiagramView :ast="ast" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide, watch, nextTick } from 'vue'
import { useI18n } from './i18n/index.js'
import MobileBlock from './components/MobileBlock.vue'
import { parse, format, highlight, summarize, SAMPLES } from '@nginx-viewer/core'
import TreeNode from './components/TreeNode.vue'
import SummaryView from './components/SummaryView.vue'
import LocationAnalyzer from './components/LocationAnalyzer.vue'
import DiagramView from './components/DiagramView.vue'

const { t } = useI18n()
const vscode = window.__vscode_webview__ ? window.acquireVsCodeApi() : null
const isMobile = ref(false)
const showHelp = ref(false)
const sampleMenuOpen = ref(false)
const sampleWrapRef = ref(null)
const inputRef = ref(null)
const lineGutterRef = ref(null)
const lineCount = computed(() => input.value ? input.value.split('\n').length : 1)

// ── Include file tabs ─────────────────────────────────────────
const includesMap = window.__nginx_includes__ ?? {}
const includeKeys = computed(() => Object.keys(includesMap))
const activeInputTab = ref('main')
const includeViewerRef = ref(null)

function fileTabName(key) {
  return key.split('/').pop() || key
}

function jumpToFileAndLine(sourceFile, line) {
  if (!sourceFile) {
    jumpToLine(line)
    return
  }
  activeInputTab.value = sourceFile
  nextTick(() => {
    const ta = includeViewerRef.value
    if (!ta || !line) return
    const content = includesMap[sourceFile] ?? ''
    const lines = content.split('\n')
    // jumpToLine과 동일한 mirror div 방식으로 픽셀 정확 스크롤
    const style = window.getComputedStyle(ta)
    const mirror = document.createElement('div')
    Object.assign(mirror.style, {
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      width: ta.clientWidth + 'px',
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      paddingTop: style.paddingTop,
      paddingBottom: style.paddingBottom,
      paddingLeft: style.paddingLeft,
      paddingRight: style.paddingRight,
      boxSizing: style.boxSizing,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
      visibility: 'hidden',
    })
    mirror.textContent = lines.slice(0, line - 1).join('\n') + (line > 1 ? '\n' : '')
    document.body.appendChild(mirror)
    const lineTop = mirror.scrollHeight
    document.body.removeChild(mirror)
    ta.scrollTop = Math.max(0, lineTop - ta.clientHeight / 3)
    // readonly textarea도 setSelectionRange 지원
    let offset = 0
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      offset += lines[i].length + 1
    }
    const endOffset = offset + (lines[line - 1]?.length || 0)
    ta.focus()
    ta.setSelectionRange(offset, endOffset)
  })
}
provide('jumpToFileAndLine', jumpToFileAndLine)

function onInputScroll() {
  if (lineGutterRef.value && inputRef.value) {
    lineGutterRef.value.scrollTop = inputRef.value.scrollTop
  }
}
const input = ref('')
const parsed = ref(false)
const error = ref(null)
const ast = ref([])
const summaryData = ref(null)
const activeTab = ref('formatted')
const copied = ref(false)

const indentOptions = [
  { label: t('indent_2'), value: '  ' },
  { label: t('indent_4'), value: '    ' },
  { label: t('indent_tab'), value: '\t' },
]
const indentStr = ref('  ')

const formattedCode   = computed(() => ast.value.length ? format(ast.value, indentStr.value) : '')
const highlightedCode = computed(() => ast.value.length ? highlight(ast.value, indentStr.value) : '')
const highlightedLines = computed(() => highlightedCode.value ? highlightedCode.value.split('\n') : [])

function jumpToLine(line) {
  if (!line || !inputRef.value) return
  const textarea = inputRef.value
  const lines = input.value.split('\n')

  // 선택 범위 계산
  let offset = 0
  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    offset += lines[i].length + 1
  }
  const endOffset = offset + (lines[line - 1]?.length || 0)

  // 미러 div로 대상 라인까지의 실제 픽셀 높이를 측정 (line-height 누적 오차 없음)
  const style = window.getComputedStyle(textarea)
  const mirror = document.createElement('div')
  Object.assign(mirror.style, {
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
    width: textarea.clientWidth + 'px',
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    paddingTop: style.paddingTop,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft,
    paddingRight: style.paddingRight,
    boxSizing: style.boxSizing,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    visibility: 'hidden',
  })
  // line-1 줄까지의 텍스트를 넣으면 scrollHeight = 해당 라인 시작 픽셀
  mirror.textContent = lines.slice(0, line - 1).join('\n') + (line > 1 ? '\n' : '')
  document.body.appendChild(mirror)
  const lineTop = mirror.scrollHeight
  document.body.removeChild(mirror)

  const scrollTop = Math.max(0, lineTop - textarea.clientHeight / 3)

  textarea.focus()
  textarea.setSelectionRange(offset, endOffset)
  // RAF: setSelectionRange/focus의 브라우저 자동 스크롤 이후에 덮어씀
  requestAnimationFrame(() => {
    textarea.scrollTop = scrollTop
    if (lineGutterRef.value) lineGutterRef.value.scrollTop = scrollTop
  })
}

provide('jumpToLine', jumpToLine)

function deleteNode(node) {
  if (!node?.line) return
  const lines = input.value.split('\n')
  const startIdx = node.line - 1  // 0-indexed

  // 중괄호 카운팅으로 블록 끝 라인 탐색
  let depth = 0
  let endIdx = startIdx
  let found = false
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) { endIdx = i; found = true; break }
      }
    }
    if (found) break
  }
  if (!found) return

  lines.splice(startIdx, endIdx - startIdx + 1)
  input.value = lines.join('\n').replace(/\n{3,}/g, '\n\n')
  run()
}
provide('deleteNode', deleteNode)

const tabs = computed(() => [
  { key: 'formatted',  label: 'Formatted' },
  { key: 'tree',       label: 'Tree' },
  { key: 'summary',    label: 'Summary' },
  { key: 'locations',  label: 'Locations' },
  { key: 'diagram',    label: 'Diagram' },
])

const nodeCount = computed(() => {
  let n = 0
  const count = (nodes) => {
    for (const node of nodes) {
      n++
      if (node.children) count(node.children)
    }
  }
  count(ast.value)
  return n
})

// ── Auto-parse ────────────────────────────────────────────────
const autoparse = ref(false)
let autparseTimer = null

watch(input, () => {
  if (!autoparse.value) return
  clearTimeout(autparseTimer)
  autparseTimer = setTimeout(() => run(), 500)
})

function run() {
  error.value = null
  parsed.value = false

  const result = parse(input.value, window.__nginx_includes__ ?? {})
  if (!result.ok) {
    error.value = result.error
    return
  }

  ast.value = result.ast
  summaryData.value = summarize(result.ast)
  parsed.value = true
}

function clearInput() {
  input.value = ''
  parsed.value = false
  error.value = null
  ast.value = []
}

// ── File Save ─────────────────────────────────────────────────
const saveState = ref('idle') // 'idle' | 'saving' | 'saved' | 'error'

function saveFile() {
  if (!vscode) return
  saveState.value = 'saving'
  vscode.postMessage({ command: 'save', content: input.value })
}

// ── Tab key insertion ─────────────────────────────────────────
function onTabKey(e) {
  const el = e.target
  const start = el.selectionStart
  const end = el.selectionEnd
  const indent = indentStr.value

  if (start === end) {
    document.execCommand('insertText', false, indent)
  } else {
    const selected = input.value.slice(start, end)
    const indented = selected.split('\n').map(line => indent + line).join('\n')
    document.execCommand('insertText', false, indented)
  }
}

async function copyFormatted() {
  try {
    await navigator.clipboard.writeText(formattedCode.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
}

function toggleSampleMenu() {
  sampleMenuOpen.value = !sampleMenuOpen.value
}

function loadSample(s) {
  input.value = s.conf
  sampleMenuOpen.value = false
  run()
}

// ── Find (Formatted tab) ──────────────────────────────────────
const findOpen      = ref(false)
const findQuery     = ref('')
const findInputRef  = ref(null)
const findCurrentIdx = ref(-1)
const formattedAreaRef = ref(null)

// Find all matches (line index + char offset within line)
const findMatches = computed(() => {
  if (!findQuery.value || !formattedCode.value) return []
  const q = findQuery.value.toLowerCase()
  const lines = formattedCode.value.split('\n')
  const matches = []
  for (let li = 0; li < lines.length; li++) {
    const lower = lines[li].toLowerCase()
    let ci = lower.indexOf(q)
    while (ci !== -1) {
      matches.push({ li, ci })
      ci = lower.indexOf(q, ci + 1)
    }
  }
  return matches
})

const findCountText = computed(() => {
  if (!findQuery.value) return ''
  const total = findMatches.value.length
  if (total === 0) return t('find_no_match')
  return `${findCurrentIdx.value >= 0 ? findCurrentIdx.value + 1 : 1} / ${total}`
})

// Inject <mark> into a highlighted HTML line at given char offsets
function injectMarks(html, lineMatches, qLen, currentGlobalIdx) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  let charOffset = 0

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const nodeLen = node.textContent.length
      // Collect all matches that fall within this text node
      const localMatches = []
      for (const m of lineMatches) {
        const s = m.ci - charOffset
        if (s >= 0 && s + qLen <= nodeLen) {
          localMatches.push({ s, e: s + qLen, isCurrent: m.gi === currentGlobalIdx })
        }
      }
      charOffset += nodeLen
      if (localMatches.length === 0) return

      // Build a single fragment covering all matches in one pass (left to right)
      localMatches.sort((a, b) => a.s - b.s)
      const text = node.textContent
      const frag = document.createDocumentFragment()
      let pos = 0
      for (const { s, e, isCurrent } of localMatches) {
        if (s > pos) frag.appendChild(document.createTextNode(text.slice(pos, s)))
        const mark = document.createElement('mark')
        mark.className = isCurrent ? 'search-hl search-hl-cur' : 'search-hl'
        mark.textContent = text.slice(s, e)
        frag.appendChild(mark)
        pos = e
      }
      if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)))
      node.parentNode.replaceChild(frag, node)
    } else {
      for (const child of [...node.childNodes]) walk(child)
    }
  }

  walk(tmp)
  return tmp.innerHTML
}

const highlightedLinesWithSearch = computed(() => {
  if (!findQuery.value || !findMatches.value.length) return highlightedLines.value
  const byLine = {}
  findMatches.value.forEach((m, gi) => {
    ;(byLine[m.li] ??= []).push({ ...m, gi })
  })
  const qLen = findQuery.value.length
  return highlightedLines.value.map((lineHtml, li) =>
    byLine[li] ? injectMarks(lineHtml, byLine[li], qLen, findCurrentIdx.value) : lineHtml
  )
})

function scrollToCurrentMatch() {
  nextTick(() => {
    formattedAreaRef.value?.querySelector('.search-hl-cur')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}

function openFindBar() {
  findOpen.value = true
  nextTick(() => findInputRef.value?.focus())
}

function closeFindBar() {
  findOpen.value = false
  findQuery.value = ''
  findCurrentIdx.value = -1
}

function findNext() {
  if (!findMatches.value.length) return
  findCurrentIdx.value = findCurrentIdx.value < findMatches.value.length - 1
    ? findCurrentIdx.value + 1 : 0
  scrollToCurrentMatch()
}

function findPrev() {
  if (!findMatches.value.length) return
  findCurrentIdx.value = findCurrentIdx.value <= 0
    ? findMatches.value.length - 1 : findCurrentIdx.value - 1
  scrollToCurrentMatch()
}

watch(findQuery, () => {
  findCurrentIdx.value = findMatches.value.length ? 0 : -1
  scrollToCurrentMatch()
})

onMounted(() => {
  isMobile.value = !window.__vscode_webview__ && window.innerWidth < 768

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      saveFile()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      if (parsed.value && !error.value && activeTab.value === 'formatted') {
        e.preventDefault()
        openFindBar()
      }
    }
    if (e.key === 'Escape' && findOpen.value) closeFindBar()
  })

  if (vscode) {
    window.addEventListener('message', (e) => {
      const msg = e.data
      if (msg.command === 'saved') {
        saveState.value = 'saved'
        setTimeout(() => { saveState.value = 'idle' }, 2000)
      } else if (msg.command === 'save-error') {
        saveState.value = 'error'
        setTimeout(() => { saveState.value = 'idle' }, 3000)
      }
    })
  }

  document.addEventListener('click', (e) => {
    if (sampleWrapRef.value && !sampleWrapRef.value.contains(e.target)) {
      sampleMenuOpen.value = false
    }
  })

  if (window.__nginx_initial_content__) {
    input.value = window.__nginx_initial_content__
    run()
  }
})
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0f0f13;
  overflow: hidden;
}

/* Header */
.header {
  height: 52px;
  background: #16161d;
  border-bottom: 1px solid #2a2a3a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
}

.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: #f0f0f5;
  letter-spacing: -0.02em;
}

.header-sep {
  color: #3a3a4f;
  font-size: 16px;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #4ade80;
}

.help-btn {
  width: 28px;
  height: 28px;
  background: none;
  border: 1px solid #2a2a3a;
  border-radius: 6px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 700;
  padding: 0;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.help-btn:hover { color: #d1d5db; border-color: #3a3a4f; }

/* Main split */
.main {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 0;
}

.pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pane-left {
  width: 40%;
  min-width: 280px;
  border-right: 1px solid #2a2a3a;
}

.pane-right {
  flex: 1;
}

/* Pane header */
.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: #16161d;
  border-bottom: 1px solid #2a2a3a;
  flex-shrink: 0;
}

.pane-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Input */
.input-area {
  flex: 1;
  resize: none;
  background: #0f0f13;
  color: #d1d5db;
  border: none;
  outline: none;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.7;
  padding: 14px 14px 14px 0;
  overflow: auto;
  min-width: 0;
}

.input-area::placeholder { color: #3a3a4f; }

.input-editor-wrap {
  display: flex;
  flex: 1;
  overflow: hidden;
  background: #0f0f13;
}

.line-gutter {
  flex-shrink: 0;
  width: 44px;
  background: #0f0f13;
  border-right: 1px solid #1e1e2e;
  overflow: hidden;
  padding: 14px 0;
  user-select: none;
}

.ln {
  display: block;
  text-align: right;
  padding-right: 10px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #3a3a4f;
}

.input-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #16161d;
  border-top: 1px solid #2a2a3a;
  flex-shrink: 0;
}

.stat-text {
  font-size: 12px;
  color: #6b7280;
}

/* Buttons */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #16a34a;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 7px 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover { background: #15803d; }

.btn-save {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1e293b;
  color: #94a3b8;
  border: 1px solid #2a2a3a;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 7px 14px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.btn-save:hover { background: #2a2a3a; color: #d1d5db; }
.btn-save.saved  { color: #4ade80; border-color: rgba(74,222,128,0.4); }
.btn-save.error  { color: #f87171; border-color: rgba(248,113,113,0.4); }
.btn-save:disabled { opacity: 0.5; cursor: default; }

.autoparse-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.btn-autoparse {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #1e293b;
  color: #6b7280;
  border: 1px solid #2a2a3a;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.btn-autoparse:hover { background: #2a2a3a; color: #9ca3af; }
.btn-autoparse.active { color: #4ade80; border-color: rgba(74,222,128,0.4); background: rgba(74,222,128,0.06); }

.autoparse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4b5563;
  transition: background 0.15s;
  flex-shrink: 0;
}
.btn-autoparse.active .autoparse-dot { background: #4ade80; }

.autoparse-tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #1c1c26;
  border: 1px solid #3a3a4f;
  border-radius: 8px;
  padding: 10px 13px;
  width: 220px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  pointer-events: none;
  z-index: 100;
  flex-direction: column;
  gap: 5px;
}
.autoparse-tooltip strong {
  font-size: 11px;
  font-weight: 700;
  color: #d1d5db;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.autoparse-tooltip span {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.5;
}
.autoparse-wrap:hover .autoparse-tooltip { display: flex; }

.btn-ghost {
  background: none;
  border: 1px solid #2a2a3a;
  border-radius: 6px;
  color: #6b7280;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.btn-ghost:hover { color: #d1d5db; border-color: #3a3a4f; }

.pane-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-sample {
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 6px;
  color: #38bdf8;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.btn-sample:hover {
  background: rgba(56, 189, 248, 0.18);
  border-color: #38bdf8;
  color: #7dd3fc;
}

.btn-clear {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: 6px;
  color: #f59e0b;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.btn-clear:hover {
  background: rgba(245, 158, 11, 0.16);
  border-color: #f59e0b;
  color: #fbbf24;
}

/* Find Bar */
.find-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #16161d;
  border-bottom: 1px solid #2a2a3a;
  flex-shrink: 0;
  color: #6b7280;
}

.find-input {
  flex: 1;
  min-width: 0;
  max-width: 240px;
  background: #0f0f13;
  border: 1px solid #3a3a4f;
  border-radius: 5px;
  color: #d1d5db;
  font-size: 12px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  padding: 3px 8px;
  outline: none;
  transition: border-color 0.15s;
}
.find-input:focus { border-color: #4ade80; }
.find-input::placeholder { color: #3a3a4f; }

.find-count {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
  min-width: 52px;
  text-align: center;
}
.find-count-empty { color: #ef4444; }

.find-nav {
  background: none;
  border: 1px solid #2a2a3a;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 12px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: color 0.15s, border-color 0.15s;
  flex-shrink: 0;
}
.find-nav:hover:not(:disabled) { color: #d1d5db; border-color: #4b5563; }
.find-nav:disabled { opacity: 0.35; cursor: default; }

.find-close {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  padding: 2px 5px;
  border-radius: 4px;
  line-height: 1;
  transition: color 0.15s;
}
.find-close:hover { color: #d1d5db; }

.find-enter-active, .find-leave-active { transition: opacity 0.12s, transform 0.12s; }
.find-enter-from, .find-leave-to { opacity: 0; transform: translateY(-4px); }

/* Error */
.error-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 16px;
  padding: 12px 14px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 13px;
  line-height: 1.6;
}

.error-box svg { flex-shrink: 0; margin-top: 1px; color: #ef4444; }

/* Tabs */
.tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px 14px 0;
  border-bottom: 1px solid #2a2a3a;
  flex-shrink: 0;
}

.tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;
}

.tab:hover { color: #d1d5db; }
.tab.active { color: #4ade80; border-bottom-color: #4ade80; }

.tabs-spacer { flex: 1; }

.copy-btn { margin-bottom: 8px; }

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  margin-left: 5px;
}

.tab-badge-error   { background: rgba(239,68,68,0.2);  color: #fca5a5; }
.tab-badge-warning { background: rgba(234,179,8,0.2);  color: #fde68a; }

/* Placeholder */
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: #3a3a4f;
  font-size: 14px;
  text-align: center;
  line-height: 1.7;
}

/* Output areas */
.output-area {
  flex: 1;
  overflow: auto;
  padding: 14px;
}

.formatted-area {
  padding: 0;
}

.code-with-lines {
  padding: 14px 0;
  min-height: 100%;
}

.code-line {
  display: flex;
  align-items: baseline;
  line-height: 1.7;
  padding: 0 14px 0 0;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.code-line:hover { background: rgba(255,255,255,0.025); }

.line-num {
  min-width: 42px;
  padding: 0 12px 0 14px;
  text-align: right;
  color: #3a3a4f;
  font-size: 12px;
  user-select: none;
  flex-shrink: 0;
}

.line-content { flex: 1; white-space: pre; }

.tree-area {
  padding: 10px 14px;
}

.summary-area {
  padding: 14px;
}

.diagram-area {
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
}

/* Indent selector */
.indent-selector {
  display: flex;
  align-items: center;
  border: 1px solid #2a2a3a;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.indent-btn {
  background: none;
  border: none;
  border-right: 1px solid #2a2a3a;
  color: #6b7280;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 9px;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
  white-space: nowrap;
}

.indent-btn:last-child { border-right: none; }
.indent-btn:hover { color: #d1d5db; background: #1c1c26; }
.indent-btn.active { background: #2a2a3a; color: #4ade80; font-weight: 600; }

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1c1c26;
  border: 1px solid #2a2a3a;
  border-radius: 10px;
  width: 580px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #2a2a3a;
  flex-shrink: 0;
}

.modal-header h2 {
  font-size: 15px;
  font-weight: 700;
  color: #f0f0f5;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s;
}

.modal-close:hover { color: #d1d5db; }

.modal-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.7;
}

.modal-body section h3 {
  font-size: 12px;
  font-weight: 700;
  color: #4ade80;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 8px;
}

.modal-body p { margin: 0; }

.modal-body ul {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-body code {
  background: #2a2a3a;
  border-radius: 3px;
  padding: 1px 5px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #86efac;
}

.modal-body strong {
  color: #d1d5db;
  font-weight: 600;
}

/* Include file tabs */
.file-tabs {
  display: flex;
  gap: 2px;
  padding: 6px 10px 0;
  background: #16161d;
  border-bottom: 1px solid #2a2a3a;
  flex-shrink: 0;
  overflow-x: auto;
}

.file-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #6b7280;
  font-size: 12px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-weight: 500;
  padding: 4px 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;
}

.file-tab:hover { color: #d1d5db; }
.file-tab.active { color: #4ade80; border-bottom-color: #4ade80; }

/* Include readonly viewer */
.include-readonly {
  flex-direction: column;
}

.include-path-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: #1a1a24;
  border-bottom: 1px solid #2a2a3a;
  color: #6b7280;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  flex-shrink: 0;
}

.include-path-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #9ca3af;
}

.readonly-badge {
  font-size: 10px;
  background: rgba(107, 114, 128, 0.15);
  border: 1px solid #3a3a4f;
  border-radius: 3px;
  padding: 1px 5px;
  color: #6b7280;
  flex-shrink: 0;
}

.include-readonly .input-area {
  padding-left: 14px;
  cursor: default;
  color: #9ca3af;
}

.include-readonly .input-area:focus {
  outline: none;
}

/* Sample dropdown */
.sample-dropdown-wrap {
  position: relative;
}

.sample-btn {
  white-space: nowrap;
}

.sample-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: #1c1c26;
  border: 1px solid #2a2a3a;
  border-radius: 7px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 100;
  min-width: 160px;
  overflow: hidden;
}

.sample-item {
  display: block;
  width: 100%;
  background: none;
  border: none;
  border-bottom: 1px solid #2a2a3a;
  color: #d1d5db;
  font-size: 13px;
  padding: 9px 14px;
  text-align: left;
  cursor: pointer;
  transition: background 0.1s;
}

.sample-item:last-child { border-bottom: none; }
.sample-item:hover { background: #2a2a3a; color: #4ade80; }
</style>

<style>
/* Search highlight — unscoped because injected via v-html */
mark.search-hl {
  background: rgba(234, 179, 8, 0.3);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}
mark.search-hl-cur {
  background: rgba(234, 179, 8, 0.75);
  outline: 1px solid #eab308;
  border-radius: 2px;
  color: #0f0f13;
}

/* Syntax highlight classes — unscoped because injected via v-html */
.code-with-lines .hl-block       { color: #4ade80; font-weight: 700; }
.code-with-lines .hl-key         { color: #60a5fa; }
.code-with-lines .hl-value       { color: #d1d5db; }
.code-with-lines .hl-param       { color: #86efac; }
.code-with-lines .hl-punct       { color: #4b5563; }
.code-with-lines .hl-comment     { color: #6b7280; font-style: italic; }
.code-with-lines .hl-include-kw  { color: #f59e0b; font-weight: 700; }
.code-with-lines .hl-include-path{ color: #fcd34d; }
.code-with-lines .hl-warn        { color: #f59e0b; font-size: 11px; }
</style>
