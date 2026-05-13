<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  Box,
  Bottom,
  Collection,
  Location,
  Refresh,
  Search,
  Top,
  Warning,
} from "@element-plus/icons-vue";
import { getInventory, inboundInventory, outboundInventory } from "@/api/inventory";

interface InventoryItem {
  materialCode: string;
  quantity: number;
  location?: string;
}

interface MovementForm {
  materialCode: string;
  quantity: number;
}

const items = ref<InventoryItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const activeMovement = ref<"inbound" | "outbound">("inbound");
const searchKeyword = ref("");
const formRef = ref<FormInstance>();

const form = ref<MovementForm>({
  materialCode: "",
  quantity: 1,
});

const formRules: FormRules<MovementForm> = {
  materialCode: [{ required: true, message: "Material code is required", trigger: "blur" }],
  quantity: [{ required: true, message: "Quantity is required", trigger: "change" }],
};

const filteredItems = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  if (!keyword) {
    return items.value;
  }

  return items.value.filter((item) => {
    return [item.materialCode, item.location]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });
});

const totalQuantity = computed(() => {
  return items.value.reduce((total, item) => total + Number(item.quantity || 0), 0);
});

const totalLocations = computed(() => {
  return new Set(items.value.map((item) => item.location).filter(Boolean)).size;
});

const lowStockItems = computed(() => {
  return items.value.filter((item) => Number(item.quantity || 0) > 0 && Number(item.quantity || 0) < 10).length;
});

const outOfStockItems = computed(() => {
  return items.value.filter((item) => Number(item.quantity || 0) <= 0).length;
});

const loadData = async () => {
  loading.value = true;

  try {
    const response = await getInventory();
    items.value = response.data;
  } catch {
    ElMessage.error("Unable to load inventory.");
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.value = {
    materialCode: "",
    quantity: 1,
  };
  formRef.value?.clearValidate();
};

const submitMovement = async () => {
  if (!formRef.value) {
    return;
  }

  const isValid = await formRef.value.validate().catch(() => false);

  if (!isValid) {
    return;
  }

  saving.value = true;

  try {
    if (activeMovement.value === "inbound") {
      await inboundInventory(form.value);
      ElMessage.success("Inbound movement posted.");
    } else {
      await outboundInventory(form.value);
      ElMessage.success("Outbound movement posted.");
    }

    resetForm();
    await loadData();
  } catch {
    ElMessage.error("Unable to post inventory movement.");
  } finally {
    saving.value = false;
  }
};

const getStockType = (quantity: number) => {
  if (quantity <= 0) {
    return "danger";
  }

  if (quantity < 10) {
    return "warning";
  }

  return "success";
};

const getStockLabel = (quantity: number) => {
  if (quantity <= 0) {
    return "Out";
  }

  if (quantity < 10) {
    return "Low";
  }

  return "Available";
};

const formatQuantity = (quantity: number) => {
  return new Intl.NumberFormat().format(quantity || 0);
};

onMounted(loadData);
</script>

<template>
  <section class="inventory-page">
    <div class="page-hero">
      <div>
        <span class="eyebrow">Warehouse Control</span>
        <h2>Inventory Balance</h2>
        <p>Monitor material availability, warehouse locations, and stock movements in one focused view.</p>
      </div>

      <div class="hero-actions">
        <el-button :icon="Refresh" :loading="loading" @click="loadData">Refresh</el-button>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-icon blue">
          <el-icon><Collection /></el-icon>
        </div>
        <span>Materials</span>
        <strong>{{ items.length }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon teal">
          <el-icon><Box /></el-icon>
        </div>
        <span>Total Stock</span>
        <strong>{{ formatQuantity(totalQuantity) }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon violet">
          <el-icon><Location /></el-icon>
        </div>
        <span>Locations</span>
        <strong>{{ totalLocations }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon amber">
          <el-icon><Warning /></el-icon>
        </div>
        <span>Needs Attention</span>
        <strong>{{ lowStockItems + outOfStockItems }}</strong>
      </div>
    </div>

    <div class="workspace-grid">
      <div class="table-panel">
        <div class="panel-toolbar">
          <div>
            <h3>Material Stock</h3>
            <p>{{ filteredItems.length }} visible of {{ items.length }} material records</p>
          </div>

          <el-input
            v-model="searchKeyword"
            class="search-input"
            clearable
            :prefix-icon="Search"
            placeholder="Search material or location"
          />
        </div>

        <el-table
          v-loading="loading"
          :data="filteredItems"
          class="inventory-table"
          row-key="materialCode"
          stripe
        >
          <el-table-column prop="materialCode" label="Material" min-width="180">
            <template #default="{ row }">
              <strong class="material-code">{{ row.materialCode }}</strong>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="Location" min-width="160">
            <template #default="{ row }">
              {{ row.location || "Unassigned" }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="Quantity" width="140" align="right">
            <template #default="{ row }">
              {{ formatQuantity(row.quantity) }}
            </template>
          </el-table-column>
          <el-table-column label="Stock Level" width="150">
            <template #default="{ row }">
              <el-tag :type="getStockType(row.quantity)" effect="light" round>
                {{ getStockLabel(row.quantity) }}
              </el-tag>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="No inventory records found" />
          </template>
        </el-table>
      </div>

      <aside class="movement-panel">
        <div class="movement-header">
          <span class="eyebrow">Stock Movement</span>
          <h3>Post Transaction</h3>
        </div>

        <el-segmented
          v-model="activeMovement"
          class="movement-toggle"
          :options="[
            { label: 'Inbound', value: 'inbound' },
            { label: 'Outbound', value: 'outbound' },
          ]"
        />

        <div class="movement-summary" :class="activeMovement">
          <el-icon>
            <Top v-if="activeMovement === 'inbound'" />
            <Bottom v-else />
          </el-icon>
          <div>
            <strong>{{ activeMovement === "inbound" ? "Receive material" : "Issue material" }}</strong>
            <span>{{ activeMovement === "inbound" ? "Add stock to inventory" : "Consume stock from inventory" }}</span>
          </div>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="formRules"
          label-position="top"
          class="movement-form"
        >
          <el-form-item label="Material" prop="materialCode">
            <el-input v-model="form.materialCode" placeholder="MAT-1001" />
          </el-form-item>

          <el-form-item label="Quantity" prop="quantity">
            <el-input-number v-model="form.quantity" :min="1" :step="1" controls-position="right" />
          </el-form-item>

          <el-button
            class="movement-submit"
            :type="activeMovement === 'inbound' ? 'success' : 'warning'"
            :icon="activeMovement === 'inbound' ? Top : Bottom"
            :loading="saving"
            @click="submitMovement"
          >
            {{ activeMovement === "inbound" ? "Post Inbound" : "Post Outbound" }}
          </el-button>
        </el-form>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.inventory-page {
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

.metric-icon.violet {
  color: #6d28d9;
  background: #ede9fe;
}

.metric-icon.amber {
  color: #b45309;
  background: #fef3c7;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: start;
}

.table-panel,
.movement-panel {
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
.movement-header h3 {
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

.inventory-table {
  width: 100%;
}

.inventory-table :deep(.el-table__header th) {
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  background: #f8fafc;
}

.inventory-table :deep(.el-table__row) {
  height: 58px;
}

.material-code {
  color: #0f172a;
  font-weight: 800;
}

.movement-panel {
  display: grid;
  gap: 18px;
  padding: 22px;
}

.movement-header .eyebrow {
  color: #64748b;
}

.movement-toggle {
  width: 100%;
}

.movement-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
}

.movement-summary.inbound {
  color: #047857;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.movement-summary.outbound {
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.movement-summary .el-icon {
  flex-shrink: 0;
  font-size: 24px;
}

.movement-summary strong,
.movement-summary span {
  display: block;
}

.movement-summary strong {
  font-size: 14px;
  font-weight: 800;
}

.movement-summary span {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 650;
}

.movement-form :deep(.el-input-number),
.movement-submit {
  width: 100%;
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
