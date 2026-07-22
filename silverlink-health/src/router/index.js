import { createRouter, createWebHistory } from 'vue-router'
import AccessDeniedView from '../views/AccessDeniedView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import RegisterView from '../views/RegisterView.vue'
import ResourceDetailView from '../views/ResourceDetailView.vue'
import ResourcesView from '../views/ResourcesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/resources', name: 'resources', component: ResourcesView },
    { path: '/resources/:id', name: 'resource-detail', component: ResourceDetailView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/access-denied', name: 'access-denied', component: AccessDeniedView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})

export default router
