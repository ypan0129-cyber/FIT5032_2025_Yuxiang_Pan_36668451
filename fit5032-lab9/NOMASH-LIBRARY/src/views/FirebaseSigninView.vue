<template>
  <h1>Sign In</h1>
  <p><input type="text" placeholder="Email" v-model="email" /></p>
  <p><input type="password" placeholder="Password" v-model="password" /></p>
  <p><button @click="signin">Sign in via Firebase</button></p>
</template>

<script setup>
import { ref } from "vue";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
// 1. 新增引入 Firestore 相关的函数
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const router = useRouter();
const auth = getAuth();
const db = getFirestore(); // 初始化 Firestore

const signin = () => {
  signInWithEmailAndPassword(auth, email.value, password.value)
    .then(async (userCredential) => {
      console.log("Firebase Login Successful!");
      
      // 2. 获取当前登录用户的 UID
      const user = userCredential.user;
      
      // 3. 去 Firestore 的 "users" 集合中，查找这个 UID 对应的文档
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      // 4. 判断文档是否存在，并读取 role 字段
      if (docSnap.exists()) {
        const role = docSnap.data().role;
        console.log("Current user role is:", role);
        
        // 5. 根据角色执行不同逻辑 (多角色体现)
        if (role === 'admin') {
            console.log("Welcome Admin! You have special access.");
            // router.push("/admin-dashboard"); // 实际项目中可以跳去不同页面
        } else {
            console.log("Welcome User! You have standard access.");
        }
      } else {
        console.log("No role document found for this user!");
      }
      
      // 可选：登录完成后跳转首页
      // router.push("/"); 
    })
    .catch((error) => {
      console.log("Login Error:", error.code);
    });
};
</script>