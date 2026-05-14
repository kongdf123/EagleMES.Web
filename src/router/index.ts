import MainLayout from "@/layouts/MainLayout.vue";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/login",
      component: () => import("../views/login/LoginView.vue"),
    },
    {
      path: "/",
      component: MainLayout,
      children: [
        {
          path: "dashboard",
          name: "dashboard",
          component: () => import("../views/dashboard/DashboardView.vue"),
        },
        {
          path: "production/workorders",
          name: "work-orders",
          component: () => import("../views/production/WorkOrderView.vue"),
        },
        {
          path: "warehouse/inventory",
          name: "inventory",
          component: () => import("../views/warehouse/InventoryView.vue"),
        },
        {
          path: "srm/suppliers",
          name: "suppliers",
          component: () => import("../views/srm/SupplierView.vue"),
        },
        {
          path: "srm/purchase-orders",
          name: "purchase-orders",
          component: () => import("../views/srm/PurchaseOrderView.vue"),
        },
        {
          path: "devices/monitor",
          name: "devices",
          component: () => import("../views/devices/DeviceView.vue"),
        },
        {
          path: "system/eventlogs",
          name: "event-logs",
          component: () => import("../views/system/EventLogsView.vue"),
        },
      ],
    },
    // {
    //   path: "/about",
    //   name: "about",
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import("../views/AboutView.vue"),
    // },
  ],
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token && to.path !== "/login") {
    return next("/login");
  }

  const roleMap: Record<string, string[]> = {
    "/inventory": ["Admin", "Warehouse"],
    "/suppliers": ["Admin", "Planner"],
    "/purchase-orders": ["Admin", "Planner"],
  };

  const allowedRoles = roleMap[to.path];

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return next("/dashboard");
  }

  next();
});

export default router;
