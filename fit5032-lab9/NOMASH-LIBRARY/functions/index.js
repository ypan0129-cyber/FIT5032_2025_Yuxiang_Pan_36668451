/* eslint-env node */

const { onRequest } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const cors = require('cors')

initializeApp()

const db = getFirestore()
const corsHandler = cors({ origin: true })

const createGetFunction = (handler) =>
  onRequest((request, response) => {
    corsHandler(request, response, async () => {
      if (request.method !== 'GET') {
        response.set('Allow', 'GET')
        response.status(405).json({ error: 'Method not allowed' })
        return
      }

      try {
        await handler(request, response)
      } catch (error) {
        logger.error('Cloud function request failed', error)
        response.status(500).json({ error: 'Unable to read the book collection' })
      }
    })
  })

exports.countBooks = createGetFunction(async (_request, response) => {
  const snapshot = await db.collection('books').get()

  response.json({
    count: snapshot.size,
    collection: 'books',
    generatedAt: new Date().toISOString()
  })
})

exports.sellBookData = createGetFunction(async (_request, response) => {
  const snapshot = await db.collection('books').orderBy('name').get()
  const books = snapshot.docs.map((document) => {
    const data = document.data()

    return {
      id: document.id,
      name: data.name ?? 'Untitled',
      isbn: data.isbn ?? null
    }
  })

  const unitPrice = 0.5

  response.json({
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
})
