<template>
  <div class="login-page">
    <section class="login-visual" aria-label="Smart factory overview">
      <div class="brand-row">
        <div class="brand-mark">
          <el-icon><Finished /></el-icon>
        </div>
        <div>
          <strong>EagleMES</strong>
          <span>Smart Factory Mini MES</span>
        </div>
      </div>

      <div class="visual-copy">
        <span class="eyebrow">Manufacturing Execution</span>
        <h1>Control production, inventory, and devices from one live console.</h1>
      </div>

      <div class="metric-grid">
        <div class="metric-card">
          <span>Orders</span>
          <strong>128</strong>
        </div>
        <div class="metric-card">
          <span>Output</span>
          <strong>3.2k</strong>
        </div>
        <div class="metric-card">
          <span>Devices</span>
          <strong>24</strong>
        </div>
      </div>
    </section>

    <section class="login-panel">
      <div class="login-card">
        <div class="card-heading">
          <span>Welcome back</span>
          <h2>Sign in to your workspace</h2>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="login-form"
          @keyup.enter="submitForm"
        >
          <el-form-item label="Username" prop="username">
            <el-input
              v-model="form.username"
              :prefix-icon="User"
              placeholder="Enter username"
              size="large"
            />
          </el-form-item>

          <el-form-item label="Password" prop="password">
            <el-input
              v-model="form.password"
              :prefix-icon="Lock"
              type="password"
              placeholder="Enter password"
              show-password
              size="large"
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="loading"
            @click="submitForm"
          >
            Login
          </el-button>
        </el-form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Finished, Lock, User } from '@element-plus/icons-vue'
import { login } from '@/api/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = ref({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: 'Please enter your username', trigger: 'blur' }],
  password: [{ required: true, message: 'Please enter your password', trigger: 'blur' }],
}

const submitForm = async () => {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true

  try {
    const response = await login(form.value)

    localStorage.setItem('token', response.data.token)

    router.push('/dashboard')
  } catch (error) {
    console.error('Login failed:', error)
    ElMessage.error('Login failed. Please check your credentials.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: minmax(420px, 1.05fr) minmax(360px, 0.95fr);
  min-height: 100vh;
  color: #0f172a;
  background:
    radial-gradient(circle at 82% 16%, rgba(20, 184, 166, 0.18), transparent 26rem),
    linear-gradient(135deg, #f8fafc 0%, #e9f1f7 100%);
}

.login-visual {
  display: flex;
  position: relative;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;
  overflow: hidden;
  color: #f8fafc;
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(15, 91, 111, 0.84)),
    linear-gradient(45deg, #0f172a, #155e75);
}

.login-visual::before {
  position: absolute;
  inset: 96px 36px auto auto;
  width: 260px;
  height: 260px;
  content: '';
  background:
    linear-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.16) 1px, transparent 1px);
  background-size: 28px 28px;
  opacity: 0.35;
  transform: rotate(8deg);
}

.brand-row,
.visual-copy,
.metric-grid {
  position: relative;
  z-index: 1;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-mark {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  background: linear-gradient(135deg, #0ea5e9, #14b8a6);
  border-radius: 8px;
  box-shadow: 0 14px 28px rgba(14, 165, 233, 0.28);
}

.brand-row strong,
.brand-row span {
  display: block;
  line-height: 1.2;
}

.brand-row strong {
  font-size: 20px;
  font-weight: 850;
}

.brand-row span {
  margin-top: 4px;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 650;
}

.visual-copy {
  max-width: 620px;
  margin: 88px 0;
}

.eyebrow,
.card-heading span {
  display: block;
  color: #67e8f9;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.visual-copy h1 {
  margin: 14px 0 0;
  font-size: 44px;
  font-weight: 850;
  line-height: 1.08;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  padding: 18px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.metric-card span,
.metric-card strong {
  display: block;
}

.metric-card span {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 650;
}

.metric-card strong {
  margin-top: 8px;
  font-size: 30px;
  font-weight: 850;
  line-height: 1;
}

.login-panel {
  display: grid;
  place-items: center;
  padding: 32px;
}

.login-card {
  width: min(100%, 430px);
  padding: 34px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
}

.card-heading {
  margin-bottom: 28px;
}

.card-heading span {
  color: #0891b2;
}

.card-heading h2 {
  margin: 8px 0 0;
  color: #0f172a;
  font-size: 28px;
  font-weight: 850;
  line-height: 1.2;
}

.login-form :deep(.el-form-item__label) {
  color: #334155;
  font-weight: 750;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #dbe4ee inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #0891b2 inset;
}

.login-button {
  width: 100%;
  margin-top: 8px;
  border: 0;
  border-radius: 8px;
  font-weight: 800;
  background: linear-gradient(135deg, #2563eb, #0891b2);
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-visual {
    min-height: 360px;
    padding: 28px;
  }

  .visual-copy {
    margin: 58px 0 34px;
  }

  .visual-copy h1 {
    font-size: 32px;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .login-panel {
    padding: 24px;
  }
}
</style>
