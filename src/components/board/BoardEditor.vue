<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { uploadBoardImage } from '@/api/board'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const editorRef = ref(null)
let quill = null

onMounted(() => {
  quill = new Quill(editorRef.value, {
    theme: 'snow',
    placeholder: '내용을 입력해주세요.',
    modules: {
      toolbar: {
        container: [
          ['bold', 'italic', 'underline'],
          [{ header: 1 }, { header: 2 }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean']
        ],
        // 이미지 버튼 클릭 시 커스텀 핸들러 실행
        handlers: {
          image: imageHandler
        }
      }
    }
  })

  // 초기값 세팅
  if (props.modelValue) {
    quill.root.innerHTML = props.modelValue
  }

  // 내용 변경 시 부모로 emit
  quill.on('text-change', () => {
    emit('update:modelValue', quill.root.innerHTML)
  })
})

/**
 * Quill 이미지 핸들러
 * 기본 동작(base64 삽입) 대신 서버에 업로드 후 URL을 에디터에 삽입
 */
function imageHandler() {
  // 파일 선택 input 생성
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('accept', 'image/jpeg,image/png,image/gif,image/webp')
  input.click()

  input.onchange = async () => {
  const file = input.files?.[0]
  if (!file) return
  try {
    const res = await uploadBoardImage(file)
    const imageUrl = res.data.imageUrl
    const range = quill.getSelection(true)
    quill.insertEmbed(range.index, 'image', `http://localhost:8080${imageUrl}`)
    quill.setSelection(range.index + 1)
  } catch (e) {
    alert('이미지 업로드에 실패했습니다.')
  }
}
}

// 부모에서 값이 바뀔 때 (수정 모드에서 초기 데이터 로드)
watch(() => props.modelValue, (newVal) => {
  if (quill && newVal !== quill.root.innerHTML) {
    quill.root.innerHTML = newVal ?? ''
  }
})

onBeforeUnmount(() => {
  quill = null
})
</script>

<template>
  <div class="board-editor">
    <div ref="editorRef" />
  </div>
</template>

<style scoped>
.board-editor :deep(.ql-toolbar) {
  border-radius: 10px 10px 0 0;
  border-color: #E0E3EB;
  background: #F8F9FC;
}

.board-editor :deep(.ql-container) {
  border-radius: 0 0 10px 10px;
  border-color: #E0E3EB;
  font-size: 14px;
  font-family: 'Noto Sans KR', sans-serif;
}

.board-editor :deep(.ql-editor) {
  min-height: 280px;
  line-height: 1.7;
  color: #1A1A2E;
}

.board-editor :deep(.ql-editor.ql-blank::before) {
  color: #9ca3af;
  font-style: normal;
}

.board-editor :deep(.ql-toolbar .ql-stroke) {
  stroke: #555;
}

.board-editor :deep(.ql-toolbar .ql-fill) {
  fill: #555;
}

.board-editor :deep(.ql-toolbar button:hover .ql-stroke) {
  stroke: #4973E5;
}

.board-editor :deep(.ql-toolbar button.ql-active .ql-stroke) {
  stroke: #4973E5;
}

.board-editor :deep(.ql-editor img) {
  width: 200px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  margin: 4px;
  display: inline-block;
  vertical-align: top;
  cursor: pointer;
}
</style>