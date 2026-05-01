import connectDB from "./db";
import Word from "../models/Word";
import { EPOCH } from "./constants";

// Cache expires at next midnight so the daily word always updates on time
let wordsCache = null;
let cacheExpiresAt = 0;

export function invalidateCache() {
  wordsCache = null;
  cacheExpiresAt = 0;
}

function nextMidnightMs() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

async function getWords() {
  if (wordsCache && Date.now() < cacheExpiresAt) return wordsCache;
  await connectDB();
  const words = await Word.find().sort({ order: 1, createdAt: 1 }).lean();
  wordsCache = words;
  cacheExpiresAt = nextMidnightMs();
  return words;
}

export async function fetchTodayData() {
  const words = await getWords();

  if (!words.length) {
    return { word: null, wordIndex: 0, archive: [], dateStr: "" };
  }

  const dayIndex = Math.floor((Date.now() - EPOCH) / 86400000);
  const index = dayIndex % words.length;

  const dateStr = new Date()
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();

  const archive = [];
  for (let i = 1; i <= 7; i++) {
    const date = new Date(Date.now() - i * 86400000);
    const di = Math.floor((date.getTime() - EPOCH) / 86400000);
    const idx = di % words.length;
    archive.push({ word: words[idx], index: idx, date: date.toISOString() });
  }

  return {
    word: JSON.parse(JSON.stringify(words[index])),
    wordIndex: index,
    archive: JSON.parse(JSON.stringify(archive)),
    dateStr,
  };
}

export async function fetchAllWords() {
  return getWords();
}
