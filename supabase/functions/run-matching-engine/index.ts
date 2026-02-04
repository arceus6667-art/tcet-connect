import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Get available time slots (future dates with capacity)
    const { data: timeSlots, error: timeSlotError } = await supabase
      .from('exchange_time_slots')
      .select('id, date, period, start_time, end_time, location_id, current_exchanges, max_exchanges')
      .gte('date', new Date().toISOString().split('T')[0])
      .eq('is_active', true)
      .order('date', { ascending: true })
      .order('period', { ascending: true })

    if (timeSlotError) throw timeSlotError

    const availableSlots = (timeSlots || []).filter(
      (slot: TimeSlot) => slot.current_exchanges < slot.max_exchanges
    )

    console.log(`Available time slots: ${availableSlots.length}`)

    if (availableSlots.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No available time slots for matching',
          matches_created: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Match students - simple first-come-first-serve matching
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
    let slotIndex = 0

    for (const slot1Student of eligibleSlot1) {
      if (matchedSlot1Ids.has(slot1Student.user_id)) continue
      if (slotIndex >= availableSlots.length) break

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
        const currentSlot = availableSlots[slotIndex]
        
        matches.push({
          student_1_id: slot1Student.user_id,
          student_2_id: bestMatch.user_id,
          time_slot_id: currentSlot.id,
          location_id: currentSlot.location_id,
          semester: semesterInfo.semester,
          academic_year: semesterInfo.academic_year
        })

        matchedSlot1Ids.add(slot1Student.user_id)
        matchedSlot2Ids.add(bestMatch.user_id)

        // Move to next slot if current one is getting full
        availableSlots[slotIndex].current_exchanges++
        if (availableSlots[slotIndex].current_exchanges >= availableSlots[slotIndex].max_exchanges) {
          slotIndex++
        }
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

      // Update time slot current_exchanges count
      for (const slot of availableSlots) {
        if (slot.current_exchanges > 0) {
          await supabase
            .from('exchange_time_slots')
            .update({ current_exchanges: slot.current_exchanges })
            .eq('id', slot.id)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully matched ${matches.length} pairs`,
        matches_created: matches.length,
        semester: semesterInfo.semester,
        academic_year: semesterInfo.academic_year
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