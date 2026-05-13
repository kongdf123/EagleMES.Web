<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2>Mini MES Login</h2>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="Username" prop="username">
          <el-input v-model="form.username" placeholder="Enter username"></el-input>
        </el-form-item>
        <el-form-item label="Password" prop="password">
          <el-input v-model="form.password" type="password" placeholder="Enter password"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm">Login</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { login } from "@/api/auth";
import { useRouter } from "vue-router";

const router = useRouter();


const form = ref({
  username: "",
  password: "",
});

const rules = {
  username: [
    { required: true, message: "Please enter your username", trigger: "blur" },
  ],
  password: [
    { required: true, message: "Please enter your password", trigger: "blur" },
  ],
};

const submitForm = async () => {
  try {
    const response = await login(form.value);

    localStorage.setItem("token", response.data.token);

    router.push("dashboard");
  } catch (error) {
    console.error("Login failed:", error);
  }
};

</script>
