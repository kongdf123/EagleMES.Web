<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  Box,
  CircleCheck,
  Plus,
  Refresh,
  Search,
  Tickets,
  Warning,
} from "@element-plus/icons-vue";
import { createWorkOrder, getWorkOrders } from "@/api/workorder";

interface WorkOrder {
  id: number;
  orderNo: string;
  productCode: string;
  quantity: number;
  status?: string;
}

interface WorkOrderForm {
  orderNo: string;
  productCode: string;
  quantity: number;
}

const workOrders = ref<WorkOrder[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const searchKeyword = ref("");
const formRef = ref<FormInstance>();

const form = ref<WorkOrderForm>({
  orderNo: "",
  productCode: "",
  quantity: 1,
});

const formRules: FormRules<WorkOrderForm> = {
  orderNo: [{ required: true, message: "Order number is required", trigger: "blur" }],
  productCode: [{ required: true, message: "Product code is required", trigger: "blur" }],
  quantity: [{ required: true, message: "Quantity is required", trigger: "change" }],
};

const filteredWorkOrders = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  if (!keyword) {
    return workOrders.value;
  }

  return workOrders.value.filter((order) => {
    return [order.orderNo, order.productCode, order.status, String(order.id)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });
});

const totalQuantity = computed(() => {
  return workOrders.value.reduce((total, order) => total + Number(order.quantity || 0), 0);
});

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

const pendingOrders = computed(() => {
  return Math.max(workOrders.value.length - activeOrders.value - completedOrders.value, 0);
});

const loadData = async () => {
  loading.value = true;

  try {
    const response = await getWorkOrders();
    workOrders.value = response.data;
  } catch {
    ElMessage.error("Unable to load work orders.");
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.value = {
    orderNo: "",
    productCode: "",
    quantity: 1,
  };
  formRef.value?.clearValidate();
};

const handleCreate = async () => {
  if (!formRef.value) {
    return;
  }

  const isValid = await formRef.value.validate().catch(() => false);

  if (!isValid) {
    return;
  }

  saving.value = true;

  try {
    await createWorkOrder(form.value);
    ElMessage.success("Work order created.");
    dialogVisible.value = false;
    resetForm();

    await loadData();
  } catch {
    ElMessage.error("Unable to create work order.");
  } finally {
    saving.value = false;
  }
};

const openCreateDialog = () => {
  resetForm();
  dialogVisible.value = true;
};

const getStatusType = (status?: string) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("complete") || normalized.includes("done") || normalized.includes("closed")) {
    return "success";
  }

  if (normalized.includes("progress") || normalized.includes("run") || normalized.includes("release")) {
    return "primary";
  }

  if (normalized.includes("hold") || normalized.includes("pending") || normalized.includes("wait")) {
    return "warning";
  }

  if (normalized.includes("cancel") || normalized.includes("fail") || normalized.includes("reject")) {
    return "danger";
  }

  return "info";
};

const formatQuantity = (quantity: number) => {
  return new Intl.NumberFormat().format(quantity || 0);
};

onMounted(loadData);
</script>

<template>
  <section class="work-order-page">
    <div class="page-hero">
      <div>
        <span class="eyebrow">Production Control</span>
        <h2>Work Order Board</h2>
        <p>Track released orders, product demand, and shop-floor execution status.</p>
      </div>

      <div class="hero-actions">
        <el-button :icon="Refresh" :loading="loading" @click="loadData">Refresh</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">Create Work Order</el-button>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-icon blue">
          <el-icon>
            <Tickets />
          </el-icon>
        </div>
        <span>Total Orders</span>
        <strong>{{ workOrders.length }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon teal">
          <el-icon>
            <Box />
          </el-icon>
        </div>
        <span>Total Quantity</span>
        <strong>{{ formatQuantity(totalQuantity) }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon amber">
          <el-icon>
            <Warning />
          </el-icon>
        </div>
        <span>Pending Review</span>
        <strong>{{ pendingOrders }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon green">
          <el-icon>
            <CircleCheck />
          </el-icon>
        </div>
        <span>Completed</span>
        <strong>{{ completedOrders }}</strong>
      </div>
    </div>

    <div class="table-panel">
      <div class="panel-toolbar">
        <div>
          <h3>Order Queue</h3>
          <p>{{ filteredWorkOrders.length }} visible of {{ workOrders.length }} total orders</p>
        </div>

        <el-input v-model="searchKeyword" class="search-input" clearable :prefix-icon="Search"
          placeholder="Search orders, products, status" />
      </div>

      <el-table v-loading="loading" :data="filteredWorkOrders" class="work-order-table" row-key="id" stripe>
        <el-table-column prop="id" label="ID" width="86" />
        <el-table-column prop="orderNo" label="Order No" min-width="180">
          <template #default="{ row }">
            <strong class="order-no">{{ row.orderNo }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="productCode" label="Product Code" min-width="180" />
        <el-table-column prop="quantity" label="Quantity" width="140" align="right">
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
          <el-empty description="No work orders found" />
        </template>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="Create Work Order" width="480px" class="work-order-dialog"
      @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" class="work-order-form">
        <el-form-item label="Order No" prop="orderNo">
          <el-input v-model="form.orderNo" placeholder="WO-2026-001" />
        </el-form-item>

        <el-form-item label="Product Code" prop="productCode">
          <el-input v-model="form.productCode" placeholder="FG-1001" />
        </el-form-item>

        <el-form-item label="Quantity" prop="quantity">
          <el-input-number v-model="form.quantity" :min="1" :step="1" controls-position="right" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="handleCreate">
          Save
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.work-order-page {
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
    linear-gradient(135deg, rgba(14, 165, 233, 0.88), rgba(20, 184, 166, 0.86)),
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
  flex-shrink: 0;
  gap: 10px;
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

.work-order-table {
  width: 100%;
}

.work-order-table :deep(.el-table__header th) {
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  background: #f8fafc;
}

.work-order-table :deep(.el-table__row) {
  height: 58px;
}

.order-no {
  color: #0f172a;
  font-weight: 800;
}

.work-order-form :deep(.el-input-number) {
  width: 100%;
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
