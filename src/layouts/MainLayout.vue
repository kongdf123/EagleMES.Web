<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Bell, FullScreen, SwitchButton } from "@element-plus/icons-vue";
import SidebarMenu from "../components/SidebarMenu.vue";

const router = useRouter();
const route = useRoute();

const username = ref(localStorage.getItem("username") || "");
const role = ref(localStorage.getItem("role") || "");
const isFullscreen = ref(false);

if (!localStorage.getItem("token")) {
  router.push("/login");
}

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/production/workorders": "Work Orders",
    "/warehouse/inventory": "Inventory",
    "/srm/suppliers": "Suppliers",
    "/srm/purchase-orders": "Purchase Orders",
    "/devices/monitor": "Device Monitor",
    "/system/eventlogs": "Event Logs",
  };

  return titles[route.path] || "Operations";
});

const displayUsername = computed(() => username.value || "User");
const displayRole = computed(() => role.value || "Operator");

const userInitials = computed(() => {
  return displayUsername.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";
});

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  router.push("/login");
};

const handleUserCommand = (command: string | number | object) => {
  if (command === "logout") {
    logout();
  }
};

const toggleFullscreen = async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen?.();
    return;
  }

  await document.exitFullscreen?.();
};

const syncFullscreenState = () => {
  isFullscreen.value = Boolean(document.fullscreenElement);
};

onMounted(() => {
  document.addEventListener("fullscreenchange", syncFullscreenState);
  syncFullscreenState();
});

onUnmounted(() => {
  document.removeEventListener("fullscreenchange", syncFullscreenState);
});
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
          <el-button :icon="FullScreen" circle :type="isFullscreen ? 'primary' : 'default'" aria-label="Fullscreen"
            @click="toggleFullscreen" />

          <el-dropdown trigger="click" @command="handleUserCommand">
            <button class="user-menu" type="button" aria-label="User account menu">
              <span class="user-avatar">{{ userInitials }}</span>
              <span class="user-copy">
                <strong>{{ displayUsername }}</strong>
                <!-- <span>{{ displayRole }}</span> -->
              </span>
            </button>

            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  Signed in as {{ displayUsername }}
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided :icon="SwitchButton">
                  Logout
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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

.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(118px, 32vw);
  min-width: 118px;
  height: 42px;
  padding: 0 12px 0 8px;
  color: inherit;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
}

.user-menu:hover,
.user-menu:focus-visible {
  border-color: rgba(37, 99, 235, 0.36);
  outline: none;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.user-avatar {
  display: grid;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  place-items: center;
  color: #ecfeff;
  font-size: 12px;
  font-weight: 850;
  background: linear-gradient(135deg, #2563eb, #0891b2);
  border-radius: 8px;
}

.user-copy {
  min-width: 0;
  text-align: left;
}

.user-copy strong,
.user-copy span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-copy strong {
  color: #0f172a;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.15;
}

.user-copy span {
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.15;
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

  .user-menu {
    width: min(220px, 100%);
    min-width: min(220px, 100%);
  }

  .content {
    min-height: auto;
    padding: 18px;
  }
}
</style>
