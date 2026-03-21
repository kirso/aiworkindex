import researchLibraryData from './research-library.json';

export const researchLibrary = researchLibraryData;

export type ResearchLibrary = typeof researchLibrary;
export type ResearchLibraryEntry = (typeof researchLibrary.entries)[number];
