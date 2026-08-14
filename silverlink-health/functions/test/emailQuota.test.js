import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EMAIL_DAILY_LIMIT,
  getUtcDayKey,
  reserveEmailAttempt,
} from '../src/emailQuota.js'

function createQuotaDatabase(initialData = null) {
  let data = initialData
  const reference = {
    set: async (values) => {
      data = { ...data, ...values }
    },
  }

  return {
    collection: () => ({ doc: () => reference }),
    runTransaction: async (callback) =>
      callback({
        get: async () => ({ exists: Boolean(data), data: () => data }),
        set: (_reference, values) => {
          data = { ...data, ...values }
        },
      }),
    read: () => data,
  }
}

test('reserveEmailAttempt creates a private daily counter', async () => {
  const db = createQuotaDatabase()
  const now = new Date('2026-08-14T01:00:00.000Z')

  await reserveEmailAttempt({
    db,
    uid: 'member-1',
    now,
    timestampFromDate: (date) => date,
  })

  assert.equal(db.read().dayKey, getUtcDayKey(now))
  assert.equal(db.read().dailyCount, 1)
  assert.equal(db.read().lastStatus, 'pending')
})

test('reserveEmailAttempt enforces cooldown and daily limits', async () => {
  const now = new Date('2026-08-14T01:00:30.000Z')
  const cooldownDb = createQuotaDatabase({
    dayKey: getUtcDayKey(now),
    dailyCount: 1,
    lastAttemptAt: new Date('2026-08-14T01:00:00.000Z'),
  })
  const limitDb = createQuotaDatabase({
    dayKey: getUtcDayKey(now),
    dailyCount: EMAIL_DAILY_LIMIT,
    lastAttemptAt: new Date('2026-08-13T23:00:00.000Z'),
  })
  const options = { uid: 'member-1', now, timestampFromDate: (date) => date }

  await assert.rejects(
    reserveEmailAttempt({ ...options, db: cooldownDb }),
    /Wait one minute/u,
  )
  await assert.rejects(
    reserveEmailAttempt({ ...options, db: limitDb }),
    /daily support plan email limit/u,
  )
})
