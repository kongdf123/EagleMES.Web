<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { CircleCheck, Goods, Money, Refresh, Search, ShoppingCart, Warning } from "@element-plus/icons-vue";
import { getPurchaseOrders } from "@/api/purchaseOrder";

interface PurchaseOrder {
  id?: number;
  poNo: string;
  supplierId: number | string;
  materialName: string;
  quantity: number;
  status?: string;
}

const purchaseOrders = ref<PurchaseOrder[]>([]);
const loading = ref(false);
const searchKeyword = ref("");
const lastRefreshAt = ref<Date>();

const filteredPurchaseOrders = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  if (!keyword) {
    return purchaseOrders.value;
  }

  return purchaseOrders.value.filter((order) => {
    return [order.poNo, order.supplierId, order.materialName, order.status, String(order.id || "")]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });
});

const totalQuantity = computed(() => {
  return purchaseOrders.value.reduce((total, order) => total + Number(order.quantity || 0), 0);
});

const openOrders = computed(() => {
  return purchaseOrders.value.filter((order) => {
    const status = normalizeStatus(order.status);
    return status.includes("open") || status.includes("pending") || status.includes("release");
  }).length;
});

const receivedOrders = computed(() => {
  return purchaseOrders.value.filter((order) => {
    const status = normalizeStatus(order.status);
    return status.includes("receive") || status.includes("complete") || status.includes("closed");
  }).length;
});

const attentionOrders = computed(() => {
  return purchaseOrders.value.filter((order) => getStatusType(order.status) === "danger").length;
});

const loadData = async () => {
  loading.value = true;

  try {
    const response = await getPurchaseOrders();
    purchaseOrders.value = response.data;
    lastRefreshAt.value = new Date();
  } catch {
    ElMessage.error("Unable to load purchase orders.");
  } finally {
    loading.value = false;
  }
};

const normalizeStatus = (status?: string) => {
  return String(status || "").toLowerCase();
};

const getStatusType = (status?: string) => {
  const normalized = normalizeStatus(status);

  if (normalized.includes("cancel") || normalized.includes("reject") || normalized.includes("fail")) {
    return "danger";
  }

  if (normalized.includes("receive") || normalized.includes("complete") || normalized.includes("closed")) {
    return "success";
  }

  if (normalized.includes("open") || normalized.includes("release") || normalized.includes("progress")) {
    return "primary";
  }

  if (normalized.includes("pending") || normalized.includes("wait") || normalized.includes("hold")) {
    return "warning";
  }

  return "info";
};

const formatQuantity = (quantity: number) => {
  return new Intl.NumberFormat().format(quantity || 0);
};

const formatDateTime = (value?: Date) => {
  if (!value) {
    return "Not refreshed";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
};

onMounted(loadData);
</script>

<template>
  <section class="purchase-order-page">
    <div class="page-hero">
      <div>
        <span class="eyebrow">Supplier Relationship Management</span>
        <h2>Purchase Orders</h2>
        <p>Track supplier commitments, inbound material demand, and purchasing execution status.</p>
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
            <ShoppingCart />
          </el-icon>
        </div>
        <span>Total POs</span>
        <strong>{{ purchaseOrders.length }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon teal">
          <el-icon>
            <Goods />
          </el-icon>
        </div>
        <span>Total Quantity</span>
        <strong>{{ formatQuantity(totalQuantity) }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon amber">
          <el-icon>
            <Money />
          </el-icon>
        </div>
        <span>Open Orders</span>
        <strong>{{ openOrders }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon green">
          <el-icon>
            <CircleCheck />
          </el-icon>
        </div>
        <span>Received</span>
        <strong>{{ receivedOrders }}</strong>
      </div>
    </div>

    <div class="table-panel">
      <div class="panel-toolbar">
        <div>
          <h3>Purchase Order Queue</h3>
          <p>
            {{ filteredPurchaseOrders.length }} visible of {{ purchaseOrders.length }} purchase orders
            <span v-if="attentionOrders"> - {{ attentionOrders }} need attention</span>
          </p>
        </div>

        <el-input
          v-model="searchKeyword"
          class="search-input"
          clearable
          :prefix-icon="Search"
          placeholder="Search PO, supplier, material, status"
        />
      </div>

      <el-table
        v-loading="loading"
        :data="filteredPurchaseOrders"
        class="purchase-order-table"
        row-key="poNo"
        stripe
      >
        <el-table-column prop="poNo" label="PO No" min-width="170">
          <template #default="{ row }">
            <strong class="record-code">{{ row.poNo }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="supplierId" label="Supplier" min-width="130" />
        <el-table-column prop="materialName" label="Material" min-width="220" />
        <el-table-column prop="quantity" label="Qty" width="130" align="right">
          <template #default="{ row }">
            {{ formatQuantity(row.quantity) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Status" width="150">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" round>
              {{ row.status || "New" }}
            </el-tag>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="No purchase orders found" />
        </template>
      </el-table>
    </div>
  </section>
</template>

<style scoped>
.purchase-order-page {
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

.metric-icon.teal {
  color: #0f766e;
  background: #ccfbf1;
}

.metric-icon.amber {
  color: #b45309;
  background: #fef3c7;
}

.metric-icon.green {
  color: #047857;
  background: #d1fae5;
}

.table-panel {
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

.panel-toolbar h3 {
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
  width: min(360px, 100%);
}

.purchase-order-table {
  width: 100%;
}

.purchase-order-table :deep(.el-table__header th) {
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  background: #f8fafc;
}

.purchase-order-table :deep(.el-table__row) {
  height: 58px;
}

.record-code {
  color: #0f172a;
  font-weight: 800;
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
