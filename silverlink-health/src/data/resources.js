export const supportCategories = [
  'Anxiety and stress',
  'Crisis support',
  'Grief and loss',
  'Sleep and wellbeing',
  'Social connection',
]

export const deliveryModes = ['Phone', 'Online', 'In person']

export const resources = [
  {
    id: 'lifeline-australia',
    title: 'Lifeline Australia',
    category: 'Crisis support',
    summary: 'Confidential crisis support for anyone experiencing distress or feeling overwhelmed.',
    description:
      'Lifeline offers crisis support by phone and online. If life is in immediate danger, call Triple Zero (000).',
    deliveryModes: ['Phone', 'Online'],
    phone: '13 11 14',
    website: 'https://www.lifeline.org.au/',
    openingHours: '24 hours, 7 days',
    location: 'Australia-wide',
    featured: true,
  },
  {
    id: 'beyond-blue',
    title: 'Beyond Blue Support Service',
    category: 'Anxiety and stress',
    summary: 'Information and support for anxiety, depression and changes in emotional wellbeing.',
    description:
      'Beyond Blue provides practical mental health information and access to trained support counsellors by phone and online.',
    deliveryModes: ['Phone', 'Online'],
    phone: '1300 22 4636',
    website: 'https://www.beyondblue.org.au/',
    openingHours: '24 hours, 7 days',
    location: 'Australia-wide',
    featured: true,
  },
  {
    id: 'head-to-health',
    title: 'Head to Health',
    category: 'Anxiety and stress',
    summary: 'A national starting point for finding mental health services and trusted information.',
    description:
      'Head to Health helps people understand available support options and connect with services that suit their needs.',
    deliveryModes: ['Phone', 'Online', 'In person'],
    phone: '1800 595 212',
    website: 'https://www.headtohealth.gov.au/',
    openingHours: 'Check local service hours',
    location: 'Australia-wide',
    featured: true,
  },
  {
    id: 'friendline',
    title: 'FriendLine',
    category: 'Social connection',
    summary: 'A friendly conversation service for people who would like to connect with someone.',
    description:
      'FriendLine supports people experiencing loneliness by offering a friendly, confidential conversation over the phone.',
    deliveryModes: ['Phone'],
    phone: '1800 424 287',
    website: 'https://friendline.org.au/',
    openingHours: 'Check current phone service hours',
    location: 'Australia-wide',
    featured: false,
  },
  {
    id: 'grief-australia',
    title: 'Grief Australia',
    category: 'Grief and loss',
    summary: 'Information, education and counselling options for people living with grief and loss.',
    description:
      'Grief Australia provides grief information and pathways to counselling and community support.',
    deliveryModes: ['Phone', 'Online', 'In person'],
    phone: '03 9265 2100',
    website: 'https://www.grief.org.au/',
    openingHours: 'Monday to Friday, business hours',
    location: 'Victoria and online',
    featured: false,
  },
  {
    id: 'sleep-health-foundation',
    title: 'Sleep Health Foundation',
    category: 'Sleep and wellbeing',
    summary: 'Plain-language information about healthy sleep and common sleep difficulties.',
    description:
      'The Sleep Health Foundation publishes evidence-informed information to help Australians understand sleep health.',
    deliveryModes: ['Online'],
    phone: '',
    website: 'https://www.sleephealthfoundation.org.au/',
    openingHours: 'Online information available anytime',
    location: 'Australia-wide',
    featured: false,
  },
]

export function getResourceById(id) {
  return resources.find((resource) => resource.id === id)
}
