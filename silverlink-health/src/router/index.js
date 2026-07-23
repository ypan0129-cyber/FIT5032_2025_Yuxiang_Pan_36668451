import { createRouter, createWebHistory } from 'vue-router'
import { initialiseAuth, refreshProfile, useAuth } from '../auth'
import AccessDeniedView from '../views/AccessDeniedView.vue'
import AccountView from '../views/AccountView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import RegisterView from '../views/RegisterView.vue'
import ResourceDetailView from '../views/ResourceDetailView.vue'
import ResourcesView from '../views/ResourcesView.vue'
import StaffView from '../views/StaffView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/resources', name: 'resources', component: ResourcesView },
    { path: '/resources/:id', name: 'resource-detail', component: ResourceDetailView },
    { path: '/login', name: 'login', component: LoginView, meta: { requiresGuest: true } },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresGuest: true },
    },
    { path: '/account', name: 'account', component: AccountView, meta: { requiresAuth: true } },
    {
      path: '/staff',
      name: 'staff',
      component: StaffView,
      meta: { requiresAuth: true, requiredRole: 'staff' },
    },
    { path: '/access-denied', name: 'access-denied', component: AccessDeniedView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})

router.beforeEach(async (to) => {
  await initialiseAuth()
  const authState = useAuth()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiredRole = to.matched.find((record) => record.meta.requiredRole)?.meta.requiredRole

  if (requiresAuth && !authState.user) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (requiredRole) {
    await refreshProfile()

    if (authState.profile?.role !== requiredRole) {
      return { name: 'access-denied' }
    }
  }

  if (to.meta.requiresGuest && authState.user) {
    return { name: 'account' }
  }

  return true
})

export default router
