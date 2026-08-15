import { createRouter, createWebHistory } from 'vue-router'
import { initialiseAuth, refreshProfile, useAuth } from '../auth'
import AccessDeniedView from '../views/AccessDeniedView.vue'
import AdminView from '../views/AdminView.vue'
import AccountView from '../views/AccountView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import MapView from '../views/MapView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import OfflineView from '../views/OfflineView.vue'
import RegisterView from '../views/RegisterView.vue'
import ResourceDetailView from '../views/ResourceDetailView.vue'
import ResourcesView from '../views/ResourcesView.vue'
import SavedResourcesView from '../views/SavedResourcesView.vue'
import StaffView from '../views/StaffView.vue'
import SupportPlanView from '../views/SupportPlanView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/resources', name: 'resources', component: ResourcesView },
    { path: '/saved', name: 'saved-resources', component: SavedResourcesView },
    { path: '/nearby', name: 'nearby', component: MapView, meta: { requiresOnline: true } },
    { path: '/resources/:id', name: 'resource-detail', component: ResourceDetailView },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true, requiresOnline: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresGuest: true, requiresOnline: true },
    },
    {
      path: '/account',
      name: 'account',
      component: AccountView,
      meta: { requiresAuth: true, requiresOnline: true },
    },
    {
      path: '/support-plan',
      name: 'support-plan',
      component: SupportPlanView,
      meta: { requiresAuth: true, requiredRole: 'member', requiresOnline: true },
    },
    {
      path: '/staff',
      name: 'staff',
      component: StaffView,
      meta: { requiresAuth: true, requiredRole: 'staff', requiresOnline: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true, requiredRole: 'admin', requiresOnline: true },
    },
    { path: '/offline', name: 'offline', component: OfflineView },
    { path: '/access-denied', name: 'access-denied', component: AccessDeniedView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})

router.beforeEach(async (to) => {
  const requiresOnline = to.matched.some((record) => record.meta.requiresOnline)
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiredRole = to.matched.find((record) => record.meta.requiredRole)?.meta.requiredRole

  if (requiresOnline && typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { name: 'offline' }
  }

  await initialiseAuth()
  const authState = useAuth()

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
