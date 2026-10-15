import names from './locales/names.ko.json';
export const label = value => names[value] || value;
export const matchesSearch = (value, query) => [value, label(value)].some(text => String(text || '').toLocaleLowerCase('ko-KR').includes(query.trim().toLocaleLowerCase('ko-KR')));
