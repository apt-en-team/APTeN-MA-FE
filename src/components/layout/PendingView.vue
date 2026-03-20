<template>
  <div class="pending-page">
    <div class="lock-icon">🔒</div>
    <h2>승인 후 확인할 수 있습니다</h2>
    <p>관리자 승인이 완료되면 이 페이지를 이용할 수 있습니다</p>
  </div>
</template>

<style scoped>
.pending-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 12px;
  text-align: center;
}

.lock-icon {
  font-size: 48px;
}

h2 {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

p {
  font-size: 14px;
  color: #999;
  margin: 0;
}
</style>