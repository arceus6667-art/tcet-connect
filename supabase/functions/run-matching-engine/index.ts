import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StudentInfo {
  user_id: string
  slot: number
  branch: string
  division: string
  roll_number: number
  exchange_status: string
}

interface TimeSlot {
  id: string
  date: string
  period: string
  start_time: string
  end_time: string
  location_id: string
  current_exchanges: number
  max_exchanges: number
}

interface SemesterInfo {
  semester: string
  academic_year: string
}

// Helper function to check if a date is a weekend
function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}

// Helper function to get next valid weekday
function getNextWeekday(date: Date): Date {
  const nextDate = new Date(date)
  while (isWeekend(nextDate)) {
    nextDate.setDate(nextDate.getDate() + 1)
  }
  return nextDate
}

// Helper function to get or create a valid time slot
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreateTimeSlot(
  supabase: SupabaseClient<any>,
  targetDate: Date
): Promise<TimeSlot | null> {
  const dateStr = targetDate.toISOString().split('T')[0]
  
  // First, try to find an existing time slot for this date with capacity
  const { data: existingSlots, error: fetchError } = await supabase
    .from('exchange_time_slots')
    .select('id, date, period, start_time, end_time, location_id, current_exchanges, max_exchanges')
    .eq('date', dateStr)
    .eq('is_active', true)
    .order('period', { ascending: true })
  
  if (fetchError) {
    console.error('Error fetching time slots:', fetchError)
    return null
  }

  // Find a slot with capacity
  if (existingSlots && existingSlots.length > 0) {
    const availableSlot = existingSlots.find(
      (slot: TimeSlot) => slot.current_exchanges < slot.max_exchanges
    )
    if (availableSlot) {
      return availableSlot as TimeSlot
    }
  }

  // Get default location (first active location)
  const { data: locations } = await supabase
    .from('exchange_locations')
    .select('id')
    .eq('is_active', true)
    .limit(1)
  
  const defaultLocationId = (locations && locations.length > 0) ? locations[0].id : null

  // Create time slots for the day if none exist
  // Morning: 9:30 AM - 12:30 PM, Afternoon: 12:30 PM - 3:30 PM, Evening: 3:30 PM - 6:30 PM
  const periods = [
    { period: 'morning', start_time: '09:30:00', end_time: '12:30:00' },
    { period: 'afternoon', start_time: '12:30:00', end_time: '15:30:00' },
    { period: 'evening', start_time: '15:30:00', end_time: '18:30:00' }
  ]

  for (const p of periods) {
    const { data: newSlot, error: insertError } = await supabase
      .from('exchange_time_slots')
      .insert({
        date: dateStr,
        period: p.period,
        start_time: p.start_time,
        end_time: p.end_time,
        location_id: defaultLocationId,
        current_exchanges: 0,
        max_exchanges: 10,
        is_active: true
      })
      .select()
      .single()
    
    if (!insertError && newSlot) {
      return newSlot as TimeSlot
    }
  }

  // Retry fetching after creation
  const { data: newSlots } = await supabase
    .from('exchange_time_slots')
    .select('id, date, period, start_time, end_time, location_id, current_exchanges, max_exchanges')
    .eq('date', dateStr)
    .eq('is_active', true)
    .order('period', { ascending: true })
  
  if (newSlots && newSlots.length > 0) {
    const availableSlot = newSlots.find(
      (slot: TimeSlot) => slot.current_exchanges < slot.max_exchanges
    )
    if (availableSlot) {
      return availableSlot as TimeSlot
    }
  }

  return null
}

// Get the next valid exchange date (today if before 6:30 PM on weekday, otherwise next weekday)
function getNextValidExchangeDate(): Date {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  // If it's after 6:30 PM or weekend, move to next valid day
  const isPastExchangeHours = currentHour > 18 || (currentHour === 18 && currentMinute >= 30)
  
  let targetDate = new Date(now)
  
  if (isPastExchangeHours || isWeekend(now)) {
    // Move to next day
    targetDate.setDate(targetDate.getDate() + 1)
    targetDate = getNextWeekday(targetDate)
  } else if (currentHour < 9 || (currentHour === 9 && currentMinute < 30)) {
    // If before 9:30 AM, use today if it's a weekday
    if (isWeekend(now)) {
      targetDate = getNextWeekday(targetDate)
    }
  } else {
    // During exchange hours, use today if weekday
    if (isWeekend(now)) {
      targetDate = getNextWeekday(targetDate)
    }
  }
  
  return targetDate
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Use service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current semester info
    const { data: semesterData, error: semesterError } = await supabase
      .rpc('get_current_semester')
    
    if (semesterError) throw semesterError
    
    const semesterInfo: SemesterInfo = semesterData[0]
    console.log('Current semester:', semesterInfo)

    // Get all pending students from Slot 1 who are not matched this semester
    const { data: slot1Students, error: slot1Error } = await supabase
      .from('student_academic_info')
      .select('user_id, slot, branch, division, roll_number, exchange_status')
      .eq('slot', 1)
      .eq('exchange_status', 'pending')

    if (slot1Error) throw slot1Error

    // Get all pending students from Slot 2 who are not matched this semester
    const { data: slot2Students, error: slot2Error } = await supabase
      .from('student_academic_info')
      .select('user_id, slot, branch, division, roll_number, exchange_status')
      .eq('slot', 2)
      .eq('exchange_status', 'pending')

    if (slot2Error) throw slot2Error

    console.log(`Found ${slot1Students?.length || 0} Slot 1 students and ${slot2Students?.length || 0} Slot 2 students`)

    // Filter out students who are already matched this semester
    const eligibleSlot1: StudentInfo[] = []
    const eligibleSlot2: StudentInfo[] = []

    for (const student of (slot1Students || []) as StudentInfo[]) {
      const { data: isMatched } = await supabase
        .rpc('is_student_matched_this_semester', { _user_id: student.user_id })
      
      if (!isMatched) {
        eligibleSlot1.push(student)
      }
    }

    for (const student of (slot2Students || []) as StudentInfo[]) {
      const { data: isMatched } = await supabase
        .rpc('is_student_matched_this_semester', { _user_id: student.user_id })
      
      if (!isMatched) {
        eligibleSlot2.push(student)
      }
    }

    console.log(`Eligible: ${eligibleSlot1.length} Slot 1, ${eligibleSlot2.length} Slot 2`)

    // Get the next valid exchange date (weekday only, within allowed hours)
    const nextExchangeDate = getNextValidExchangeDate()
    console.log(`Next valid exchange date: ${nextExchangeDate.toISOString().split('T')[0]}`)

    // Match students
    const matches: Array<{
      student_1_id: string
      student_2_id: string
      time_slot_id: string
      location_id: string
      semester: string
      academic_year: string
    }> = []

    const matchedSlot1Ids = new Set<string>()
    const matchedSlot2Ids = new Set<string>()
    
    // Track current date for slot allocation
    let currentDate = new Date(nextExchangeDate)

    for (const slot1Student of eligibleSlot1) {
      if (matchedSlot1Ids.has(slot1Student.user_id)) continue

      // Find an unmatched Slot 2 student (preferably from same branch/division for convenience)
      let bestMatch: StudentInfo | null = null
      
      // First try to find someone from same branch and division
      for (const slot2Student of eligibleSlot2) {
        if (matchedSlot2Ids.has(slot2Student.user_id)) continue
        
        if (slot2Student.branch === slot1Student.branch && 
            slot2Student.division === slot1Student.division) {
          bestMatch = slot2Student
          break
        }
      }
      
      // If no match found, try same branch only
      if (!bestMatch) {
        for (const slot2Student of eligibleSlot2) {
          if (matchedSlot2Ids.has(slot2Student.user_id)) continue
          
          if (slot2Student.branch === slot1Student.branch) {
            bestMatch = slot2Student
            break
          }
        }
      }
      
      // If still no match, take any available Slot 2 student
      if (!bestMatch) {
        for (const slot2Student of eligibleSlot2) {
          if (matchedSlot2Ids.has(slot2Student.user_id)) continue
          bestMatch = slot2Student
          break
        }
      }

      if (bestMatch) {
        // Get or create a time slot for the current date
        let timeSlot = await getOrCreateTimeSlot(supabase, currentDate)
        
        // If no slot available for current date, try next weekday
        if (!timeSlot) {
          currentDate.setDate(currentDate.getDate() + 1)
          currentDate = getNextWeekday(currentDate)
          timeSlot = await getOrCreateTimeSlot(supabase, currentDate)
        }

        if (!timeSlot) {
          console.log('No available time slots, stopping matching')
          break
        }
        
        matches.push({
          student_1_id: slot1Student.user_id,
          student_2_id: bestMatch.user_id,
          time_slot_id: timeSlot.id,
          location_id: timeSlot.location_id,
          semester: semesterInfo.semester,
          academic_year: semesterInfo.academic_year
        })

        matchedSlot1Ids.add(slot1Student.user_id)
        matchedSlot2Ids.add(bestMatch.user_id)

        // Update slot capacity
        timeSlot.current_exchanges++
        
        // If slot is full, it will be skipped in next getOrCreateTimeSlot call
      }
    }

    console.log(`Created ${matches.length} matches`)

    // Insert matches into database
    if (matches.length > 0) {
      const { error: insertError } = await supabase
        .from('exchange_matches')
        .insert(matches)

      if (insertError) throw insertError

      // Update student exchange statuses to 'matched'
      const allMatchedStudentIds = [...matchedSlot1Ids, ...matchedSlot2Ids]
      
      const { error: updateError } = await supabase
        .from('student_academic_info')
        .update({ exchange_status: 'matched' })
        .in('user_id', allMatchedStudentIds)

      if (updateError) throw updateError

      // Update time slot current_exchanges counts
      const slotUpdates = new Map<string, number>()
      for (const match of matches) {
        const current = slotUpdates.get(match.time_slot_id) || 0
        slotUpdates.set(match.time_slot_id, current + 1)
      }

      for (const [slotId, count] of slotUpdates) {
        // Get current count first
        const { data: slotData } = await supabase
          .from('exchange_time_slots')
          .select('current_exchanges')
          .eq('id', slotId)
          .single()
        
        if (slotData) {
          await supabase
            .from('exchange_time_slots')
            .update({ current_exchanges: ((slotData as { current_exchanges: number }).current_exchanges || 0) + count })
            .eq('id', slotId)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully matched ${matches.length} pairs`,
        matches_created: matches.length,
        semester: semesterInfo.semester,
        academic_year: semesterInfo.academic_year,
        exchange_date: nextExchangeDate.toISOString().split('T')[0]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Matching engine error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
