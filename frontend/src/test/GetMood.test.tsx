import { describe, it, expect } from 'vitest'
import { getMood, MOODS } from '../components/ui/MoodPicker'

describe('getMood utility', () => {
    it('should return mood object for valid mood string', () => {
        const mood = getMood('peaceful')

        expect(mood).toBeDefined()
        expect(mood?.label).toBe('Peaceful')
        expect(mood?.emoji).toBe('🌙')
    })

    it('should return undefined for invalid mood string', () => {
        const mood = getMood('invalid-mood')

        expect(mood).toBeUndefined()
    })

    it('should return undefined for null', () => {
        const mood = getMood(null)

        expect(mood).toBeUndefined()
    })

    it('should handle all valid moods', () => {
        const validMoods = ['peaceful', 'joyful', 'anxious', 'eerie', 'vivid', 'neutral']

        validMoods.forEach(moodId => {
            const mood = getMood(moodId)
            expect(mood).toBeDefined()
            expect(mood?.emoji).toBeDefined()
            expect(mood?.label).toBeDefined()
            expect(mood?.id).toBe(moodId)
        })
    })

    it('should match MOODS constant length', () => {
        expect(MOODS).toHaveLength(6)
    })
})