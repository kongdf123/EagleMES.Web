<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { CircleCheck, Cpu, Refresh, Search, Timer, Warning } from "@element-plus/icons-vue";
import { getDevices } from "@/api/device";

interface Device {
  deviceCode: string;
  deviceName: string;
  status: string;
  temperature?: number;
  lastUpdated?: string;
}

const devices = ref<Device[]>([]);
const loading = ref(false);
const searchKeyword = ref("");
const lastRefreshAt = ref<Date>();
let timer: number | undefined;

const filteredDevices = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  if (!keyword) {
    return devices.value;
  }

  return devices.value.filter((device) => {
    return [device.deviceCode, device.deviceName, device.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });
});

const warningDevices = computed(() => {
  return devices.value.filter((device) => isWarningStatus(device.status)).length;
});

const onlineDevices = computed(() => {
  return devices.value.filter((device) => isOnlineStatus(device.status)).length;
});

const offlineDevices = computed(() => {
  return Math.max(devices.value.length - onlineDevices.value - warningDevices.value, 0);
});

const averageTemperature = computed(() => {
  const values = devices.value
    .map((device) => Number(device.temperature))
    .filter((temperature) => Number.isFinite(temperature));

  if (!values.length) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
});

const hottestDevice = computed(() => {
  return [...devices.value]
    .filter((device) => Number.isFinite(Number(device.temperature)))
    .sort((first, second) => Number(second.temperature) - Number(first.temperature))[0];
});

const fetchDevices = async (showLoading = false) => {
  if (showLoading) {
    loading.value = true;
  }

  try {
    const response = await getDevices();
    devices.value = response.data;
    lastRefreshAt.value = new Date();
  } catch {
    ElMessage.error("Unable to load devices.");
  } finally {
    loading.value = false;
  }
};

const handleRefresh = () => {
  fetchDevices(true);
};

const isWarningStatus = (status?: string) => {
  const normalized = String(status || "").toLowerCase();
  return normalized.includes("warning") || normalized.includes("alarm") || normalized.includes("fault");
};

const isOnlineStatus = (status?: string) => {
  const normalized = String(status || "").toLowerCase();
  return normalized.includes("online") || normalized.includes("running") || normalized.includes("normal");
};

const getStatusType = (status?: string) => {
  const normalized = String(status || "").toLowerCase();

  if (isWarningStatus(normalized)) {
    return "danger";
  }

  if (isOnlineStatus(normalized)) {
    return "success";
  }

  if (normalized.includes("idle") || normalized.includes("standby")) {
    return "warning";
  }

  return "info";
};

const getTemperatureType = (temperature?: number) => {
  const value = Number(temperature || 0);

  if (value >= 75) {
    return "danger";
  }

  if (value >= 60) {
    return "warning";
  }

  return "success";
};

const formatTemperature = (temperature?: number) => {
  const value = Number(temperature);

  if (!Number.isFinite(value)) {
    return "--";
  }

  return `${value.toFixed(1)}°C`;
};

const formatDateTime = (value?: string | Date) => {
  if (!value) {
    return "Not reported";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

onMounted(() => {
  fetchDevices(true);
  timer = window.setInterval(() => fetchDevices(), 3000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<template>
  <section class="device-page">
    <div class="page-hero">
      <div>
        <span class="eyebrow">Equipment Telemetry</span>
        <h2>Device Monitor</h2>
        <p>Watch equipment status, temperature trends, and live device heartbeat updates.</p>
      </div>

      <div class="hero-actions">
        <div class="live-pill">
          <span class="pulse-dot"></span>
          Auto refresh
        </div>
        <el-button :icon="Refresh" :loading="loading" @click="handleRefresh">Refresh</el-button>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-icon blue">
          <el-icon><Cpu /></el-icon>
        </div>
        <span>Total Devices</span>
        <strong>{{ devices.length }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon green">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <span>Online</span>
        <strong>{{ onlineDevices }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon amber">
          <el-icon><Warning /></el-icon>
        </div>
        <span>Warnings</span>
        <strong>{{ warningDevices }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon violet">
          <el-icon><Timer /></el-icon>
        </div>
        <span>Avg Temp</span>
        <strong>{{ formatTemperature(averageTemperature) }}</strong>
      </div>
    </div>

    <div class="workspace-grid">
      <div class="table-panel">
        <div class="panel-toolbar">
          <div>
            <h3>Live Device List</h3>
            <p>
              {{ filteredDevices.length }} visible of {{ devices.length }} devices
              <span v-if="lastRefreshAt"> · Updated {{ formatDateTime(lastRefreshAt) }}</span>
            </p>
          </div>

          <el-input
            v-model="searchKeyword"
            class="search-input"
            clearable
            :prefix-icon="Search"
            placeholder="Search device, name, status"
          />
        </div>

        <el-table
          v-loading="loading"
          :data="filteredDevices"
          class="device-table"
          row-key="deviceCode"
          stripe
        >
          <el-table-column prop="deviceCode" label="Device Code" min-width="160">
            <template #default="{ row }">
              <strong class="device-code">{{ row.deviceCode }}</strong>
            </template>
          </el-table-column>
          <el-table-column prop="deviceName" label="Device Name" min-width="190" />
          <el-table-column label="Status" width="140">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" effect="light" round>
                {{ row.status || "Unknown" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="temperature" label="Temperature" width="150" align="right">
            <template #default="{ row }">
              <el-tag :type="getTemperatureType(row.temperature)" effect="plain" round>
                {{ formatTemperature(row.temperature) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastUpdated" label="Last Updated" min-width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.lastUpdated) }}
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="No devices found" />
          </template>
        </el-table>
      </div>

      <aside class="health-panel">
        <div class="health-header">
          <span class="eyebrow">Line Health</span>
          <h3>Telemetry Snapshot</h3>
        </div>

        <div class="health-ring" :class="{ warning: warningDevices > 0 }">
          <strong>{{ devices.length ? Math.round((onlineDevices / devices.length) * 100) : 0 }}%</strong>
          <span>Online Rate</span>
        </div>

        <div class="health-list">
          <div class="health-item">
            <span>Offline or Idle</span>
            <strong>{{ offlineDevices }}</strong>
          </div>

          <div class="health-item">
            <span>Highest Temp</span>
            <strong>{{ hottestDevice ? formatTemperature(hottestDevice.temperature) : "--" }}</strong>
          </div>

          <div class="health-item">
            <span>Hot Device</span>
            <strong>{{ hottestDevice?.deviceCode || "None" }}</strong>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.device-page {
  display: grid;
  gap: 22px;
}

.page-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  color: #f8fafc;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.86), rgba(8, 145, 178, 0.86)),
    #0f766e;
  border-radius: 8px;
  box-shadow: 0 18px 40px rgba(14, 116, 144, 0.18);
}

.eyebrow {
  display: block;
  color: rgba(240, 253, 250, 0.82);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.2;
  text-transform: uppercase;
}

.page-hero h2 {
  margin: 8px 0 8px;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.15;
}

.page-hero p {
  max-width: 620px;
  margin: 0;
  color: rgba(240, 253, 250, 0.88);
  font-size: 15px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 10px;
}

.live-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  color: #ecfeff;
  font-size: 13px;
  font-weight: 800;
  background: rgba(15, 23, 42, 0.2);
  border: 1px solid rgba(240, 253, 250, 0.28);
  border-radius: 999px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 999px;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.16);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  column-gap: 14px;
  min-height: 104px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 8px;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06);
}

.metric-card span,
.metric-card strong {
  display: block;
}

.metric-card span {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.metric-card strong {
  margin-top: 4px;
  color: #0f172a;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
}

.metric-icon {
  display: grid;
  grid-row: span 2;
  width: 46px;
  height: 46px;
  place-items: center;
  font-size: 22px;
  border-radius: 8px;
}

.metric-icon.blue {
  color: #1d4ed8;
  background: #dbeafe;
}

.metric-icon.green {
  color: #047857;
  background: #d1fae5;
}

.metric-icon.amber {
  color: #b45309;
  background: #fef3c7;
}

.metric-icon.violet {
  color: #6d28d9;
  background: #ede9fe;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  align-items: start;
}

.table-panel,
.health-panel {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 8px;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.07);
}

.panel-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.panel-toolbar h3,
.health-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
}

.panel-toolbar p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 650;
}

.search-input {
  width: min(340px, 100%);
}

.device-table {
  width: 100%;
}

.device-table :deep(.el-table__header th) {
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  background: #f8fafc;
}

.device-table :deep(.el-table__row) {
  height: 58px;
}

.device-code {
  color: #0f172a;
  font-weight: 800;
}

.health-panel {
  display: grid;
  gap: 18px;
  padding: 22px;
}

.health-header .eyebrow {
  color: #64748b;
}

.health-ring {
  display: grid;
  width: 170px;
  height: 170px;
  place-items: center;
  justify-self: center;
  text-align: center;
  background:
    radial-gradient(circle at center, #ffffff 58%, transparent 59%),
    conic-gradient(#10b981 0 78%, #e2e8f0 78% 100%);
  border-radius: 999px;
}

.health-ring.warning {
  background:
    radial-gradient(circle at center, #ffffff 58%, transparent 59%),
    conic-gradient(#f59e0b 0 78%, #e2e8f0 78% 100%);
}

.health-ring strong,
.health-ring span {
  grid-area: 1 / 1;
  display: block;
}

.health-ring strong {
  color: #0f172a;
  font-size: 34px;
  font-weight: 850;
  transform: translateY(-8px);
}

.health-ring span {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  transform: translateY(26px);
}

.health-list {
  display: grid;
  gap: 10px;
}

.health-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px 14px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
}

.health-item span {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.health-item strong {
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
  text-align: right;
}

@media (max-width: 1180px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .page-hero,
  .panel-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-actions {
    flex-wrap: wrap;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
