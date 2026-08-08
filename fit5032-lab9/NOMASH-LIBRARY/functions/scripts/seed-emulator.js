/* eslint-env node */

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8180'

const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

initializeApp({ projectId: 'fit5032-lab7-9f072' })

const books = [
  { name: 'The Great Gatsby', isbn: 9780743273565 },
  { name: 'To Kill a Mockingbird', isbn: 9780061120084 },
  { name: 'Nineteen Eighty-Four', isbn: 9780451524935 },
  { name: 'Pride and Prejudice', isbn: 9780141439518 },
  { name: 'The Hobbit', isbn: 9780547928227 }
]

const seed = async () => {
  const db = getFirestore()
  const batch = db.batch()

  books.forEach((book, index) => {
    const reference = db.collection('books').doc(`demo-book-${index + 1}`)
    batch.set(reference, book)
  })

  await batch.commit()
  console.log(`Seeded ${books.length} books in the Firestore emulator.`)
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
