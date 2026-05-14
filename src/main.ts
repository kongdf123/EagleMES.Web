import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import VChart from "vue-echarts";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.component("VChart", VChart);

app.mount("#app");
