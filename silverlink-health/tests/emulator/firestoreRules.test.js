import { after, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from 'firebase/firestore'

const requireFromFunctions = createRequire(
  new URL('../../functions/package.json', import.meta.url),
)
const { deleteApp, initializeApp } = requireFromFunctions('firebase-admin/app')
const {
  getFirestore: getAdminFirestore,
  Timestamp: AdminTimestamp,
} = requireFromFunctions('firebase-admin/firestore')
const { createSaveRatingHandler } = requireFromFunctions('./src/ratingAnalytics')

const projectId = 'silverlink-rules-test'
const resourceId = 'lifeline-australia'
let environment
let adminApp
let adminDatabase

before(async () => {
  const rules = await readFile(
    fileURLToPath(new URL('../../firestore.rules', import.meta.url)),
    'utf8',
  )
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  })
  adminApp = initializeApp({ projectId }, 'rating-analytics-emulator-test')
  adminDatabase = getAdminFirestore(adminApp)
})

beforeEach(async () => {
  await environment.clearFirestore()
  await environment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore()
    const now = Timestamp.fromMillis(1_000)

    await Promise.all([
      setDoc(doc(database, 'users', 'member-1'), {
        displayName: 'Member One',
        role: 'member',
        createdAt: now,
      }),
      setDoc(doc(database, 'users', 'staff-1'), {
        displayName: 'Staff One',
        role: 'staff',
        createdAt: now,
      }),
      setDoc(doc(database, 'users', 'admin-1'), {
        displayName: 'Admin One',
        role: 'admin',
        createdAt: now,
      }),
      setDoc(doc(database, 'emailDispatches', 'member-1'), {
        dayKey: '2026-08-15',
        dailyCount: 1,
        lastStatus: 'sent',
      }),
      setDoc(doc(database, 'resources', resourceId, 'ratings', 'member-1'), {
        score: 4,
        createdAt: now,
        updatedAt: now,
      }),
      setDoc(doc(database, 'resources', resourceId, 'ratings', 'member-2'), {
        score: 5,
        createdAt: now,
        updatedAt: now,
      }),
      setDoc(doc(database, 'ratingAnalytics', resourceId), {
        ratingCount: 2,
        scoreTotal: 9,
        averageScore: 4.5,
        scoreDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
        updatedAt: now,
      }),
    ])
  })
})

after(async () => {
  if (environment) {
    await environment.cleanup()
  }
  if (adminApp) {
    await deleteApp(adminApp)
  }
})

test('public clients can read a known aggregate but cannot list aggregate documents', async () => {
  const database = environment.unauthenticatedContext().firestore()
  const aggregate = await assertSucceeds(getDoc(doc(database, 'ratingAnalytics', resourceId)))

  assert.equal(aggregate.data().ratingCount, 2)
  await assertFails(getDocs(collection(database, 'ratingAnalytics')))
  await assertFails(getDoc(doc(database, 'ratingAnalytics', 'unknown-resource')))
})

test('members can read only their own private rating and cannot list ratings', async () => {
  const database = environment.authenticatedContext('member-1').firestore()
  const ownRating = await assertSucceeds(
    getDoc(doc(database, 'resources', resourceId, 'ratings', 'member-1')),
  )

  assert.equal(ownRating.data().score, 4)
  await assertFails(getDoc(doc(database, 'resources', resourceId, 'ratings', 'member-2')))
  await assertFails(getDocs(collection(database, 'resources', resourceId, 'ratings')))
})

test('staff and signed-out clients cannot read private rating documents', async () => {
  const staffDatabase = environment.authenticatedContext('staff-1').firestore()
  const publicDatabase = environment.unauthenticatedContext().firestore()
  const ratingPath = ['resources', resourceId, 'ratings', 'member-1']

  await assertFails(getDoc(doc(staffDatabase, ...ratingPath)))
  await assertFails(getDoc(doc(publicDatabase, ...ratingPath)))
})

test('administrator browser clients cannot list protected system collections', async () => {
  const database = environment.authenticatedContext('admin-1').firestore()

  await assertFails(getDocs(collection(database, 'users')))
  await assertFails(getDocs(collection(database, 'resources', resourceId, 'ratings')))
  await assertFails(getDocs(collection(database, 'ratingAnalytics')))
  await assertFails(getDocs(collection(database, 'emailDispatches')))
  await assertFails(getDoc(doc(database, 'users', 'member-1')))
  await assertSucceeds(getDoc(doc(database, 'users', 'admin-1')))
})

test('browser clients cannot write ratings or forge aggregate documents', async () => {
  const database = environment.authenticatedContext('member-1').firestore()
  const now = Timestamp.fromMillis(2_000)

  await assertFails(setDoc(doc(database, 'resources', resourceId, 'ratings', 'member-1'), {
    score: 1,
    createdAt: now,
    updatedAt: now,
  }))
  await assertFails(setDoc(doc(database, 'ratingAnalytics', resourceId), {
    ratingCount: 10_000,
    scoreTotal: 50_000,
    averageScore: 5,
    scoreDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 10_000 },
    updatedAt: now,
  }))
})

test('server rating transaction updates the private rating and aggregate together', async () => {
  const saveRating = createSaveRatingHandler({
    db: adminDatabase,
    createTimestamp: () => AdminTimestamp.fromMillis(3_000),
  })
  const result = await saveRating({
    auth: { uid: 'member-1' },
    data: { resourceId, score: 2 },
  })
  const [ratingSnapshot, aggregateSnapshot] = await Promise.all([
    adminDatabase.collection('resources').doc(resourceId).collection('ratings').doc('member-1').get(),
    adminDatabase.collection('ratingAnalytics').doc(resourceId).get(),
  ])

  assert.equal(result.isNew, false)
  assert.equal(ratingSnapshot.data().score, 2)
  assert.equal(aggregateSnapshot.data().ratingCount, 2)
  assert.equal(aggregateSnapshot.data().scoreTotal, 7)
  assert.equal(aggregateSnapshot.data().averageScore, 3.5)
  assert.deepEqual(aggregateSnapshot.data().scoreDistribution, {
    1: 0,
    2: 1,
    3: 0,
    4: 0,
    5: 1,
  })
})
