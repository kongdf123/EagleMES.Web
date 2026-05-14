<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Box,
  Cpu,
  DataAnalysis,
  Refresh,
  Tickets,
  TrendCharts,
  Warning,
} from "@element-plus/icons-vue";
import type { EChartsOption } from "echarts";
import VChart from "vue-echarts";
import { LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { getDevices } from "@/api/device";
import { getInventory } from "@/api/inventory";
import { getWorkOrders } from "@/api/workorder";

interface WorkOrder {
  id: number;
  orderNo: string;
  productCode: string;
  quantity: number;
  status?: string;
}

interface InventoryItem {
  materialCode: string;
  quantity: number;
  location?: string;
}

interface Device {
  deviceCode: string;
  deviceName: string;
  status: string;
  temperature?: number;
  lastUpdated?: string;
}

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
]);

const workOrders = ref<WorkOrder[]>([]);
const inventory = ref<InventoryItem[]>([]);
const devices = ref<Device[]>([]);
const loading = ref(false);
const lastRefreshAt = ref<Date>();

const activeOrders = computed(() => {
  return workOrders.value.filter((order) => {
    const status = String(order.status || "").toLowerCase();
    return status.includes("progress") || status.includes("run") || status.includes("release");
  }).length;
});

const completedOrders = computed(() => {
  return workOrders.value.filter((order) => {
    const status = String(order.status || "").toLowerCase();
    return status.includes("complete") || status.includes("done") || status.includes("closed");
  }).length;
});

const totalOrderQuantity = computed(() => {
  return workOrders.value.reduce((total, order) => total + Number(order.quantity || 0), 0);
});

const totalInventoryQuantity = computed(() => {
  return inventory.value.reduce((total, item) => total + Number(item.quantity || 0), 0);
});

const lowStockItems = computed(() => {
  return inventory.value.filter((item) => Number(item.quantity || 0) > 0 && Number(item.quantity || 0) < 10).length;
});

const outOfStockItems = computed(() => {
  return inventory.value.filter((item) => Number(item.quantity || 0) <= 0).length;
});

const warningDevices = computed(() => {
  return devices.value.filter((device) => isWarningStatus(device.status)).length;
});

const onlineDevices = computed(() => {
  return devices.value.filter((device) => isOnlineStatus(device.status)).length;
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

const productionCompletionRate = computed(() => {
  if (!workOrders.value.length) {
    return 0;
  }

  return Math.round((completedOrders.value / workOrders.value.length) * 100);
});

const equipmentOnlineRate = computed(() => {
  if (!devices.value.length) {
    return 0;
  }

  return Math.round((onlineDevices.value / devices.value.length) * 100);
});

const attentionCount = computed(() => {
  return warningDevices.value + lowStockItems.value + outOfStockItems.value;
});

const recentOrders = computed(() => {
  return workOrders.value.slice(0, 5);
});

const attentionMaterials = computed(() => {
  return inventory.value
    .filter((item) => Number(item.quantity || 0) < 700)
    .sort((first, second) => Number(first.quantity || 0) - Number(second.quantity || 0))
    .slice(0, 5);
});

const productionChartOption = computed<EChartsOption>(() => {
  const chartOrders = workOrders.value.slice(0, 7).reverse();
  const hasOrders = chartOrders.length > 0;
  const labels = hasOrders ? chartOrders.map((order) => order.orderNo) : ["No orders"];
  const quantities = hasOrders ? chartOrders.map((order) => Number(order.quantity || 0)) : [0];

  return {
    color: ["#2563eb"],
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => formatQuantity(Number(value)),
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: {
        color: "#64748b",
        fontWeight: 700,
      },
    },
    grid: {
      top: 44,
      right: 18,
      bottom: 42,
      left: 56,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: labels,
      axisLine: {
        lineStyle: {
          color: "#cbd5e1",
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: "#64748b",
        fontWeight: 700,
        hideOverlap: true,
      },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: {
        color: "#64748b",
        formatter: (value: number) => formatQuantity(value),
      },
      splitLine: {
        lineStyle: {
          color: "#e2e8f0",
          type: "dashed",
        },
      },
    },
    series: [
      {
        name: "Order Quantity",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        data: quantities,
        lineStyle: {
          width: 3,
        },
        areaStyle: {
          color: "rgba(37, 99, 235, 0.12)",
        },
        emphasis: {
          focus: "series",
        },
      },
    ],
  };
});

const loadData = async () => {
  loading.value = true;

  try {
    const [workOrderResponse, inventoryResponse, deviceResponse] = await Promise.all([
      getWorkOrders(),
      getInventory(),
      getDevices(),
    ]);

    workOrders.value = workOrderResponse.data;
    inventory.value = inventoryResponse.data;
    devices.value = deviceResponse.data;
    lastRefreshAt.value = new Date();
  } catch {
    ElMessage.error("Unable to load dashboard data.");
  } finally {
    loading.value = false;
  }
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

  if (isWarningStatus(normalized) || normalized.includes("cancel") || normalized.includes("fail")) {
    return "danger";
  }

  if (isOnlineStatus(normalized) || normalized.includes("complete") || normalized.includes("done")) {
    return "success";
  }

  if (normalized.includes("hold") || normalized.includes("pending") || normalized.includes("idle")) {
    return "warning";
  }

  return "info";
};

const formatQuantity = (quantity: number) => {
  return new Intl.NumberFormat().format(quantity || 0);
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
    return "Not refreshed";
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

onMounted(loadData);
</script>

<template>
  <section class="dashboard-page">
    <div class="page-hero">
      <div>
        <span class="eyebrow">Factory Overview</span>
        <h2>Operations Dashboard</h2>
        <p>Monitor production demand, warehouse availability, and equipment health from one command view.</p>
      </div>

      <div class="hero-actions">
        <div class="refresh-note">Updated {{ formatDateTime(lastRefreshAt) }}</div>
        <el-button :icon="Refresh" :loading="loading" @click="loadData">Refresh</el-button>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-icon blue">
          <el-icon>
            <Tickets />
          </el-icon>
        </div>
        <span>Work Orders</span>
        <strong>{{ workOrders.length }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon teal">
          <el-icon>
            <Box />
          </el-icon>
        </div>
        <span>Inventory Stock</span>
        <strong>{{ formatQuantity(totalInventoryQuantity) }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon green">
          <el-icon>
            <Cpu />
          </el-icon>
        </div>
        <span>Devices Online</span>
        <strong>{{ onlineDevices }}/{{ devices.length }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon amber">
          <el-icon>
            <Warning />
          </el-icon>
        </div>
        <span>Needs Attention</span>
        <strong>{{ attentionCount }}</strong>
      </div>
    </div>

    <div class="overview-grid">
      <div class="score-panel">
        <div class="panel-heading">
          <span class="eyebrow">Performance</span>
          <h3>Today’s Operating Picture</h3>
        </div>

        <div class="score-row">
          <div class="score-ring production">
            <strong>{{ productionCompletionRate }}%</strong>
            <span>Orders Complete</span>
          </div>

          <div class="score-ring equipment" :class="{ warning: warningDevices > 0 }">
            <strong>{{ equipmentOnlineRate }}%</strong>
            <span>Equipment Online</span>
          </div>
        </div>

        <div class="summary-list">
          <div class="summary-item">
            <span>Active Orders</span>
            <strong>{{ activeOrders }}</strong>
          </div>
          <div class="summary-item">
            <span>Order Quantity</span>
            <strong>{{ formatQuantity(totalOrderQuantity) }}</strong>
          </div>
          <div class="summary-item">
            <span>Low Stock Materials</span>
            <strong>{{ lowStockItems + outOfStockItems }}</strong>
          </div>
          <div class="summary-item">
            <span>Average Temperature</span>
            <strong>{{ formatTemperature(averageTemperature) }}</strong>
          </div>
        </div>
      </div>

      <div class="quick-links">
        <div class="panel-heading">
          <span class="eyebrow">Navigation</span>
          <h3>Operations Shortcuts</h3>
        </div>

        <RouterLink class="quick-link" to="/production/workorders">
          <el-icon>
            <Tickets />
          </el-icon>
          <div>
            <strong>Work Orders</strong>
            <span>Plan and review production demand</span>
          </div>
        </RouterLink>

        <RouterLink class="quick-link" to="/warehouse/inventory">
          <el-icon>
            <Box />
          </el-icon>
          <div>
            <strong>Inventory</strong>
            <span>Check stock and post movements</span>
          </div>
        </RouterLink>

        <RouterLink class="quick-link" to="/devices/monitor">
          <el-icon>
            <DataAnalysis />
          </el-icon>
          <div>
            <strong>Devices</strong>
            <span>Watch telemetry and warnings</span>
          </div>
        </RouterLink>
      </div>
    </div>

    <div class="detail-grid">
      <div class="table-panel">
        <div class="panel-toolbar">
          <div>
            <h3>Recent Work Orders</h3>
            <p>{{ recentOrders.length }} latest records</p>
          </div>

          <el-icon>
            <TrendCharts />
          </el-icon>
        </div>

        <el-table v-loading="loading" :data="recentOrders" class="dashboard-table" row-key="id" stripe>
          <el-table-column prop="orderNo" label="Order No" min-width="150">
            <template #default="{ row }">
              <strong class="record-code">{{ row.orderNo }}</strong>
            </template>
          </el-table-column>
          <el-table-column prop="productCode" label="Product" min-width="140" />
          <el-table-column prop="quantity" label="Qty" width="100" align="right">
            <template #default="{ row }">
              {{ formatQuantity(row.quantity) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="Status" width="130">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" effect="light" round>
                {{ row.status || "New" }}
              </el-tag>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="No work orders found" />
          </template>
        </el-table>
      </div>

      <div class="table-panel">
        <div class="panel-toolbar">
          <div>
            <h3>Stock Watchlist</h3>
            <p>{{ attentionMaterials.length }} materials below threshold</p>
          </div>

          <el-icon>
            <Warning />
          </el-icon>
        </div>

        <el-table v-loading="loading" :data="attentionMaterials" class="dashboard-table" row-key="materialCode" stripe>
          <el-table-column prop="materialCode" label="Material" min-width="150">
            <template #default="{ row }">
              <strong class="record-code">{{ row.materialCode }}</strong>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="Location" min-width="130">
            <template #default="{ row }">
              {{ row.location || "Unassigned" }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="Qty" width="100" align="right">
            <template #default="{ row }">
              {{ formatQuantity(row.quantity) }}
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="No low stock materials" />
          </template>
        </el-table>
      </div>
    </div>

    <div v-loading="loading" class="chart-panel">
      <div class="panel-toolbar">
        <div>
          <h3>Production Quantity Trend</h3>
          <p>Latest {{ Math.min(workOrders.length, 7) }} work orders by quantity</p>
        </div>

        <el-icon>
          <TrendCharts />
        </el-icon>
      </div>

      <VChart class="chart" :option="productionChartOption" autoresize />
    </div>
  </section>
</template>

<style scoped>
.dashboard-page {
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
    linear-gradient(135deg, rgba(37, 99, 235, 0.86), rgba(20, 184, 166, 0.84)),
    #0f766e;
  border-radius: 8px;
  box-shadow: 0 18px 40px rgba(15, 118, 110, 0.18);
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
  max-width: 650px;
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

.refresh-note {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  color: #ecfeff;
  font-size: 13px;
  font-weight: 800;
  background: rgba(15, 23, 42, 0.2);
  border: 1px solid rgba(240, 253, 250, 0.28);
  border-radius: 999px;
}

.metric-grid,
.detail-grid {
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

.metric-icon.teal {
  color: #0f766e;
  background: #ccfbf1;
}

.metric-icon.green {
  color: #047857;
  background: #d1fae5;
}

.metric-icon.amber {
  color: #b45309;
  background: #fef3c7;
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: stretch;
}

.score-panel,
.quick-links,
.table-panel,
.chart-panel {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 8px;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.07);
}

.score-panel,
.quick-links {
  display: grid;
  gap: 18px;
  padding: 22px;
}

.panel-heading .eyebrow {
  color: #64748b;
}

.panel-heading h3,
.panel-toolbar h3 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
}

.score-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.score-ring {
  display: grid;
  min-height: 170px;
  place-items: center;
  text-align: center;
  background:
    radial-gradient(circle at center, #ffffff 58%, transparent 59%),
    conic-gradient(#2563eb 0 72%, #e2e8f0 72% 100%);
  border-radius: 8px;
}

.score-ring.equipment {
  background:
    radial-gradient(circle at center, #ffffff 58%, transparent 59%),
    conic-gradient(#10b981 0 78%, #e2e8f0 78% 100%);
}

.score-ring.equipment.warning {
  background:
    radial-gradient(circle at center, #ffffff 58%, transparent 59%),
    conic-gradient(#f59e0b 0 78%, #e2e8f0 78% 100%);
}

.score-ring strong,
.score-ring span {
  grid-area: 1 / 1;
  display: block;
}

.score-ring strong {
  color: #0f172a;
  font-size: 34px;
  font-weight: 850;
  transform: translateY(-8px);
}

.score-ring span {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  transform: translateY(26px);
}

.summary-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.summary-item,
.quick-link {
  padding: 14px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
}

.summary-item span,
.summary-item strong {
  display: block;
}

.summary-item span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.summary-item strong {
  margin-top: 4px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.quick-link:hover {
  background: #ffffff;
  border-color: rgba(37, 99, 235, 0.28);
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.quick-link .el-icon {
  display: grid;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  place-items: center;
  color: #1d4ed8;
  font-size: 20px;
  background: #dbeafe;
  border-radius: 8px;
}

.quick-link strong,
.quick-link span {
  display: block;
}

.quick-link strong {
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
}

.quick-link span {
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
  font-weight: 650;
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.panel-toolbar p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 650;
}

.panel-toolbar .el-icon {
  color: #64748b;
  font-size: 22px;
}

.dashboard-table {
  width: 100%;
}

.dashboard-table :deep(.el-table__header th) {
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  background: #f8fafc;
}

.dashboard-table :deep(.el-table__row) {
  height: 58px;
}

.record-code {
  color: #0f172a;
  font-weight: 800;
}

@media (max-width: 1180px) {

  .overview-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .summary-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .page-hero {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-actions,
  .panel-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .metric-grid,
  .score-row,
  .summary-list {
    grid-template-columns: 1fr;
  }
}

.chart {
  width: 100%;
  height: 360px;
  padding: 8px 14px 18px;
}
</style>
