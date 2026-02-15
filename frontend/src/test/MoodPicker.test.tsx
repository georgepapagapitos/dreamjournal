import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MoodPicker } from '../components/ui/MoodPicker'

describe('MoodPicker Component', () => {
    it('should render all mood options', () => {
        const onChange = vi.fn()
        render(<MoodPicker value={null} onChange={onChange} />)

        expect(screen.getByText('Peaceful')).toBeInTheDocument()
        expect(screen.getByText('Joyful')).toBeInTheDocument()
        expect(screen.getByText('Anxious')).toBeInTheDocument()
        expect(screen.getByText('Eerie')).toBeInTheDocument()
        expect(screen.getByText('Vivid')).toBeInTheDocument()
        expect(screen.getByText('Neutral')).toBeInTheDocument()
    })

    it('should call onChange when mood is selected', async () => {
        const onChange = vi.fn()
        const user = userEvent.setup()

        render(<MoodPicker value={null} onChange={onChange} />)

        const peacefulButton = screen.getByText('Peaceful').closest('button')
        expect(peacefulButton).toBeInTheDocument()

        if (peacefulButton) {
            await user.click(peacefulButton)
            expect(onChange).toHaveBeenCalledWith('peaceful')
        }
    })

    it('should highlight selected mood', () => {
        const onChange = vi.fn()
        render(<MoodPicker value="peaceful" onChange={onChange} />)

        const peacefulButton = screen.getByText('Peaceful').closest('button')
        expect(peacefulButton).toHaveClass('active')
    })

    it('should not highlight unselected moods', () => {
        const onChange = vi.fn()
        render(<MoodPicker value="peaceful" onChange={onChange} />)

        const joyfulButton = screen.getByText('Joyful').closest('button')
        expect(joyfulButton).not.toHaveClass('active')
    })

    it('should allow deselecting mood by clicking again', async () => {
        const onChange = vi.fn()
        const user = userEvent.setup()

        render(<MoodPicker value="peaceful" onChange={onChange} />)

        const peacefulButton = screen.getByText('Peaceful').closest('button')
        if (peacefulButton) {
            await user.click(peacefulButton)
            expect(onChange).toHaveBeenCalledWith(null)
        }
    })

    it('should render correct emoji for each mood', () => {
        const onChange = vi.fn()
        render(<MoodPicker value={null} onChange={onChange} />)

        expect(screen.getByText('🌙')).toBeInTheDocument()
        expect(screen.getByText('✨')).toBeInTheDocument()
        expect(screen.getByText('🌀')).toBeInTheDocument()
        expect(screen.getByText('🌫️')).toBeInTheDocument()
        expect(screen.getByText('🔮')).toBeInTheDocument()
        expect(screen.getByText('🌑')).toBeInTheDocument()
    })
})
