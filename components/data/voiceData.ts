export interface Voice {
    id: string;
    name: string;
    gender: 'Male' | 'Female';
    lang: string;
    engine: string;
    flag: string;
    countryName: string;
}

export const TTS_VOICES: Voice[] = [
    // 🇺🇸 English (US)
    { id: 'henry', name: 'Henry', gender: 'Male', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'bwyneth', name: 'Bwyneth', gender: 'Female', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'mrbeast', name: 'MrBeast', gender: 'Male', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'gwyneth', name: 'Gwyneth', gender: 'Female', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'benwilson', name: 'Ben Wilson', gender: 'Male', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'cliff', name: 'Cliff', gender: 'Male', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'presidential', name: 'Presidential', gender: 'Male', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'carly', name: 'Carly', gender: 'Female', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'kyle', name: 'Kyle', gender: 'Male', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'kristy', name: 'Kristy', gender: 'Female', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'oliver', name: 'Oliver', gender: 'Male', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'tasha', name: 'Tasha', gender: 'Female', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'joe', name: 'Joe', gender: 'Male', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'lisa', name: 'Lisa', gender: 'Female', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'george', name: 'George', gender: 'Male', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'emily', name: 'Emily', gender: 'Female', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'rob', name: 'Rob', gender: 'Male', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'nate', name: 'Nate', gender: 'Male', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'mary', name: 'Mary', gender: 'Female', lang: 'en-US', engine: 'speechify', flag: '🇺🇸', countryName: 'United States' },
    { id: 'guy', name: 'Guy', gender: 'Male', lang: 'en-US', engine: 'azure', flag: '🇺🇸', countryName: 'United States' },
    { id: 'jane', name: 'Jane', gender: 'Female', lang: 'en-US', engine: 'azure', flag: '🇺🇸', countryName: 'United States' },
    { id: 'jenny', name: 'Jenny', gender: 'Female', lang: 'en-US', engine: 'azure', flag: '🇺🇸', countryName: 'United States' },
    { id: 'aria', name: 'Aria', gender: 'Female', lang: 'en-US', engine: 'azure', flag: '🇺🇸', countryName: 'United States' },
    { id: 'matthew', name: 'Matthew', gender: 'Male', lang: 'en-US', engine: 'neural', flag: '🇺🇸', countryName: 'United States' },
    { id: 'joanna', name: 'Joanna', gender: 'Female', lang: 'en-US', engine: 'neural', flag: '🇺🇸', countryName: 'United States' },
    { id: 'salli', name: 'Salli', gender: 'Female', lang: 'en-US', engine: 'neural', flag: '🇺🇸', countryName: 'United States' },
    { id: 'joey', name: 'Joey', gender: 'Male', lang: 'en-US', engine: 'neural', flag: '🇺🇸', countryName: 'United States' },
    { id: 'snoop', name: 'Snoop Dogg', gender: 'Male', lang: 'en-US', engine: 'resemble', flag: '🇺🇸', countryName: 'United States' },

    // 🇬🇧 English (UK)
    { id: 'russell', name: 'Russell', gender: 'Male', lang: 'en-GB', engine: 'speechify', flag: '🇬🇧', countryName: 'United Kingdom' },
    { id: 'benjamin', name: 'Benjamin', gender: 'Male', lang: 'en-GB', engine: 'speechify', flag: '🇬🇧', countryName: 'United Kingdom' },
    { id: 'michael', name: 'Michael', gender: 'Male', lang: 'en-GB', engine: 'speechify', flag: '🇬🇧', countryName: 'United Kingdom' },
    { id: 'narrator', name: 'Narrator', gender: 'Male', lang: 'en-GB', engine: 'speechify', flag: '🇬🇧', countryName: 'United Kingdom' },
    { id: 'ryan', name: 'Ryan', gender: 'Male', lang: 'en-GB', engine: 'azure', flag: '🇬🇧', countryName: 'United Kingdom' },
    { id: 'sonia', name: 'Sonia', gender: 'Female', lang: 'en-GB', engine: 'azure', flag: '🇬🇧', countryName: 'United Kingdom' },
    { id: 'oliver', name: 'Oliver (UK)', gender: 'Male', lang: 'en-GB', engine: 'azure', flag: '🇬🇧', countryName: 'United Kingdom' },
    { id: 'thomas', name: 'Thomas', gender: 'Male', lang: 'en-GB', engine: 'azure', flag: '🇬🇧', countryName: 'United Kingdom' },
    { id: 'libby', name: 'Libby', gender: 'Female', lang: 'en-GB', engine: 'azure', flag: '🇬🇧', countryName: 'United Kingdom' },
    { id: 'amy', name: 'Amy', gender: 'Female', lang: 'en-GB', engine: 'neural', flag: '🇬🇧', countryName: 'United Kingdom' },
    { id: 'brian', name: 'Brian', gender: 'Male', lang: 'en-GB', engine: 'neural', flag: '🇬🇧', countryName: 'United Kingdom' },

    // 🇦🇺 English (Australia)
    { id: 'natasha', name: 'Natasha', gender: 'Female', lang: 'en-AU', engine: 'azure', flag: '🇦🇺', countryName: 'Australia' },
    { id: 'william', name: 'William', gender: 'Male', lang: 'en-AU', engine: 'azure', flag: '🇦🇺', countryName: 'Australia' },
    { id: 'freya', name: 'Freya', gender: 'Female', lang: 'en-AU', engine: 'azure', flag: '🇦🇺', countryName: 'Australia' },
    { id: 'ken', name: 'Ken', gender: 'Male', lang: 'en-AU', engine: 'azure', flag: '🇦🇺', countryName: 'Australia' },
    { id: 'olivia', name: 'Olivia', gender: 'Female', lang: 'en-AU', engine: 'neural', flag: '🇦🇺', countryName: 'Australia' },

    // 🇮🇩 Indonesian
    { id: 'gadis', name: 'Gadis', gender: 'Female', lang: 'id-ID', engine: 'azure', flag: '🇮🇩', countryName: 'Indonesia' },
    { id: 'ardi', name: 'Ardi', gender: 'Male', lang: 'id-ID', engine: 'azure', flag: '🇮🇩', countryName: 'Indonesia' },

    // 🇨🇳 Chinese (Mandarin)
    { id: 'xiaoxiao', name: 'Xiaoxiao', gender: 'Female', lang: 'zh-CN', engine: 'azure', flag: '🇨🇳', countryName: 'China' },
    { id: 'yunfeng', name: 'Yunfeng', gender: 'Male', lang: 'zh-CN', engine: 'azure', flag: '🇨🇳', countryName: 'China' },
    { id: 'xiaomeng', name: 'Xiaomeng', gender: 'Female', lang: 'zh-CN', engine: 'azure', flag: '🇨🇳', countryName: 'China' },
    { id: 'yunjian', name: 'Yunjian', gender: 'Male', lang: 'zh-CN', engine: 'azure', flag: '🇨🇳', countryName: 'China' },
    { id: 'xiaoyan', name: 'Xiaoyan', gender: 'Female', lang: 'zh-CN', engine: 'azure', flag: '🇨🇳', countryName: 'China' },
    { id: 'yunze', name: 'Yunze', gender: 'Male', lang: 'zh-CN', engine: 'azure', flag: '🇨🇳', countryName: 'China' },
    { id: 'zhiyu', name: 'Zhiyu', gender: 'Male', lang: 'zh-CN', engine: 'neural', flag: '🇨🇳', countryName: 'China' },

    // 🇯🇵 Japanese
    { id: 'mayu', name: 'Mayu', gender: 'Female', lang: 'ja-JP', engine: 'azure', flag: '🇯🇵', countryName: 'Japan' },
    { id: 'naoki', name: 'Naoki', gender: 'Male', lang: 'ja-JP', engine: 'azure', flag: '🇯🇵', countryName: 'Japan' },
    { id: 'nanami', name: 'Nanami', gender: 'Female', lang: 'ja-JP', engine: 'azure', flag: '🇯🇵', countryName: 'Japan' },
    { id: 'daichi', name: 'Daichi', gender: 'Male', lang: 'ja-JP', engine: 'azure', flag: '🇯🇵', countryName: 'Japan' },
    { id: 'shiori', name: 'Shiori', gender: 'Female', lang: 'ja-JP', engine: 'azure', flag: '🇯🇵', countryName: 'Japan' },
    { id: 'keita', name: 'Keita', gender: 'Male', lang: 'ja-JP', engine: 'azure', flag: '🇯🇵', countryName: 'Japan' },

    // 🇰🇷 Korean
    { id: 'sunhi', name: 'Sunhi', gender: 'Female', lang: 'ko-KR', engine: 'azure', flag: '🇰🇷', countryName: 'South Korea' },
    { id: 'injoon', name: 'Injoon', gender: 'Male', lang: 'ko-KR', engine: 'azure', flag: '🇰🇷', countryName: 'South Korea' },
    { id: 'jimin', name: 'Jimin', gender: 'Female', lang: 'ko-KR', engine: 'azure', flag: '🇰🇷', countryName: 'South Korea' },
    { id: 'bongjin', name: 'Bongjin', gender: 'Male', lang: 'ko-KR', engine: 'azure', flag: '🇰🇷', countryName: 'South Korea' },
    { id: 'seoyeon', name: 'Seoyeon', gender: 'Female', lang: 'ko-KR', engine: 'neural', flag: '🇰🇷', countryName: 'South Korea' },

    // 🇪🇸 Spanish (Spain)
    { id: 'saul', name: 'Saul', gender: 'Male', lang: 'es-ES', engine: 'azure', flag: '🇪🇸', countryName: 'Spain' },
    { id: 'vera', name: 'Vera', gender: 'Female', lang: 'es-ES', engine: 'azure', flag: '🇪🇸', countryName: 'Spain' },
    { id: 'arnau', name: 'Arnau', gender: 'Male', lang: 'es-ES', engine: 'azure', flag: '🇪🇸', countryName: 'Spain' },
    { id: 'triana', name: 'Triana', gender: 'Female', lang: 'es-ES', engine: 'azure', flag: '🇪🇸', countryName: 'Spain' },

    // 🇲🇽 Spanish (Mexico)
    { id: 'gerardo', name: 'Gerardo', gender: 'Male', lang: 'es-MX', engine: 'azure', flag: '🇲🇽', countryName: 'Mexico' },
    { id: 'carlota', name: 'Carlota', gender: 'Female', lang: 'es-MX', engine: 'azure', flag: '🇲🇽', countryName: 'Mexico' },
    { id: 'luciano', name: 'Luciano', gender: 'Male', lang: 'es-MX', engine: 'azure', flag: '🇲🇽', countryName: 'Mexico' },
    { id: 'larissa', name: 'Larissa', gender: 'Female', lang: 'es-MX', engine: 'azure', flag: '🇲🇽', countryName: 'Mexico' },

    // 🇫🇷 French (France)
    { id: 'denise', name: 'Denise', gender: 'Female', lang: 'fr-FR', engine: 'azure', flag: '🇫🇷', countryName: 'France' },
    { id: 'henri', name: 'Henri', gender: 'Male', lang: 'fr-FR', engine: 'azure', flag: '🇫🇷', countryName: 'France' },
    { id: 'celeste', name: 'Celeste', gender: 'Female', lang: 'fr-FR', engine: 'azure', flag: '🇫🇷', countryName: 'France' },
    { id: 'claude', name: 'Claude', gender: 'Male', lang: 'fr-FR', engine: 'azure', flag: '🇫🇷', countryName: 'France' },

    // 🇩🇪 German
    { id: 'katja', name: 'Katja', gender: 'Female', lang: 'de-DE', engine: 'azure', flag: '🇩🇪', countryName: 'Germany' },
    { id: 'christoph', name: 'Christoph', gender: 'Male', lang: 'de-DE', engine: 'azure', flag: '🇩🇪', countryName: 'Germany' },
    { id: 'louisa', name: 'Louisa', gender: 'Female', lang: 'de-DE', engine: 'azure', flag: '🇩🇪', countryName: 'Germany' },
    { id: 'conrad', name: 'Conrad', gender: 'Male', lang: 'de-DE', engine: 'azure', flag: '🇩🇪', countryName: 'Germany' },
    { id: 'vicki', name: 'Vicki', gender: 'Female', lang: 'de-DE', engine: 'neural', flag: '🇩🇪', countryName: 'Germany' },
    { id: 'daniel', name: 'Daniel', gender: 'Male', lang: 'de-DE', engine: 'neural', flag: '🇩🇪', countryName: 'Germany' },

    // 🇮🇹 Italian
    { id: 'irma', name: 'Irma', gender: 'Female', lang: 'it-IT', engine: 'azure', flag: '🇮🇹', countryName: 'Italy' },
    { id: 'benigno', name: 'Benigno', gender: 'Male', lang: 'it-IT', engine: 'azure', flag: '🇮🇹', countryName: 'Italy' },
    { id: 'elsa', name: 'Elsa', gender: 'Female', lang: 'it-IT', engine: 'azure', flag: '🇮🇹', countryName: 'Italy' },
    { id: 'gianni', name: 'Gianni', gender: 'Male', lang: 'it-IT', engine: 'azure', flag: '🇮🇹', countryName: 'Italy' },
    { id: 'bianca', name: 'Bianca', gender: 'Female', lang: 'it-IT', engine: 'neural', flag: '🇮🇹', countryName: 'Italy' },
    { id: 'adriano', name: 'Adriano', gender: 'Male', lang: 'it-IT', engine: 'neural', flag: '🇮🇹', countryName: 'Italy' },

    // 🇧🇷 Portuguese (Brazil)
    { id: 'brenda', name: 'Brenda', gender: 'Female', lang: 'pt-BR', engine: 'azure', flag: '🇧🇷', countryName: 'Brazil' },
    { id: 'donato', name: 'Donato', gender: 'Male', lang: 'pt-BR', engine: 'azure', flag: '🇧🇷', countryName: 'Brazil' },
    { id: 'yara', name: 'Yara', gender: 'Female', lang: 'pt-BR', engine: 'azure', flag: '🇧🇷', countryName: 'Brazil' },
    { id: 'fabio', name: 'Fabio', gender: 'Male', lang: 'pt-BR', engine: 'azure', flag: '🇧🇷', countryName: 'Brazil' },
    { id: 'camila', name: 'Camila', gender: 'Female', lang: 'pt-BR', engine: 'neural', flag: '🇧🇷', countryName: 'Brazil' },
    { id: 'thiago', name: 'Thiago', gender: 'Male', lang: 'pt-BR', engine: 'neural', flag: '🇧🇷', countryName: 'Brazil' },

    // 🇷🇺 Russian
    { id: 'dariya', name: 'Dariya', gender: 'Female', lang: 'ru-RU', engine: 'azure', flag: '🇷🇺', countryName: 'Russia' },
    { id: 'dmitry', name: 'Dmitry', gender: 'Male', lang: 'ru-RU', engine: 'azure', flag: '🇷🇺', countryName: 'Russia' },
    { id: 'tatyana', name: 'Tatyana', gender: 'Female', lang: 'ru-RU', engine: 'standard', flag: '🇷🇺', countryName: 'Russia' },
    { id: 'maxim', name: 'Maxim', gender: 'Male', lang: 'ru-RU', engine: 'standard', flag: '🇷🇺', countryName: 'Russia' },

    // 🇳🇱 Dutch
    { id: 'colette', name: 'Colette', gender: 'Female', lang: 'nl-NL', engine: 'azure', flag: '🇳🇱', countryName: 'Netherlands' },
    { id: 'maarten', name: 'Maarten', gender: 'Male', lang: 'nl-NL', engine: 'azure', flag: '🇳🇱', countryName: 'Netherlands' },
    { id: 'laura', name: 'Laura', gender: 'Female', lang: 'nl-NL', engine: 'neural', flag: '🇳🇱', countryName: 'Netherlands' },
    { id: 'ruben', name: 'Ruben', gender: 'Male', lang: 'nl-NL', engine: 'standard', flag: '🇳🇱', countryName: 'Netherlands' },

    // 🇹🇭 Thai
    { id: 'premwadee', name: 'Premwadee', gender: 'Female', lang: 'th-TH', engine: 'azure', flag: '🇹🇭', countryName: 'Thailand' },
    { id: 'niwat', name: 'Niwat', gender: 'Male', lang: 'th-TH', engine: 'azure', flag: '🇹🇭', countryName: 'Thailand' },

    // 🇻🇳 Vietnamese
    { id: 'hoaimy', name: 'Hoai My', gender: 'Female', lang: 'vi-VN', engine: 'azure', flag: '🇻🇳', countryName: 'Vietnam' },
    { id: 'namminh', name: 'Nam Minh', gender: 'Male', lang: 'vi-VN', engine: 'azure', flag: '🇻🇳', countryName: 'Vietnam' },

    // 🇹🇷 Turkish
    { id: 'emel', name: 'Emel', gender: 'Female', lang: 'tr-TR', engine: 'azure', flag: '🇹🇷', countryName: 'Turkey' },
    { id: 'ahmet', name: 'Ahmet', gender: 'Male', lang: 'tr-TR', engine: 'azure', flag: '🇹🇷', countryName: 'Turkey' },
];
