const { normaliseAggregate } = require('./ratingAnalytics')
const { SupportPlanError } = require('./supportPlan')

const PUBLIC_RESOURCES = Object.freeze([
  {
    id: 'lifeline-australia',
    title: 'Lifeline Australia',
    category: 'Crisis support',
    summary: 'Confidential crisis support for anyone experiencing distress or feeling overwhelmed.',
    deliveryModes: ['Phone', 'Online'],
    phone: '13 11 14',
    website: 'https://www.lifeline.org.au/',
    openingHours: '24 hours, 7 days',
    location: 'Australia-wide',
  },
  {
    id: 'beyond-blue',
    title: 'Beyond Blue Support Service',
    category: 'Anxiety and stress',
    summary: 'Information and support for anxiety, depression and changes in emotional wellbeing.',
    deliveryModes: ['Phone', 'Online'],
    phone: '1300 22 4636',
    website: 'https://www.beyondblue.org.au/',
    openingHours: '24 hours, 7 days',
    location: 'Australia-wide',
  },
  {
    id: 'head-to-health',
    title: 'Head to Health',
    category: 'Anxiety and stress',
    summary: 'A national starting point for finding mental health services and trusted information.',
    deliveryModes: ['Phone', 'Online', 'In person'],
    phone: '1800 595 212',
    website: 'https://www.headtohealth.gov.au/',
    openingHours: 'Check local service hours',
    location: 'Australia-wide',
  },
  {
    id: 'friendline',
    title: 'FriendLine',
    category: 'Social connection',
    summary: 'A friendly conversation service for people who would like to connect with someone.',
    deliveryModes: ['Phone'],
    phone: '1800 424 287',
    website: 'https://friendline.org.au/',
    openingHours: 'Check current phone service hours',
    location: 'Australia-wide',
  },
  {
    id: 'grief-australia',
    title: 'Grief Australia',
    category: 'Grief and loss',
    summary: 'Information, education and counselling options for people living with grief and loss.',
    deliveryModes: ['Phone', 'Online', 'In person'],
    phone: '03 9265 2100',
    website: 'https://www.grief.org.au/',
    openingHours: 'Monday to Friday, business hours',
    location: 'Victoria and online',
  },
  {
    id: 'sleep-health-foundation',
    title: 'Sleep Health Foundation',
    category: 'Sleep and wellbeing',
    summary: 'Plain-language information about healthy sleep and common sleep difficulties.',
    deliveryModes: ['Online'],
    phone: '',
    website: 'https://www.sleephealthfoundation.org.au/',
    openingHours: 'Online information available anytime',
    location: 'Australia-wide',
  },
])

const PUBLIC_RESOURCES_BY_ID = new Map(
  PUBLIC_RESOURCES.map((resource) => [resource.id, resource]),
)

function copyPublicResource(resource) {
  return {
    id: resource.id,
    title: resource.title,
    category: resource.category,
    summary: resource.summary,
    deliveryModes: [...resource.deliveryModes],
    phone: resource.phone,
    website: resource.website,
    openingHours: resource.openingHours,
    location: resource.location,
    ratingSummaryPath: `/api/v1/resources/${resource.id}/summary`,
  }
}

function createListPublicResourcesHandler() {
  return async function listPublicResources() {
    return {
      apiVersion: 'v1',
      count: PUBLIC_RESOURCES.length,
      resources: PUBLIC_RESOURCES.map(copyPublicResource),
    }
  }
}

function createGetPublicResourceSummaryHandler({ db }) {
  return async function getPublicResourceSummary(resourceId) {
    const resource = PUBLIC_RESOURCES_BY_ID.get(resourceId)

    if (!resource) {
      throw new SupportPlanError('not-found', 'This support resource does not exist.')
    }

    const snapshot = await db.collection('ratingAnalytics').doc(resourceId).get()
    let ratingSummary = {
      averageScore: null,
      ratingCount: 0,
    }

    if (snapshot.exists) {
      const aggregate = normaliseAggregate(snapshot.data())

      if (
        !aggregate ||
        !Number.isSafeInteger(aggregate.ratingCount) ||
        !Number.isSafeInteger(aggregate.scoreTotal)
      ) {
        throw new SupportPlanError(
          'unavailable',
          'The rating summary is temporarily unavailable.',
        )
      }

      ratingSummary = {
        averageScore: aggregate.averageScore,
        ratingCount: aggregate.ratingCount,
      }
    }

    return {
      apiVersion: 'v1',
      resource: {
        id: resource.id,
        title: resource.title,
        category: resource.category,
      },
      ratingSummary,
    }
  }
}

module.exports = {
  PUBLIC_RESOURCES,
  createGetPublicResourceSummaryHandler,
  createListPublicResourcesHandler,
}
