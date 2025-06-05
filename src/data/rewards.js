// Example: src/data/rewards.js
// List of available rewards

// SUGGESTIONS:
// - If you want to support images/icons, add an "icon" or "image" property to each reward.
// - If you want to support categories (e.g., "Privileges", "Recognition"), add a "category" property.
// - If you want to allow for limited quantity, add a "quantity" property.
// - For localization, consider using a translation key instead of hardcoded strings.

export const rewards = [
  {
    id: 'pajama',
    name: 'Pajama Day Coupon',
    cost: 60,
    description: 'Earn a slip to use for any Pajama Day',
    icon: '🛌',
    category: 'Privileges',
    popular: true
  },
  {
    id: 'snack',
    name: 'Bring a Snack for the Class',
    cost: 150,
    description: 'Coordinate a special treat day (teacher approved)',
    icon: '🍪',
    category: 'Privileges'
  },
  {
    id: 'assistant',
    name: 'Principal Assistant for an Hour',
    cost: 120,
    description: 'Help Mr. Gray deliver mail or give high-fives',
    icon: '📬',
    category: 'Privileges'
  },
  {
    id: 'fuzzy',
    name: 'Fuzzy Friend Day',
    cost: 20,
    description: 'Bring a small stuffed animal for the day',
    icon: '🧸',
    category: 'Privileges'
  },
  {
    id: 'homework',
    name: 'Homework Pass',
    cost: 80,
    description: 'Skip one non-graded assignment',
    icon: '📚',
    category: 'Privileges'
  },
  {
    id: 'hat',
    name: 'Wear a Hat in Class',
    cost: 30,
    description: 'A special pass for one day only',
    icon: '🎩',
    category: 'Privileges'
  },
  {
    id: 'helper',
    name: 'Class Helper',
    cost: 35,
    description: 'Be the teacher’s right-hand assistant for the day',
    icon: '🧑‍🏫',
    category: 'Privileges'
  },
  {
    id: 'leader',
    name: 'Line Leader for the Day',
    cost: 25,
    description: 'Be first for lunch, recess, or specials',
    icon: '🚶‍♂️',
    category: 'Privileges'
  },
  {
    id: 'shoutout',
    name: 'School Announcement Shoutout',
    cost: 60,
    description: 'Your name and achievement read on morning announcements',
    icon: '📢',
    category: 'Recognition'
  },
  {
    id: 'lunch',
    name: 'Lunch with the Principal',
    cost: 75,
    description: 'Eat with Mr. Gray and bring a friend',
    icon: '🍽️',
    category: 'Privileges'
  },
];

// Suggestions implemented as comments for easy extension.
// <span className="reward-icon">{reward.icon}</span> {reward.name}