<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { OfficeBuilding, Refresh, Search, User, Van } from "@element-plus/icons-vue";
import { getSuppliers } from "@/api/supplier";

interface Supplier {
  id?: number;
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  phone?: string;
}

const suppliers = ref<Supplier[]>([]);
const loading = ref(false);
const searchKeyword = ref("");
const lastRefreshAt = ref<Date>();

const filteredSuppliers = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  if (!keyword) {
    return suppliers.value;
  }

  return suppliers.value.filter((supplier) => {
    return [
      supplier.supplierCode,
      supplier.supplierName,
      supplier.contactPerson,
      supplier.phone,
      String(supplier.id || ""),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });
});

const suppliersWithContacts = computed(() => {
  return suppliers.value.filter((supplier) => supplier.contactPerson || supplier.phone).length;
});

const missingContactSuppliers = computed(() => {
  return suppliers.value.filter((supplier) => !supplier.contactPerson && !supplier.phone).length;
});

const loadData = async () => {
  loading.value = true;

  try {
    const response = await getSuppliers();
    suppliers.value = response.data;
    lastRefreshAt.value = new Date();
  } catch {
    ElMessage.error("Unable to load suppliers.");
  } finally {
    loading.value = false;
  }
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
  <section class="supplier-page">
    <div class="page-hero">
      <div>
        <span class="eyebrow">Supplier Relationship Management</span>
        <h2>Supplier Directory</h2>
        <p>Review qualified suppliers, purchasing contacts, and vendor communication details.</p>
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
            <OfficeBuilding />
          </el-icon>
        </div>
        <span>Total Suppliers</span>
        <strong>{{ suppliers.length }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon green">
          <el-icon>
            <User />
          </el-icon>
        </div>
        <span>With Contacts</span>
        <strong>{{ suppliersWithContacts }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon amber">
          <el-icon>
            <Van />
          </el-icon>
        </div>
        <span>Needs Follow-Up</span>
        <strong>{{ missingContactSuppliers }}</strong>
      </div>
    </div>

    <div class="table-panel">
      <div class="panel-toolbar">
        <div>
          <h3>Supplier Master</h3>
          <p>{{ filteredSuppliers.length }} visible of {{ suppliers.length }} suppliers</p>
        </div>

        <el-input
          v-model="searchKeyword"
          class="search-input"
          clearable
          :prefix-icon="Search"
          placeholder="Search code, name, contact, phone"
        />
      </div>

      <el-table v-loading="loading" :data="filteredSuppliers" class="supplier-table" row-key="supplierCode" stripe>
        <el-table-column prop="supplierCode" label="Code" min-width="150">
          <template #default="{ row }">
            <strong class="record-code">{{ row.supplierCode }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="supplierName" label="Name" min-width="220" />
        <el-table-column prop="contactPerson" label="Contact" min-width="170">
          <template #default="{ row }">
            {{ row.contactPerson || "Unassigned" }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="Phone" min-width="160">
          <template #default="{ row }">
            {{ row.phone || "--" }}
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="No suppliers found" />
        </template>
      </el-table>
    </div>
  </section>
</template>

<style scoped>
.supplier-page {
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
    linear-gradient(135deg, rgba(14, 165, 233, 0.88), rgba(15, 118, 110, 0.86)),
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.supplier-table {
  width: 100%;
}

.supplier-table :deep(.el-table__header th) {
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  background: #f8fafc;
}

.supplier-table :deep(.el-table__row) {
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
