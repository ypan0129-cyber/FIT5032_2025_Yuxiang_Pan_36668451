<template>
  <div>
    <h1>Books with ISBN > 1000</h1>
    <ul>
      <li v-for="book in books" :key="book.id" class="mb-2">
        {{ book.name }} - ISBN: {{ book.isbn }}
        
        <!-- 新增：更新和删除按钮 -->
        <button @click="updateBook(book.id, book.name)" class="btn btn-warning btn-sm ms-2">Update</button>
        <button @click="deleteBook(book.id)" class="btn btn-danger btn-sm ms-2">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import db from '../firebase/init.js'; 
//  新增引入：doc, updateDoc, deleteDoc
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const books = ref([]);

// 1. 获取数据的函数 (包含 where, orderBy, limit)
const fetchBooks = async () => {
  try {
    const q = query(
      collection(db, 'books'), 
      where('isbn', '>', 1000),
      orderBy('isbn', 'asc'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    const booksArray = [];
    
    querySnapshot.forEach((doc) => {
      booksArray.push({ id: doc.id, ...doc.data() });
    });
    
    books.value = booksArray;
  } catch (error) {
    console.error('Error fetching books: ', error);
  }
};

// 2. 更新数据的函数 (Update)
const updateBook = async (id, currentName) => {
  try {
    const bookRef = doc(db, 'books', id);
    // 这里为了演示，我们直接在现有的书名后面加上 ' - Updated'
    await updateDoc(bookRef, {
      name: currentName + ' - Updated' 
    });
    alert('Book updated successfully!');
    fetchBooks(); // 更新成功后，自动重新拉取数据刷新列表
  } catch (error) {
    console.error('Error updating book: ', error);
  }
};

// 3. 删除数据的函数 (Delete)
const deleteBook = async (id) => {
  try {
    const bookRef = doc(db, 'books', id);
    await deleteDoc(bookRef);
    alert('Book deleted successfully!');
    fetchBooks(); // 删除成功后，自动重新拉取数据刷新列表
  } catch (error) {
    console.error('Error deleting book: ', error);
  }
};

onMounted(() => {
  fetchBooks();
});
</script>