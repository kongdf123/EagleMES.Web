<script setup lang="ts">
import { ElContainer } from 'element-plus';
import SidebarMenu from '../components/SidebarMenu.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
if (!localStorage.getItem('token')) {
  router.push('/login');
}

const logout = () => {
  localStorage.removeItem('token');
  router.push('/login');
};

</script>
<style scoped>
.header {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  border-bottom: 1px solid #eee;
}

.title {
  padding-left: 16px;
}
</style>
<template>
  <el-container style="height: 100vh;">
    <el-aside width="220px">
      <SidebarMenu />
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="title">Smart Factory Mini MES <el-button @click="logout">Logout</el-button></div>
      </el-header>

      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>
