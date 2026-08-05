export const getMedicineDescription = (pattern?: string, instructions?: string) => {
  let timeString = '';
  if (pattern) {
    const parts = pattern.split(/[+-]/).map((p) => p.trim());
    if (parts.length === 3) {
      const [morning, noon, night] = parts;
      const times: string[] = [];
      if (morning !== '0') times.push('morning');
      if (noon !== '0') times.push('noon');
      if (night !== '0') times.push('night');

      if (times.length === 1) {
        timeString = times[0];
      } else if (times.length === 2) {
        timeString = `${times[0]} and ${times[1]}`;
      } else if (times.length === 3) {
        timeString = `${times[0]}, ${times[1]} and ${times[2]}`;
      }
    }
  }

  // Extract meal timing and ignore extra descriptions (e.g. "for pain or fever")
  let mealTiming = '';
  if (instructions) {
    const lowerInstr = instructions.toLowerCase();
    const match = lowerInstr.match(
      /(with or without food|after meals|before meals|after meal|before meal|with food|without food)/i,
    );
    if (match) {
      mealTiming = match[1];
    }
  }

  let desc = timeString ? `Take in the ${timeString}` : '';
  if (mealTiming) {
    desc = desc ? `${desc} ${mealTiming}` : `Take ${mealTiming}`;
  }

  return desc || 'Take as directed';
};

export const getMealTiming = (instructions?: string) => {
  if (!instructions) return '';
  const lowerInstr = instructions.toLowerCase();
  const match = lowerInstr.match(
    /(with or without food|after meals|before meals|after meal|before meal|with food|without food)/i,
  );
  return match ? match[1] : '';
};
