export const COLLECTIONS = [
  {
    id: "emotions",
    label: "Emotions",
    emoji: "💭",
    desc: "Words for feelings, moods, and states of mind",
    filter: (w) =>
      /happy|joy|sad|fear|anger|love|grief|peace|anxious|calm|emotion|mood|feel|sorrow|bliss|delight|melanchol/i.test(
        w.meaningEn
      ),
  },
  {
    id: "philosophy",
    label: "Philosophy",
    emoji: "🪔",
    desc: "Deep words about existence, truth, and the nature of things",
    filter: (w) =>
      /truth|wisdom|soul|spirit|divine|eternal|illusion|contempl|meditat|consciousness|transcend|existence|virtue/i.test(
        w.meaningEn
      ),
  },
  {
    id: "beauty",
    label: "Beauty & Art",
    emoji: "🎨",
    desc: "Words related to aesthetics, elegance, and the arts",
    filter: (w) =>
      /beauty|beautiful|aesthetic|elegant|grace|sublime|delicate|ornate|splendor|radiant|charm|allure/i.test(
        w.meaningEn
      ),
  },
  {
    id: "nature",
    label: "Nature",
    emoji: "🌿",
    desc: "Words drawn from the natural world",
    filter: (w) =>
      /nature|water|earth|sky|sun|moon|forest|flower|rain|river|mountain|tree|wind|ocean|cloud|storm|season/i.test(
        w.meaningEn
      ),
  },
  {
    id: "character",
    label: "Character",
    emoji: "⚖️",
    desc: "Virtues, traits, and qualities of people",
    filter: (w) =>
      /courag|brave|honest|loyal|kind|humble|patient|generous|respect|integrity|charact|virtue|moral|noble|dignit/i.test(
        w.meaningEn
      ),
  },
  {
    id: "verbs",
    label: "Action Verbs",
    emoji: "⚡",
    desc: "Dynamic words that describe doing and happening",
    filter: (w) => w.category === "verb",
  },
  {
    id: "nouns",
    label: "Things & People",
    emoji: "🏺",
    desc: "Concrete nouns — objects, people, and ideas",
    filter: (w) => w.category === "noun",
  },
  {
    id: "phrases",
    label: "Phrases",
    emoji: "💬",
    desc: "Multi-word expressions and idioms",
    filter: (w) => w.category === "phrase",
  },
  {
    id: "beginner",
    label: "Beginner",
    emoji: "🌱",
    desc: "Simple, everyday words perfect for learners",
    filter: (w) => w.difficulty === "beginner",
  },
  {
    id: "advanced",
    label: "Advanced",
    emoji: "🔥",
    desc: "Challenging words for serious learners",
    filter: (w) => w.difficulty === "advanced",
  },
];
