<template>
  <div class="container mt-5">
    <div class="row">
      <!-- 主容器响应式：手机端全宽，平板端占据 10 份并居中，电脑端占据 8 份并居中 -->
      <div class="col-12 col-sm-10 offset-sm-1 col-md-8 offset-md-2">
        <h1 class="text-center mb-4">User Information Form</h1>
        
        <form @submit.prevent="submitForm">
          
          
          <div class="row mb-3">
            <div class="col-12 col-sm-6">
              <label for="username" class="form-label">Username</label>
              <input type="text" class="form-control" id="username" v-model="formData.username" @blur="() => validateName(true)" @input="() => validateName(false)">
              <div v-if="errors.username" class="text-danger">{{ errors.username }}</div>
            </div>
            <div class="col-12 col-sm-6">
              <label for="password" class="form-label">Password</label>
              <input type="password" class="form-control" id="password" v-model="formData.password"
              @blur="() => validatePassword(true)" 
         @input="() => validatePassword(false)">
              <div v-if="errors.password" class="text-danger">{{errors.password }}</div>
            </div>
          </div>

          
          <div class="row mb-3">
           
            <div class="col-12 col-sm-6 d-flex align-items-center">
              <div class="form-check">
                <input type="checkbox" class="form-check-input" id="isAustralian" v-model="formData.isAustralian" @change="validateIsAustralian">
                <label class="form-check-label" for="isAustralian">
                  Australian Resident?
                </label>
                <div v-if="errors.isAustralian" class="text-danger mt-1">
      {{ errors.isAustralian }}
    </div>
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <label for="gender" class="form-label">Gender</label>
              <select class="form-select" id="gender" v-model="formData.gender" @change="validateGender" @blur="validateGender">
                <option value="">Please select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <div v-if="errors.gender" class="text-danger">{{ errors.gender }}</div>
            </div>
          </div>

          <!-- 第三行：文本域 (始终占满整行) -->
          <div class="mb-3">
            <label for="reason" class="form-label">Reason for joining</label>
            <textarea class="form-control" id="reason" rows="3" v-model="formData.reason" @blur="() => validateReason(true)" @input="() => validateReason(false)"></textarea>
            <div v-if="errors.reason" class="text-danger">{{ errors.reason }}</div>
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
        <!-- <div class="row mt-5" v-if="submittedCards.length">
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
        </div> -->
        <DataTable :value="submittedUsers">
      <!-- 每一列对应 formData 里的一个字段 -->
      <Column field="username" header="Username"></Column>
      <Column field="password" header="Password"></Column>
      <Column field="isAustralian" header="Australian Resident"></Column>
      <Column field="gender" header="Gender"></Column>
      <Column field="reason" header="Reason"></Column>
    </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const formData = ref({
    username: '',
    password: '',
    isAustralian: false,
    reason: '',
    gender: ''
});
const submittedUsers = ref([]);

const submittedCards = ref([]);


const submitForm = () => {
  // 触发所有字段的验证
  validateName(true);
  validatePassword(true);

  validateGender();
  validateReason(true);
  
  // 确保用户名和密码的 errors 都为空
  if (!errors.value.username && !errors.value.password && !errors.value.gender && !errors.value.reason) {
    submittedUsers.value.push({ ...formData.value });
    console.log("Form submitted successfully!", formData.value);
    formData.value = {
      username: '',
      password: '',
      isAustralian: false,
      gender: '',
      reason: ''
    };
    
  }
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

const errors = ref({
  username: null,
  password: null,
  isAustralian: null,
  gender: null,
  reason: null
});

const validateName = (blur) => {
  if (formData.value.username.length < 3) {
    if (blur) errors.value.username = "Name must be at least 3 characters";
  } else {
    errors.value.username = null;
  }
};

const validatePassword = (blur) => {
  const password = formData.value.password;
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    if (blur) errors.value.password = `Password must be at least ${minLength} characters long.`;
  } else if (!hasUppercase) {
    if (blur) errors.value.password = "Password must contain at least one uppercase letter.";
  } else if (!hasLowercase) {
    if (blur) errors.value.password = "Password must contain at least one lowercase letter.";
  } else if (!hasNumber) {
    if (blur) errors.value.password = "Password must contain at least one number.";
  } else if (!hasSpecialChar) {
    if (blur) errors.value.password = "Password must contain at least one special character.";
  } else {
    errors.value.password = null;
  }
};
// 1. 验证“澳洲居民” (假设它是一个复选框或下拉框，要求必须选择)
const validateIsAustralian = () => {
  // 如果没有勾选 (值为 false 或 undefined)
  if (!formData.value.isAustralian) {
    errors.value.isAustralian = "Please confirm your residency status.";
  } else {
    // 如果勾选了 (值为 true)，清空报错
    errors.value.isAustralian = null;
  }
};

// 2. 验证“性别” (要求必须选择)
const validateGender = () => {
  if (!formData.value.gender) {
    errors.value.gender = "Please select your gender.";
  } else {
    errors.value.gender = null;
  }
};

// 3. 验证“加入原因” (要求不能为空，且至少输入 10 个字符)
const validateReason = (blur) => {
  const reason = formData.value.reason;
  if (!reason || reason.length < 10) {
    if (blur) errors.value.reason = "Reason must be at least 10 characters long.";
  } else {
    errors.value.reason = null;
  }
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

