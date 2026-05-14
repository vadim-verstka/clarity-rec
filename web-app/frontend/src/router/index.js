import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import UserList from "../views/UserList.vue";
import UserFeed from "../views/UserFeed.vue";
import UserProfile from "../views/UserProfile.vue";

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", name: "Login", component: Login },
  {
    path: "/users",
    name: "UserList",
    component: UserList,
    meta: { requiresAuth: true },
  },
  {
    path: "/user/:userId/feed",
    name: "UserFeed",
    component: UserFeed,
    meta: { requiresAuth: true },
  },
  {
    path: "/user/:userId/profile",
    name: "UserProfile",
    component: UserProfile,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("adminToken");
  if (to.meta.requiresAuth && !token) {
    next("/login");
  } else {
    next();
  }
});

export default router;
