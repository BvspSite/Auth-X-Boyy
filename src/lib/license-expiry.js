/**
 * License Expiry & Duration Utility
 * Supports Seconds, Minutes, Hours, Days, Weeks, Months, Years, and Lifetime
 */

export function calculateDuration(unit = 'Days', durationInput = 1) {
  const dur = parseFloat(durationInput) || 0;
  const cleanUnit = (unit || 'Days').trim();

  if (cleanUnit === 'Lifetime' || dur <= 0) {
    return {
      unit: 'Lifetime',
      duration: 0,
      durationSeconds: 0,
      durationDays: 0,
      isLifetime: true,
      displayDuration: 'Lifetime',
    };
  }

  let durationSeconds = 0;
  let durationDays = 0;
  let displayDuration = '';

  switch (cleanUnit) {
    case 'Seconds':
      durationSeconds = Math.max(1, Math.round(dur));
      durationDays = 0;
      displayDuration = `${dur} Detik`;
      break;

    case 'Minutes':
      durationSeconds = Math.max(1, Math.round(dur * 60));
      durationDays = 0;
      displayDuration = `${dur} Menit`;
      break;

    case 'Hours':
      durationSeconds = Math.max(1, Math.round(dur * 3600));
      durationDays = 0;
      displayDuration = `${dur} Jam`;
      break;

    case 'Days':
      durationSeconds = Math.max(1, Math.round(dur * 86400));
      durationDays = Math.max(1, Math.round(dur));
      displayDuration = `${dur} Hari`;
      break;

    case 'Weeks':
      durationSeconds = Math.max(1, Math.round(dur * 7 * 86400));
      durationDays = Math.max(1, Math.round(dur * 7));
      displayDuration = `${dur} Minggu`;
      break;

    case 'Months':
      durationSeconds = Math.max(1, Math.round(dur * 30 * 86400));
      durationDays = Math.max(1, Math.round(dur * 30));
      displayDuration = `${dur} Bulan`;
      break;

    case 'Years':
      durationSeconds = Math.max(1, Math.round(dur * 365 * 86400));
      durationDays = Math.max(1, Math.round(dur * 365));
      displayDuration = `${dur} Tahun`;
      break;

    default:
      durationSeconds = Math.max(1, Math.round(dur * 86400));
      durationDays = Math.max(1, Math.round(dur));
      displayDuration = `${dur} Hari`;
      break;
  }

  return {
    unit: cleanUnit,
    duration: dur,
    durationSeconds,
    durationDays,
    isLifetime: false,
    displayDuration,
  };
}

export function encodeLicenseNote(userNote = '', { unit, duration, durationSeconds }) {
  const metaTag = `[exp:${JSON.stringify({ unit, dur: duration, sec: durationSeconds })}]`;
  if (!userNote || !userNote.trim()) {
    return metaTag;
  }
  return `${userNote.trim()} ${metaTag}`;
}

export function parseLicenseNote(rawNote, durationDays = 0) {
  let cleanNote = (rawNote || '').trim();
  let unit = 'Days';
  let duration = durationDays;
  let durationSeconds = durationDays * 86400;
  let isLifetime = durationDays === 0;

  if (typeof rawNote === 'string' && rawNote.includes('[exp:')) {
    const match = rawNote.match(/\[exp:(\{.*?\})\]/);
    if (match) {
      try {
        const meta = JSON.parse(match[1]);
        cleanNote = rawNote.replace(match[0], '').trim();
        unit = meta.unit || 'Days';
        duration = meta.dur !== undefined ? meta.dur : durationDays;
        durationSeconds = meta.sec !== undefined ? meta.sec : durationDays * 86400;
        isLifetime = unit === 'Lifetime' || durationSeconds === 0;
      } catch (e) {}
    }
  }

  if (isLifetime) {
    unit = 'Lifetime';
    duration = 0;
    durationSeconds = 0;
  }

  let displayDuration = 'Lifetime';
  if (!isLifetime) {
    switch (unit) {
      case 'Seconds':
        displayDuration = `${duration} Detik`;
        break;
      case 'Minutes':
        displayDuration = `${duration} Menit`;
        break;
      case 'Hours':
        displayDuration = `${duration} Jam`;
        break;
      case 'Days':
        displayDuration = `${duration} Hari`;
        break;
      case 'Weeks':
        displayDuration = `${duration} Minggu`;
        break;
      case 'Months':
        displayDuration = `${duration} Bulan`;
        break;
      case 'Years':
        displayDuration = `${duration} Tahun`;
        break;
      default:
        displayDuration = `${duration} Hari`;
        break;
    }
  }

  return {
    cleanNote,
    unit,
    duration,
    durationSeconds,
    isLifetime,
    displayDuration,
  };
}
