import names from './locales/names.ko.json';
import {rebrand} from './brand.js';
export const label = value => rebrand(names[value] || value);
export const matchesSearch = (value, query) => [value, label(value)].some(text => String(text || '').toLocaleLowerCase('ko-KR').includes(query.trim().toLocaleLowerCase('ko-KR')));
