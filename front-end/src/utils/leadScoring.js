// Lead scoring utilities
export function calculateMockScore() {
  // Mock scoring algorithm
  const signals = [];
  let score = 0;

  // Random signals
  const possibleSignals = [
    'Posted about moving to new city',
    'Joined relocation group',
    'Asked for moving recommendations',
    'Changed location in profile',
    'Selling furniture online',
    'Looking for new neighborhood',
    'Complained about packing',
    'Mentioned moving truck rental',
    'Researching moving companies',
    'Planning move timeline'
  ];

  // Generate 2-5 random signals
  const numSignals = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numSignals; i++) {
    const randomSignal = possibleSignals[Math.floor(Math.random() * possibleSignals.length)];
    if (!signals.includes(randomSignal)) {
      signals.push(randomSignal);
      score += 15 + Math.floor(Math.random() * 10);
    }
  }

  // Add location bonus
  if (Math.random() > 0.5) {
    signals.push('Located in target service area');
    score += 10;
  }

  // Add recency bonus
  if (Math.random() > 0.7) {
    signals.push('Recent activity (last 7 days)');
    score += 15;
  }

  // Cap score at 100
  score = Math.min(score, 100);

  return {
    score,
    signals,
    urgency: score > 60 ? 'HIGH' : score > 30 ? 'MEDIUM' : 'LOW'
  };
}

export function getPriorityColor(score) {
  if (score > 60) return 'red';
  if (score > 30) return 'yellow';
  return 'green';
}

export function getPriorityText(score) {
  if (score > 60) return 'Immediate follow-up recommended';
  if (score > 30) return 'Schedule follow-up this week';
  return 'Monitor for additional signals';
}