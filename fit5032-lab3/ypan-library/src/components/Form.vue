<template>
  <div class="container mt-5">
    <div class="row">
      <!-- 主容器响应式：手机端全宽，平板端占据 10 份并居中，电脑端占据 8 份并居中 -->
      <div class="col-12 col-sm-10 offset-sm-1 col-md-8 offset-md-2">
        <h1 class="text-center mb-4">User Information Form</h1>
        
        <form @submit.prevent="submitForm">
          
          <!-- 第一行：用户名与密码 (手机端上下堆叠，平板/电脑端并排) -->
          <div class="row mb-3">
            <div class="col-12 col-sm-6">
              <label for="username" class="form-label">Username</label>
              <input type="text" class="form-control" id="username" v-model="formData.username">
            </div>
            <div class="col-12 col-sm-6">
              <label for="password" class="form-label">Password</label>
              <input type="password" class="form-control" id="password" v-model="formData.password">
            </div>
          </div>

          <!-- 第二行：复选框与下拉菜单 (手机端上下堆叠，平板/电脑端并排) -->
          <div class="row mb-3">
            <!-- 加上 d-flex align-items-center 让复选框垂直居中对齐旁边的下拉菜单 -->
            <div class="col-12 col-sm-6 d-flex align-items-center">
              <div class="form-check">
                <input type="checkbox" class="form-check-input" id="isAustralian" v-model="formData.isAustralian">
                <label class="form-check-label" for="isAustralian">
                  Australian Resident?
                </label>
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <label for="gender" class="form-label">Gender</label>
              <select class="form-select" id="gender" v-model="formData.gender">
                <option value="">Please select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <!-- 第三行：文本域 (始终占满整行) -->
          <div class="mb-3">
            <label for="reason" class="form-label">Reason for joining</label>
            <textarea class="form-control" id="reason" rows="3" v-model="formData.reason"></textarea>
          </div>

          <!-- 第四行：按钮组 (居中显示) -->
          <div class="row mb-3">
            <div class="col-12 d-flex justify-content-center gap-2">
              <button type="submit" class="btn btn-primary">Submit</button>
              <button type="button" class="btn btn-secondary" @click="clearForm">Clear</button>
            </div>
          </div>
          
        </form>

        <!-- 数据展示区域：提交后显示的卡片 -->
        <div class="row mt-5" v-if="submittedCards.length">
          <div class="d-flex flex-wrap justify-content-start">
            <div v-for="(card, index) in submittedCards" :key="index" class="card m-2" style="width: 18rem;">
              <div class="card-header">
                User Information
              </div>
              <ul class="list-group list-group-flush">
                <li class="list-group-item">Username: {{ card.username }}</li>
                <li class="list-group-item">Password: {{ card.password }}</li>
                <li class="list-group-item">Australian Resident: {{ card.isAustralian ? 'Yes' : 'No' }}</li>
                <li class="list-group-item">Gender: {{ card.gender || 'Not specified' }}</li>
                <li class="list-group-item">Reason: {{ card.reason || 'Not provided' }}</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const formData = ref({
    username: '',
    password: '',
    isAustralian: false,
    reason: '',
    gender: ''
});

const submittedCards = ref([]);

const submitForm = () => {
    submittedCards.value.push({
        ...formData.value
    });
};
const clearForm = () => {
    // 将 formData 的各项属性重置为初始状态
    formData.value = {
        username: '',
        password: '',
        isAustralian: false,
        reason: '',
        gender: ''
    };
};
</script>

<style scoped>
   .card {
   border: 1px solid #ccc;
   border-radius: 10px;
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
   }
   .card-header {
   background-color: #275FDA;
   color: white;
   padding: 10px;
   border-radius: 10px 10px 0 0;
   }
   .list-group-item {
   padding: 10px;
   }
</style>

