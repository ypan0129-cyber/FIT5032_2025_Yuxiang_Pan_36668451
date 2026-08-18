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
import { focusMainContent, getDocumentTitle } from '../utils/accessibility'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Home' } },
    { path: '/resources', name: 'resources', component: ResourcesView, meta: { title: 'Resources' } },
    { path: '/saved', name: 'saved-resources', component: SavedResourcesView, meta: { title: 'Saved resources' } },
    { path: '/nearby', name: 'nearby', component: MapView, meta: { title: 'Nearby services', requiresOnline: true } },
    { path: '/resources/:id', name: 'resource-detail', component: ResourceDetailView, meta: { title: 'Resource details' } },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { title: 'Log in', requiresGuest: true, requiresOnline: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { title: 'Create an account', requiresGuest: true, requiresOnline: true },
    },
    {
      path: '/account',
      name: 'account',
      component: AccountView,
      meta: { title: 'Account', requiresAuth: true, requiresOnline: true },
    },
    {
      path: '/support-plan',
      name: 'support-plan',
      component: SupportPlanView,
      meta: { title: 'Support plan', requiresAuth: true, requiredRole: 'member', requiresOnline: true },
    },
    {
      path: '/staff',
      name: 'staff',
      component: StaffView,
      meta: { title: 'Staff workspace', requiresAuth: true, requiredRole: 'staff', requiresOnline: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { title: 'Administration', requiresAuth: true, requiredRole: 'admin', requiresOnline: true },
    },
    { path: '/offline', name: 'offline', component: OfflineView, meta: { title: 'Offline' } },
    { path: '/access-denied', name: 'access-denied', component: AccessDeniedView, meta: { title: 'Access denied' } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: 'Page not found' } },
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

router.afterEach((to) => {
  if (typeof document === 'undefined') {
    return
  }

  document.title = getDocumentTitle(to.meta.title)
  const scheduleFocus = typeof window !== 'undefined' && window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : (callback) => setTimeout(callback, 0)

  scheduleFocus(() => focusMainContent(document))
})

export default router
