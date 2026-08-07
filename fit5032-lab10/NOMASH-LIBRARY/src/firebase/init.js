// 1. 引入 Firebase app 和 Firestore 核心函数
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 2. 你的 Firebase 项目配置（从 Firebase Console 控制台项目设置中复制）
const firebaseConfig = {
  apiKey: "AIzaSyDW2DD68d-plb2pPrW25aDt1KkcIhBPD7U",
  authDomain: "fit5032-lab7-9f072.firebaseapp.com",
  projectId: "fit5032-lab7-9f072",
  storageBucket: "fit5032-lab7-9f072.firebasestorage.app",
  messagingSenderId: "790895442209",
  appId: "1:790895442209:web:e5869937449a22db656660"
};

// 3. 初始化 Firebase App
const app = initializeApp(firebaseConfig);

// 4. 初始化 Firestore 数据库服务
const db = getFirestore(app);

// 5. 导出 db 供其他组件（如 AddBook.vue）使用
export default db;