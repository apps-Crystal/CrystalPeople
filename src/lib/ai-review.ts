export interface ReviewValidation {
  isClean: boolean;
  flags: string[];
  suggestion: string;
}

const HARSH_WORDS = [
  "terrible", "awful", "incompetent", "useless", "worst", "pathetic",
  "hopeless", "lazy", "stupid", "disappointing", "disaster", "failure",
  "worthless", "horrible", "dreadful", "abysmal",
];

const VAGUE_PHRASES = [
  "good job", "keep it up", "needs improvement", "do better",
  "okay work", "fine", "not bad", "could be better", "average",
];

const PERSONAL_PATTERNS = [
  /\byou always\b/i, /\byou never\b/i, /\byour attitude\b/i,
  /\byour problem\b/i, /\byou are\b/i, /\byou're\b/i,
];

const NEGATIVE_WORDS = [
  "failed", "poor", "weak", "bad", "wrong", "lacking", "insufficient",
  "unacceptable", "below", "miss", "missed", "delay", "delayed", "late",
  "absent", "careless", "negligent", "slow",
];

const POSITIVE_WORDS = [
  "good", "great", "excellent", "improved", "strong", "well",
  "positive", "progress", "suggest", "recommend", "opportunity",
  "growth", "develop", "support", "help", "encourage",
];

export function validateReviewNotes(text: string, employeeName: string): ReviewValidation {
  const flags: string[] = [];
  const lower = text.toLowerCase();

  // 1. Harsh language
  for (const word of HARSH_WORDS) {
    if (lower.includes(word)) {
      flags.push(`Contains harsh language: "${word}"`);
      break; // only flag once
    }
  }

  // 2. Vague feedback
  if (text.trim().length < 30) {
    flags.push("Feedback is too vague — provide specific examples");
  } else {
    const isOnlyVague = VAGUE_PHRASES.some(p => {
      const trimmed = lower.replace(/[.,!?]/g, "").trim();
      return trimmed === p || trimmed.startsWith(p);
    });
    if (isOnlyVague) {
      flags.push("Feedback is too vague — provide specific examples");
    }
  }

  // 3. Personal attacks
  for (const pattern of PERSONAL_PATTERNS) {
    if (pattern.test(text)) {
      flags.push("Avoid personal generalizations — focus on specific behaviours or outcomes");
      break;
    }
  }

  // 4. Unconstructive negativity
  const negCount = NEGATIVE_WORDS.filter(w => lower.includes(w)).length;
  const posCount = POSITIVE_WORDS.filter(w => lower.includes(w)).length;
  if (negCount >= 3 && posCount === 0) {
    flags.push("Feedback appears one-sided — include constructive suggestions");
  }

  // 5. Name in negative context
  const firstName = employeeName.split(" ")[0];
  if (firstName && firstName.length > 1) {
    const nameNegPatterns = [
      new RegExp(`${firstName}\\s+(failed|didn't|did not|couldn't|could not|never|always)`, "i"),
      new RegExp(`${firstName}\\s+is\\s+(lazy|incompetent|useless|terrible)`, "i"),
    ];
    for (const p of nameNegPatterns) {
      if (p.test(text)) {
        flags.push("Avoid associating the employee's name directly with negative outcomes");
        break;
      }
    }
  }

  const suggestion = flags.length > 0
    ? "Consider reframing feedback to focus on specific actions and outcomes. Use 'I observed...' or 'The result was...' instead of generalizations."
    : "";

  return { isClean: flags.length === 0, flags, suggestion };
}
