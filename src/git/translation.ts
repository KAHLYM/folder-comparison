import { Status } from './extract';

interface TranslationEntry {
    abbreviation: string,
    status: Status,
    string: string,
}

const translationEntries: TranslationEntry[] = [
    { abbreviation: "A", status: 0, string: "addition" },
    { abbreviation: "D", status: 1, string: "deletion" },
    { abbreviation: "M", status: 2, string: "modification" },
    { abbreviation: "R", status: 3, string: "rename" },
    { abbreviation: "I", status: 4, string: "intermediate" },
    { abbreviation: "", status: 5, string: "null" },
];

/* istanbul ignore next: TODO */
export function getTranslationByAbbreviation(abbreviation: string): TranslationEntry {
    const translationEntry = translationEntries.find(translationEntry => {
        return translationEntry.abbreviation === abbreviation;
    });

    if (!translationEntry) {
        throw RangeError("Could not find translation entry by abbreviation");
    }

    return translationEntry;
}

/* istanbul ignore next: TODO */
export function getTranslationByEnum(status: Status): TranslationEntry {
    const translationEntry =  translationEntries.find(translationEntry => {
        return translationEntry.status === status;
    });

    if (!translationEntry) {
        throw RangeError("Could not find translation entry by enum");
    }

    return translationEntry;
}

/* istanbul ignore next: TODO */
export function getTranslationByString(string: string): TranslationEntry {
    const translationEntry =  translationEntries.find(translationEntry => {
        return translationEntry.string === string;
    });

    if (!translationEntry) {
        throw RangeError("Could not find translation entry by string");
    }

    return translationEntry;
}
