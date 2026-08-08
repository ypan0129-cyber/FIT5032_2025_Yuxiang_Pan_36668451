<template>
  <div class="add-book-container">
    <h2>添加新图书 (Add Book)</h2>
    <form @submit.prevent="addBook">
      <div>
        <label>书名 (Book Name): </label>
        <input type="text" v-model="bookName" required />
      </div>
      <div>
        <label>ISBN: </label>
        <input type="number" v-model="isbn" required />
      </div>
      <button type="submit">添加到数据库</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { collection, addDoc } from 'firebase/firestore';
import db from '../firebase.js'; // 确保路径指向你刚才创建的 firebase.js

const bookName = ref('');
const isbn = ref('');

const addBook = async () => {
  try {
    // 'books' 是你在 Firestore 中的集合(Collection)名称，没有的话会自动创建
    const docRef = await addDoc(collection(db, 'books'), {
      name: bookName.value,
      isbn: Number(isbn.value)
    });
    alert('添加成功！Document ID: ' + docRef.id);
    
    // 清空输入框
    bookName.value = '';
    isbn.value = '';
  } catch (error) {
    console.error("添加文档时出错: ", error);
  }
};
</script>