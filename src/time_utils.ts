export function parseRelativeTime(input: string): Date | null {
    const normalized = input.toLowerCase().trim();
    const inMatch = normalized.match(/^in\s+(\d+(?:\.\d+)?)\s+(second|minute|hour|day|week|month|year)s?$/);

    if (!inMatch) {
        return null;
    }

    const amount = parseFloat(inMatch[1]!);
    const unit = inMatch[2];

    if (!unit || isNaN(amount)) {
        return null;
    }

    const now = new Date();

    const msMap: Record<string, number> = {
        second: 1000,
        minute: 1000 * 60,
        hour: 1000 * 60 * 60,
        day: 1000 * 60 * 60 * 24,
        week: 1000 * 60 * 60 * 24 * 7,
        month: 1000 * 60 * 60 * 24 * 30,
        year: 1000 * 60 * 60 * 24 * 365,
    };

    const ms = amount * (msMap[unit] || 0);
    const targetTime = new Date(now.getTime() + ms);

    console.log(`[parseRelativeTime] Input: "${input}" -> Target: ${targetTime.toISOString()} (${targetTime.toLocaleString('en-GB', { timeZone: 'Europe/Vienna' })})`);

    return targetTime;
}

export function parseViennaTime(input: string): Date | null {
    const isoMatch = input.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/);
    
    if (!isoMatch) {
        return null;
    }

    const hasTimezone = isoMatch[2] !== undefined;
    
    if (!hasTimezone) {
        const [datePart, timePart] = input.split('T');
        const viennaDate = new Date(`${datePart}T${timePart}+01:00`);
        console.log(`[parseViennaTime] No timezone, treating as Vienna: "${input}" -> ${viennaDate.toISOString()} (${viennaDate.toLocaleString('en-GB', { timeZone: 'Europe/Vienna' })})`);
        return viennaDate;
    }

    const date = new Date(input);
    
    if (isNaN(date.getTime())) {
        return null;
    }

    console.log(`[parseViennaTime] Input: "${input}" -> ${date.toISOString()} (${date.toLocaleString('en-GB', { timeZone: 'Europe/Vienna' })})`);
    
    return date;
}
