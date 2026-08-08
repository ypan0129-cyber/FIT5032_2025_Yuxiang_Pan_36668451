/* eslint-env node */

const express = require('express')
const cors = require('cors')
const { Firestore } = require('@google-cloud/firestore')
const bundledBooks = require('./books.json')

const app = express()
const port = process.env.PORT || 9000
const collectionName = process.env.FIRESTORE_COLLECTION || 'books'

app.use(cors({ origin: true }))
app.use(express.json())

let firestoreClient

const getFirestoreClient = () => {
  if (firestoreClient) {
    return firestoreClient
  }

  const encodedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  if (!encodedServiceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is required for Firestore mode')
  }

  const serviceAccount = JSON.parse(Buffer.from(encodedServiceAccount, 'base64').toString('utf8'))

  firestoreClient = new Firestore({
    projectId: serviceAccount.project_id,
    preferRest: true,
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key
    }
  })

  return firestoreClient
}

const loadBooks = async () => {
  if (process.env.DATA_SOURCE !== 'firestore') {
    return {
      source: 'bundled-json',
      books: bundledBooks.map((book, index) => ({
        id: `json-book-${index + 1}`,
        ...book
      }))
    }
  }

  const snapshot = await getFirestoreClient().collection(collectionName).orderBy('name').get()

  return {
    source: 'firestore',
    books: snapshot.docs.map((document) => {
      const data = document.data()

      return {
        id: document.id,
        name: data.name ?? 'Untitled',
        isbn: data.isbn ?? null
      }
    })
  }
}

const handleRequestError = (response, error) => {
  console.error(error)
  response.status(500).json({
    error: 'Unable to load the book dataset',
    detail: error.message
  })
}

app.get('/', (_request, response) => {
  response.json({
    service: 'FIT5032 Lab 9 Book API',
    platform: 'Alibaba Cloud Function Compute',
    endpoints: ['/countBooks', '/sellBookData']
  })
})

app.get('/countBooks', async (_request, response) => {
  try {
    const result = await loadBooks()

    response.json({
      count: result.books.length,
      collection: collectionName,
      source: result.source,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    handleRequestError(response, error)
  }
})

app.get('/sellBookData', async (_request, response) => {
  try {
    const result = await loadBooks()
    const unitPrice = 0.5
    const books = [...result.books].sort((firstBook, secondBook) =>
      firstBook.name.localeCompare(secondBook.name)
    )

    response.json({
      source: result.source,
      platform: 'Alibaba Cloud Function Compute',
      product: {
        name: 'Monash Library Book Dataset',
        currency: 'AUD',
        unitPrice,
        recordCount: books.length,
        totalPrice: Number((books.length * unitPrice).toFixed(2))
      },
      books,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    handleRequestError(response, error)
  }
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Alibaba Cloud web function is listening on port ${port}`)
})
