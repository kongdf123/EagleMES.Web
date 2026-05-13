<template>
  <div>
    <h1>Dashboard</h1>
    <p>Welcome to the dashboard view!</p>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <p>Today's Orders.</p>
          <h1>100</h1>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card>
          <div>Output</div>
          <h1>3200</h1>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card>
          <div>Devices Online</div>
          <h1>6</h1>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card>
          <div>Alerts</div>
          <h1>1</h1>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
