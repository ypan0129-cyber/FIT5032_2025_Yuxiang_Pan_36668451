<template>
  <div class="container mt-5">
    <h2>Add Book</h2>
    <!-- prevent 修饰符用于阻止表单提交时刷新页面 -->
    <form @submit.prevent="addBook">
      <div class="mb-3">
        <label for="isbn" class="form-label">ISBN:</label>
        <!-- number.trim 修饰符确保输入的 ISBN 转换成数字格式存入 -->
        <input 
          type="number" 
          id="isbn" 
          v-model.number="isbn" 
          class="form-control" 
          required 
        />
      </div>
      <div class="mb-3">
        <label for="name" class="form-label">Name:</label>
        <input 
          type="text" 
          id="name" 
          v-model="name" 
          class="form-control" 
          required 
        />
      </div>
      <button type="submit" class="btn btn-primary">Add Book</button>
    </form>

    <!-- 分割线 -->
    <hr class="my-5">

    <!-- 引入刚刚写好的 BookList 组件，用于展示查询结果 -->
    <BookList />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import db from '../firebase/init.js' // 引入我们在 8.2 创建的 db
import { collection, addDoc } from 'firebase/firestore'
//  新增：引入刚刚创建的 BookList 组件
import BookList from '../components/BookList.vue' 

const isbn = ref('')
const name = ref('')

// 异步添加数据函数
const addBook = async () => {
  try {
    const isbnNumber = Number(isbn.value)
    if (isNaN(isbnNumber)) {
      alert('ISBN must be a valid number')
      return
    }

    // 向名为 'books' 的 collection 中添加新的 document
    await addDoc(collection(db, 'books'), {
      isbn: isbnNumber,
      name: name.value
    })

    alert('Book added successfully!')
    // 清空表单，并刷新页面以重新触发查询组件获取最新数据
    isbn.value = ''
    name.value = ''
    window.location.reload() // 可选：添加完毕后自动刷新页面，让下方的 BookList 显示最新添加的书
  } catch (error) {
    console.error('Error adding book: ', error)
  }
}
</script>