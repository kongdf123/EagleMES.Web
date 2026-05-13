<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, FullScreen, SwitchButton } from '@element-plus/icons-vue'
import SidebarMenu from '../components/SidebarMenu.vue'

const router = useRouter()
const route = useRoute()

if (!localStorage.getItem('token')) {
  router.push('/login')
}

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/production/workorders': 'Work Orders',
    '/warehouse/inventory': 'Inventory',
    '/devices/monitor': 'Device Monitor',
  }

  return titles[route.path] || 'Operations'
})

const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}
</script>

<template>
  <el-container class="app-shell">
    <el-aside class="app-sidebar" width="248px">
      <SidebarMenu />
    </el-aside>

    <el-container class="workspace">
      <el-header class="topbar" height="72px">
        <div class="title-block">
          <span class="eyebrow">Smart Factory Mini MES</span>
          <h1>{{ pageTitle }}</h1>
        </div>

        <div class="topbar-actions">
          <div class="status-pill">
            <span class="status-dot"></span>
            Live
          </div>

          <el-button :icon="Bell" circle aria-label="Notifications" />
          <el-button :icon="FullScreen" circle aria-label="Fullscreen" />
          <el-button type="primary" :icon="SwitchButton" @click="logout"> Logout </el-button>
        </div>
      </el-header>

      <el-main class="content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(33, 150, 243, 0.1), transparent 32rem),
    linear-gradient(135deg, #f6f8fb 0%, #eef3f8 100%);
}

.app-sidebar {
  background: #0f172a;
  box-shadow: 16px 0 40px rgba(15, 23, 42, 0.12);
}

.workspace {
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 0 28px;
  background: rgba(255, 255, 255, 0.86);
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  backdrop-filter: blur(14px);
}

.title-block {
  min-width: 0;
}

.eyebrow {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.2;
  text-transform: uppercase;
}

.title-block h1 {
  margin: 5px 0 0;
  color: #0f172a;
  font-size: 24px;
  font-weight: 750;
  line-height: 1.2;
}

.topbar-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 10px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  color: #047857;
  font-size: 13px;
  font-weight: 700;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 999px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 999px;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.14);
}

.content {
  min-height: calc(100vh - 72px);
  padding: 28px;
  background: transparent;
}

@media (max-width: 900px) {
  .app-shell {
    display: block;
  }

  .app-sidebar {
    width: 100% !important;
  }

  .topbar {
    height: auto;
    align-items: flex-start;
    flex-direction: column;
    padding: 18px;
  }

  .topbar-actions {
    flex-wrap: wrap;
  }

  .content {
    min-height: auto;
    padding: 18px;
  }
}
</style>
