import type { CalendarEvent } from '../types';

// Function to format a date for iCalendar, e.g., 2024-08-21 -> 20240821
const formatICalDate = (isoDate: string): string => {
    return isoDate.replace(/-/g, '').split('T')[0];
};

export const generateIcsContent = (events: CalendarEvent[], projectName: string): string => {
    const icsLines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Shaun Coggins Inc.//RFP Response Generator//EN',
        `X-WR-CALNAME:Deadlines for ${projectName}`,
    ];

    const now = new Date().toISOString().replace(/[-:.]/g, '').split('Z')[0] + 'Z';

    events.forEach(event => {
        try {
            const startDate = new Date(event.date);
            // Ensure date is valid
            if (isNaN(startDate.getTime())) {
                console.warn(`Invalid date found for event "${event.title}": ${event.date}`);
                return; // Skip invalid events
            }
            
            // For all-day events, DTEND is the next day.
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);

            icsLines.push('BEGIN:VEVENT');
            icsLines.push(`UID:${crypto.randomUUID()}@shauncoggins.inc`);
            icsLines.push(`DTSTAMP:${now}`);
            icsLines.push(`DTSTART;VALUE=DATE:${formatICalDate(startDate.toISOString())}`);
            icsLines.push(`DTEND;VALUE=DATE:${formatICalDate(endDate.toISOString())}`);
            icsLines.push(`SUMMARY:${event.title}`);
            icsLines.push(`DESCRIPTION:Key date for project: ${projectName}`);
            icsLines.push('END:VEVENT');
        } catch (e) {
            console.error(`Could not process event: ${event.title}`, e);
        }
    });

    icsLines.push('END:VCALENDAR');

    return icsLines.join('\r\n');
};

export const downloadIcsFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
