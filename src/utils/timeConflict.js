/**
 * Utility functions for checking doctor availability and appointment time conflicts.
 */

// Convert "HH:mm" time string into total minutes from midnight
export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

// Convert minutes from midnight back to "HH:mm"
export const minutesToTime = (minutes) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

// Check if two time intervals overlap: [startA, endA) and [startB, endB)
export const doTimesOverlap = (startA, durationA, startB, durationB) => {
  const aStart = typeof startA === 'number' ? startA : timeToMinutes(startA);
  const aEnd = aStart + Number(durationA || 30);

  const bStart = typeof startB === 'number' ? startB : timeToMinutes(startB);
  const bEnd = bStart + Number(durationB || 30);

  // Overlap condition
  return aStart < bEnd && aEnd > bStart;
};

// Format date to YYYY-MM-DD string
export const formatDateToISO = (dateInput) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

// Get Day of Week name in English (e.g. "Monday")
export const getDayOfWeek = (dateInput) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dateInput);
  return days[d.getUTCDay()];
};

/**
 * Check if a doctor is available for a requested appointment time slot.
 * @param {Object} prisma - Prisma Client instance
 * @param {Object} params
 * @param {string} params.doctorId
 * @param {string|Date} params.appointmentDate
 * @param {string} params.appointmentTime - "HH:mm"
 * @param {number} params.durationMinutes - e.g. 30, 45, 60
 * @param {string} [params.excludeAppointmentId] - ID of appointment to exclude (for updates)
 */
export const checkAppointmentConflict = async (prisma, {
  doctorId,
  appointmentDate,
  appointmentTime,
  durationMinutes = 30,
  excludeAppointmentId = null,
}) => {
  // 1. Verify doctor exists and is active
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
  });

  if (!doctor) {
    return {
      hasConflict: true,
      reason: 'INVALID_DOCTOR',
      message: `Doctor with ID '${doctorId}' does not exist.`,
    };
  }

  if (!doctor.isActive) {
    return {
      hasConflict: true,
      reason: 'DOCTOR_INACTIVE',
      message: `Doctor ${doctor.name} is currently inactive and cannot accept new appointments.`,
    };
  }

  // 2. Validate day of week availability
  const dayName = getDayOfWeek(appointmentDate);
  if (doctor.availabilityDays && doctor.availabilityDays.length > 0) {
    const isWorkingDay = doctor.availabilityDays.some(
      (d) => d.toLowerCase() === dayName.toLowerCase()
    );

    if (!isWorkingDay) {
      return {
        hasConflict: true,
        reason: 'DOCTOR_DAY_OFF',
        message: `Dr. ${doctor.name} is not scheduled to work on ${dayName}s. Available days: ${doctor.availabilityDays.join(', ')}.`,
      };
    }
  }

  // 3. Validate working hours
  const requestedStart = timeToMinutes(appointmentTime);
  const requestedEnd = requestedStart + Number(durationMinutes);
  const docStart = timeToMinutes(doctor.availableHoursStart || '09:00');
  const docEnd = timeToMinutes(doctor.availableHoursEnd || '17:00');

  if (requestedStart < docStart || requestedEnd > docEnd) {
    return {
      hasConflict: true,
      reason: 'OUTSIDE_WORKING_HOURS',
      message: `Appointment time (${appointmentTime} - ${minutesToTime(requestedEnd)}) is outside Dr. ${doctor.name}'s working hours (${doctor.availableHoursStart} - ${doctor.availableHoursEnd}).`,
    };
  }

  // 4. Check for overlapping appointments for the same doctor on the same date
  const targetDate = new Date(appointmentDate);
  const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      appointmentDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        notIn: ['CANCELLED', 'NO_SHOW'],
      },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: {
      id: true,
      patientName: true,
      appointmentTime: true,
      durationMinutes: true,
      status: true,
      reason: true,
    },
  });

  for (const existing of existingAppointments) {
    const isOverlapping = doTimesOverlap(
      appointmentTime,
      durationMinutes,
      existing.appointmentTime,
      existing.durationMinutes
    );

    if (isOverlapping) {
      const existEndMinutes = timeToMinutes(existing.appointmentTime) + (existing.durationMinutes || 30);
      return {
        hasConflict: true,
        reason: 'TIME_OVERLAP',
        message: `Time slot conflict: Dr. ${doctor.name} already has an appointment with ${existing.patientName} from ${existing.appointmentTime} to ${minutesToTime(existEndMinutes)} (${existing.status}).`,
        conflictingAppointment: existing,
      };
    }
  }

  return {
    hasConflict: false,
    doctor,
  };
};
