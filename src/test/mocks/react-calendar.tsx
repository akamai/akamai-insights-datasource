// Mock for react-calendar (pure ESM package, incompatible with Jest's CommonJS runner)
import React from 'react';

const Calendar = () => <div data-testid="mock-calendar" />;
Calendar.displayName = 'Calendar';

export { Calendar };
export default Calendar;

