import { supabase } from '@/lib/supabase'

export const storageApi = {
  // Upload voice note
  async uploadVoiceNote(file: File, metadata: {
    school_id: string
    teacher_id?: string
    student_id: string
    highlight_id: string
  }): Promise<string> {
    const timestamp = Date.now()
    const fileName = `${metadata.school_id}/${metadata.teacher_id || 'student'}/${metadata.student_id}/${metadata.highlight_id}/${timestamp}.webm`

    const { data, error } = await supabase.storage
      .from('voice-notes')
      .upload(fileName, file, {
        contentType: 'audio/webm',
        cacheControl: '3600'
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('voice-notes')
      .getPublicUrl(fileName)

    return publicUrl
  },

  // Delete voice note (within 5 minutes of creation)
  async deleteVoiceNote(url: string): Promise<void> {
    const path = url.split('/voice-notes/')[1]
    if (!path) throw new Error('Invalid voice note URL')

    const { error } = await supabase.storage
      .from('voice-notes')
      .remove([path])

    if (error) throw error
  },

  // Upload avatar
  async uploadAvatar(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar.${fileExt}`

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,
        cacheControl: '3600'
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Update profile
    const { error: updateError } = await (supabase
      .from('user_profiles') as any)
      .update({ avatar_url: publicUrl })
      .eq('user_id', userId)

    if (updateError) throw updateError

    return publicUrl
  },

  // Upload school logo
  async uploadSchoolLogo(file: File, schoolId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${schoolId}/logo.${fileExt}`

    const { data, error } = await supabase.storage
      .from('school-logos')
      .upload(fileName, file, {
        upsert: true,
        cacheControl: '3600'
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('school-logos')
      .getPublicUrl(fileName)

    // Update school
    const { error: updateError } = await (supabase
      .from('schools') as any)
      .update({ logo_url: publicUrl })
      .eq('id', schoolId)

    if (updateError) throw updateError

    return publicUrl
  },

  // Upload attachment
  async uploadAttachment(file: File, metadata: {
    school_id: string
    message_id?: string
  }): Promise<string> {
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${metadata.school_id}/${metadata.message_id || 'general'}/${timestamp}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(fileName, file, {
        cacheControl: '3600'
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(fileName)

    return publicUrl
  },

  // Get storage usage
  async getStorageUsage(bucketName: string): Promise<{
    totalSize: number
    fileCount: number
  }> {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        offset: 0
      })

    if (error) throw error

    const totalSize = data?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0
    const fileCount = data?.length || 0

    return {
      totalSize,
      fileCount
    }
  }
}