<template>
  <el-menu router default-active="/dashboard" height="100%">
    <el-menu-item index="/dashboard">Dashboard</el-menu-item>

    <el-menu-item index="/production/workorders">
      Work Orders
    </el-menu-item>

    <el-menu-item index="/warehouse/inventory">
      Inventory
    </el-menu-item>

    <el-menu-item index="/devices/monitor">
      Devices
    </el-menu-item>
  </el-menu>
</template>
