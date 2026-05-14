<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { Bell, Clock, Document, Refresh, Search, Warning } from "@element-plus/icons-vue";
import { getEventLogs } from "@/api/eventlog";

interface EventLog {
  id: number;
  eventType: string;
  message: string;
  createdAt: string;
}

const eventLogs = ref<EventLog[]>([]);
const loading = ref(false);
const searchKeyword = ref("");
const lastRefreshAt = ref<Date>();

const filteredEventLogs = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  if (!keyword) {
    return eventLogs.value;
  }

  return eventLogs.value.filter((log) => {
    return [log.eventType, log.message, log.createdAt, String(log.id)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });
});

const warningLogs = computed(() => {
  return eventLogs.value.filter((log) => getEventType(log) === "warning").length;
});

const errorLogs = computed(() => {
  return eventLogs.value.filter((log) => getEventType(log) === "danger").length;
});

const infoLogs = computed(() => {
  return Math.max(eventLogs.value.length - warningLogs.value - errorLogs.value, 0);
});

const latestEventAt = computed(() => {
  return [...eventLogs.value]
    .map((log) => new Date(log.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((first, second) => second.getTime() - first.getTime())[0];
});

const loadData = async () => {
  loading.value = true;

  try {
    const response = await getEventLogs();
    eventLogs.value = response.data;
    lastRefreshAt.value = new Date();
  } catch {
    ElMessage.error("Unable to load event logs.");
  } finally {
    loading.value = false;
  }
};

const getEventType = (log: EventLog) => {
  const value = `${log.eventType || ""} ${log.message || ""}`.toLowerCase();

  if (value.includes("error") || value.includes("fail") || value.includes("fault") || value.includes("alarm")) {
    return "danger";
  }

  if (value.includes("warn") || value.includes("timeout") || value.includes("pending")) {
    return "warning";
  }

  if (value.includes("success") || value.includes("complete") || value.includes("normal")) {
    return "success";
  }

  return "info";
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
    second: "2-digit",
  }).format(date);
};

onMounted(loadData);
</script>

<template>
  <section class="event-log-page">
    <div class="page-hero">
      <div>
        <span class="eyebrow">System Audit</span>
        <h2>Event Logs</h2>
        <p>Review recent system activity, alarms, warnings, and operator-visible events.</p>
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
            <Document />
          </el-icon>
        </div>
        <span>Total Events</span>
        <strong>{{ eventLogs.length }}</strong>
      </div>

      <div class="metric-card compact">
        <div class="metric-icon red">
          <el-icon>
            <Bell />
          </el-icon>
        </div>
        <span>Errors</span>
        <strong>{{ errorLogs }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon amber">
          <el-icon>
            <Warning />
          </el-icon>
        </div>
        <span>Warnings</span>
        <strong>{{ warningLogs }}</strong>
      </div>

      <div class="metric-card">
        <div class="metric-icon teal">
          <el-icon>
            <Clock />
          </el-icon>
        </div>
        <span>Latest Event</span>
        <strong>{{ latestEventAt ? formatDateTime(latestEventAt) : "--" }}</strong>
      </div>
    </div>

    <div class="table-panel">
      <div class="panel-toolbar">
        <div>
          <h3>Event Stream</h3>
          <p>
            {{ filteredEventLogs.length }} visible of {{ eventLogs.length }} total events
            <span v-if="eventLogs.length"> - {{ infoLogs }} informational</span>
          </p>
        </div>

        <el-input
          v-model="searchKeyword"
          class="search-input"
          clearable
          :prefix-icon="Search"
          placeholder="Search type, message, time"
        />
      </div>

      <el-table v-loading="loading" :data="filteredEventLogs" class="event-log-table" row-key="id" stripe>
        <el-table-column prop="id" label="ID" width="86" />
        <el-table-column prop="eventType" label="Type" width="150">
          <template #default="{ row }">
            <el-tag :type="getEventType(row)" effect="light" round>
              {{ row.eventType || "Event" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="Message" min-width="320">
          <template #default="{ row }">
            <span class="event-message">{{ row.message || "--" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="Time" min-width="190">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="No event logs found" />
        </template>
      </el-table>
    </div>
  </section>
</template>

<style scoped>
.event-log-page {
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
    linear-gradient(135deg, rgba(37, 99, 235, 0.86), rgba(14, 116, 144, 0.86)),
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

.metric-card.compact strong {
  font-size: 18px;
  line-height: 1.25;
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

.metric-icon.red {
  color: #b91c1c;
  background: #fee2e2;
}

.metric-icon.amber {
  color: #b45309;
  background: #fef3c7;
}

.metric-icon.teal {
  color: #0f766e;
  background: #ccfbf1;
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

.event-log-table {
  width: 100%;
}

.event-log-table :deep(.el-table__header th) {
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  background: #f8fafc;
}

.event-log-table :deep(.el-table__row) {
  height: 58px;
}

.event-message {
  color: #0f172a;
  font-weight: 700;
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
