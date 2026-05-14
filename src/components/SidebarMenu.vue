<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  Box,
  Cpu,
  DataAnalysis,
  Finished,
  Memo,
  OfficeBuilding,
  ShoppingCart,
  Tickets,
} from "@element-plus/icons-vue";

const route = useRoute();

const activeMenu = computed(() => route.path);
</script>

<template>
  <div class="sidebar">
    <div class="brand">
      <div class="brand-mark">
        <el-icon>
          <Finished />
        </el-icon>
      </div>
      <div>
        <strong>EagleMES</strong>
        <span>Factory Console</span>
      </div>
    </div>

    <el-menu router :default-active="activeMenu" class="nav-menu" background-color="transparent" text-color="#cbd5e1"
      active-text-color="#ffffff">
      <el-menu-item index="/dashboard">
        <el-icon>
          <DataAnalysis />
        </el-icon>
        <span>Dashboard</span>
      </el-menu-item>

      <el-menu-item-group class="module-menu-group">
        <template #title>MES</template>

        <el-menu-item index="/production/workorders">
          <el-icon>
            <Tickets />
          </el-icon>
          <span>Work Orders</span>
        </el-menu-item>

        <el-menu-item index="/devices/monitor">
          <el-icon>
            <Cpu />
          </el-icon>
          <span>Devices</span>
        </el-menu-item>
      </el-menu-item-group>

      <el-menu-item-group class="module-menu-group">
        <template #title>WMS</template>

        <el-menu-item index="/warehouse/inventory">
          <el-icon>
            <Box />
          </el-icon>
          <span>Inventory</span>
        </el-menu-item>
      </el-menu-item-group>

      <el-menu-item-group class="module-menu-group">
        <template #title>SRM</template>

        <el-menu-item index="/srm/suppliers">
          <el-icon>
            <OfficeBuilding />
          </el-icon>
          <span>Suppliers</span>
        </el-menu-item>

        <el-menu-item index="/srm/purchase-orders">
          <el-icon>
            <ShoppingCart />
          </el-icon>
          <span>Purchase Orders</span>
        </el-menu-item>
      </el-menu-item-group>

      <el-menu-item-group class="module-menu-group">
        <template #title>System</template>

        <el-menu-item index="/system/eventlogs">
          <el-icon>
            <Memo />
          </el-icon>
          <span>Event Logs</span>
        </el-menu-item>
      </el-menu-item-group>
    </el-menu>

    <div class="sidebar-footer">
      <span class="footer-label">Line Status</span>
      <strong>Production Ready</strong>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 22px 14px;
  color: #f8fafc;
  background: linear-gradient(180deg, rgba(20, 184, 166, 0.12), transparent 34%), #0f172a;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 10px 22px;
}

.brand-mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  color: #ecfeff;
  background: linear-gradient(135deg, #0ea5e9, #14b8a6);
  border-radius: 8px;
  box-shadow: 0 12px 26px rgba(14, 165, 233, 0.28);
}

.brand strong,
.brand span {
  display: block;
  line-height: 1.2;
}

.brand strong {
  font-size: 18px;
  font-weight: 800;
}

.brand span {
  margin-top: 3px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 650;
}

.nav-menu {
  flex: 1;
  border-right: 0;
}

.module-menu-group {
  margin-top: 16px;
}

.module-menu-group :deep(.el-menu-item-group__title) {
  padding: 0 12px 6px 10px !important;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.2;
  text-transform: uppercase;
}

.nav-menu :deep(.el-menu-item) {
  height: 46px;
  margin: 4px 0;
  border-radius: 8px;
  font-weight: 700;
}

.nav-menu :deep(.el-menu-item:hover) {
  color: #ffffff;
  background: rgba(148, 163, 184, 0.12);
}

.nav-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #2563eb, #0891b2);
  box-shadow: 0 12px 22px rgba(37, 99, 235, 0.24);
}

.nav-menu :deep(.el-icon) {
  font-size: 18px;
}

.sidebar-footer {
  padding: 14px;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
}

.footer-label,
.sidebar-footer strong {
  display: block;
}

.footer-label {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 650;
}

.sidebar-footer strong {
  margin-top: 4px;
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 800;
}

@media (max-width: 900px) {
  .sidebar {
    min-height: auto;
  }

  .sidebar-footer {
    display: none;
  }
}
</style>
