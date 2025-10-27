(function (global) {
  const STORAGE_KEYS = {
    ASSIGNMENTS: 'meAssignments',
    SEQUENCE: 'meSequence'
  };

  const LEGACY_ME_ID_PATTERN = /^ME(?:[-\s]?([A-Z]+))?0*(\d+)$/i;
  const NEW_ME_ID_PATTERN = /^ME\s*(\d{3,})$/;
  const MIN_WIDTH = 3;

  function formatMeId(number) {
    const numeric = Number(number) || 0;
    const normalized = Math.max(1, Math.floor(numeric));
    return `ME ${String(normalized).padStart(MIN_WIDTH, '0')}`;
  }

  function parseLegacyMeId(meId) {
    if (typeof meId !== 'string') {
      return null;
    }

    const trimmed = meId.trim();
    const newMatch = trimmed.match(NEW_ME_ID_PATTERN);
    if (newMatch) {
      return Number.parseInt(newMatch[1], 10);
    }

    const match = trimmed.match(LEGACY_ME_ID_PATTERN);
    if (!match) {
      return null;
    }

    return Number.parseInt(match[2], 10);
  }

  function normalizeMeId(meId) {
    const number = parseLegacyMeId(meId);
    return number ? formatMeId(number) : meId;
  }

  function readFromStorage(key) {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('Failed to read from localStorage', error);
      return null;
    }
  }

  function writeToStorage(key, value) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to write to localStorage', error);
    }
  }

  function collectAssignments(assignments) {
    if (!assignments) {
      return [];
    }

    if (Array.isArray(assignments)) {
      return assignments;
    }

    if (typeof assignments === 'object') {
      return Object.values(assignments);
    }

    return [];
  }

  function getAssignmentMeId(entry) {
    if (!entry || typeof entry !== 'object') {
      return null;
    }

    return (
      entry.meId ??
      entry.meID ??
      entry.me_id ??
      entry.me ??
      null
    );
  }

  function setAssignmentMeId(entry, value) {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    if ('meId' in entry) {
      entry.meId = value;
    } else if ('meID' in entry) {
      entry.meID = value;
    } else if ('me_id' in entry) {
      entry.me_id = value;
    } else if ('me' in entry) {
      entry.me = value;
    } else {
      entry.meId = value;
    }
  }

  function migrateAssignments(assignments) {
    const entries = collectAssignments(assignments);
    let changed = false;

    for (const entry of entries) {
      const meId = getAssignmentMeId(entry);
      if (!meId) {
        continue;
      }

      const normalized = normalizeMeId(meId);
      if (normalized && normalized !== meId) {
        setAssignmentMeId(entry, normalized);
        changed = true;
      }
    }

    return { changed, entries };
  }

  function readSequence() {
    const stored = readFromStorage(STORAGE_KEYS.SEQUENCE);

    if (Array.isArray(stored)) {
      return stored
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isFinite(value) && value > 0);
    }

    if (Number.isFinite(stored)) {
      return [stored];
    }

    return [];
  }

  function writeSequence(sequence) {
    const sanitized = Array.from(new Set(sequence))
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);

    writeToStorage(STORAGE_KEYS.SEQUENCE, sanitized);
    return sanitized;
  }

  function indexToLetters(index) {
    const numericIndex = Number(index);

    if (!Number.isFinite(numericIndex) || numericIndex < 0) {
      return formatMeId(1);
    }

    return String(numericIndex + 1).padStart(MIN_WIDTH, '0');
  }

  function syncSequenceWithAssignments(assignments) {
    const { changed } = migrateAssignments(assignments);
    const entries = collectAssignments(assignments);
    const sequence = new Set(readSequence());

    for (const entry of entries) {
      const meId = getAssignmentMeId(entry);
      const number = parseLegacyMeId(meId);
      if (number) {
        sequence.add(number);
      }
    }

    const ordered = writeSequence([...sequence]);

    if (changed && assignments && typeof localStorage !== 'undefined') {
      writeToStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);
    }

    return ordered;
  }

  function assignNextMeId(assignments) {
    const sequence = syncSequenceWithAssignments(assignments);
    const nextNumber = (sequence[sequence.length - 1] ?? 0) + 1;
    const formatted = formatMeId(nextNumber);
    writeSequence([...sequence, nextNumber]);
    return formatted;
  }

  function migrateStoredAssignments() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const rawAssignments = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      if (!rawAssignments) {
        return;
      }

      const parsedAssignments = JSON.parse(rawAssignments);
      const { changed } = migrateAssignments(parsedAssignments);
      if (changed) {
        localStorage.setItem(
          STORAGE_KEYS.ASSIGNMENTS,
          JSON.stringify(parsedAssignments)
        );
      }

      syncSequenceWithAssignments(parsedAssignments);
    } catch (error) {
      console.warn('Failed to migrate assignments from localStorage', error);
    }
  }

  migrateStoredAssignments();

  global.assignNextMeId = assignNextMeId;
  global.indexToLetters = indexToLetters;
  global.syncSequenceWithAssignments = syncSequenceWithAssignments;
  global.normalizeMeId = normalizeMeId;
  global.formatMeId = formatMeId;
})(typeof window !== 'undefined' ? window : globalThis);
