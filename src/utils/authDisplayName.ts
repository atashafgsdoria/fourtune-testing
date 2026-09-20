type NameMetadata = {
    display_name?: unknown;
    first_name?: unknown;
    middle_name?: unknown;
    last_name?: unknown;
};

function titleCase(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/(^|[\s'-])([a-z])/g, (_, separator, letter) =>
            `${separator}${letter.toUpperCase()}`
        );
}

export function getAuthDisplayName(metadata: NameMetadata | undefined, email?: string) {
    const firstName = typeof metadata?.first_name === 'string' ? metadata.first_name : '';
    const middleName = typeof metadata?.middle_name === 'string' ? metadata.middle_name : '';
    const lastName = typeof metadata?.last_name === 'string' ? metadata.last_name : '';

    if (firstName || middleName || lastName) {
        return [
            titleCase(firstName),
            middleName ? `${titleCase(middleName).charAt(0)}.` : '',
            titleCase(lastName),
        ]
            .filter(Boolean)
            .join(' ');
    }

    const displayName = typeof metadata?.display_name === 'string'
        ? metadata.display_name.trim()
        : '';

    if (displayName) {
        const nameWords = displayName.split(/\s+/);
        if (nameWords.length >= 3) {
            return [
                titleCase(nameWords[0]),
                `${titleCase(nameWords[1]).charAt(0)}.`,
                titleCase(nameWords.slice(2).join(' ')),
            ].join(' ');
        }
        return titleCase(displayName);
    }

    return email ?? 'User';
}