<template>
  <div class="container">
    <header class="d-flex flex-wrap justify-content-center py-3 mb-4 border-bottom">
      <a href="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none">
        <span class="fs-4">Monash Library</span>
      </a>

      <ul class="nav nav-pills align-items-center">
        <li class="nav-item">
          <router-link to="/" class="nav-link" active-class="active">Home (Week 5)</router-link>
        </li>

        <!-- 随时允许用户点击 About。 -->
        <li class="nav-item">
          <router-link to="/about" class="nav-link" active-class="active">About</router-link>
        </li>

        <!-- 未登录时显示注册和登录 -->
        <li class="nav-item" v-if="!isLoggedIn">
          <router-link to="/FireLogin" class="nav-link" active-class="active">Firebase Login</router-link>
        </li>
        <li class="nav-item" v-if="!isLoggedIn">
          <router-link to="/FireRegister" class="nav-link" active-class="active">Firebase Register</router-link>
        </li>

        <!-- 已登录时显示登出按钮，并修改样式使其融入导航栏 -->
        <li class="nav-item" v-if="isLoggedIn">
         <button @click="handleSignOut" class="nav-link btn btn-link text-decoration-none border-0 bg-transparent">Log Out</button>
        </li>
        <li class="nav-item">
         <router-link to="/addbook" class="nav-link" active-class="active">Add Book</router-link>
        </li>
      </ul>
    </header>
  </div>
</template>

<style scoped>
.b-example-divider {
  height: 3rem;
  background-color: rgba(0, 0, 0, 0.1);
  border: solid rgba(0, 0, 0, 0.15);
  border-width: 1px 0;
  box-shadow:
    inset 0 0.5em 1.5em rgba(0, 0, 0, 0.1),
    inset 0 0.125em 0.5em rgba(0, 0, 0, 0.15);
}

.form-control-dark {
  color: #fff;
  background-color: var(--bs-dark);
  border-color: var(--bs-gray);
}

.form-control-dark:focus {
  color: #fff;
  background-color: var(--bs-dark);
  border-color: #fff;
  box-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.25);
}

.bi {
  vertical-align: -0.125em;
  fill: currentColor;
}

.text-small {
  font-size: 85%;
}

.dropdown-toggle {
  outline: 0;
}
</style>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router'
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";

const router = useRouter();
const auth = getAuth();
const isLoggedIn = ref(false); // 创建一个响应式变量来追踪 Firebase 登录状态

// 监听 Firebase 的登录状态变化
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isLoggedIn.value = true;
    } else {
      isLoggedIn.value = false;
    }
  });
});

const handleSignOut = () => {
  signOut(auth)
    .then(() => {
      console.log("Successfully logged out!");
      console.log("Current User after logout:", auth.currentUser); 
      
      // 登出后跳转回首页
      router.push("/"); 
    })
    .catch((error) => {
      console.log("Error logging out:", error);
    });
};
</script>