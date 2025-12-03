<template>
  <div>
    <!-- 语言切换按钮：位于全局导航顶部 -->
    <header class="app-header">
      <button class="lang-switch" type="button" @click="toggleLocale">
        {{ $t('common.languageSwitch') }}
      </button>
    </header>
    <router-view />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const toggleLocale = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh';
};
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 8px 16px;
}

.lang-switch {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 13px;
  background: var(--color-surface-alt);
  cursor: pointer;
}
</style>

