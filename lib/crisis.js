// Crisis keyword detection.
// If a post, reply, or message contains self-harm language, the app shows a
// prominent crisis banner pointing to 988 and the Crisis Text Line.
// This is a safety feature only — it never gives medical advice and never
// blocks the person from posting.

const CRISIS_PHRASES = [
  "kill myself",
  "killing myself",
  "suicide",
  "suicidal",
  "end my life",
  "end it all",
  "want to die",
  "wanna die",
  "don't want to live",
  "dont want to live",
  "do not want to live",
  "hurt myself",
  "hurting myself",
  "harm myself",
  "harming myself",
  "self-harm",
  "self harm",
  "cut myself",
  "cutting myself",
  "no reason to live",
  "better off dead",
  "take my own life",
  "taking my own life",
  "want to disappear",
  "wish i was dead",
  "wish i were dead",
];

function containsCrisisLanguage(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CRISIS_PHRASES.some((p) => lower.includes(p));
}

module.exports = { CRISIS_PHRASES, containsCrisisLanguage };
