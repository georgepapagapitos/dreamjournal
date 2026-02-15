import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { RatingPicker } from '../components/ui/RatingPicker'

describe('RatingPicker Component', () => {
    describe('Rendering', () => {
        it('should render 5 rating buttons', () => {
            const onChange = vi.fn()
            render(<RatingPicker value={null} onChange={onChange} />)

            const buttons = screen.getAllByRole('button')
            expect(buttons).toHaveLength(5)
        })

        it('should render numeric labels by default', () => {
            const onChange = vi.fn()
            render(<RatingPicker value={null} onChange={onChange} />)

            expect(screen.getByText('1')).toBeInTheDocument()
            expect(screen.getByText('2')).toBeInTheDocument()
            expect(screen.getByText('3')).toBeInTheDocument()
            expect(screen.getByText('4')).toBeInTheDocument()
            expect(screen.getByText('5')).toBeInTheDocument()
        })

        it('should render custom labels when provided', () => {
            const onChange = vi.fn()
            const labels = ['Very Low', 'Low', 'Medium', 'High', 'Very High']

            render(<RatingPicker value={null} onChange={onChange} labels={labels} />)

            expect(screen.getByText('Very Low')).toBeInTheDocument()
            expect(screen.getByText('Low')).toBeInTheDocument()
            expect(screen.getByText('Medium')).toBeInTheDocument()
            expect(screen.getByText('High')).toBeInTheDocument()
            expect(screen.getByText('Very High')).toBeInTheDocument()
        })

        it('should set title attribute when labels provided', () => {
            const onChange = vi.fn()
            const labels = ['Poor', 'Fair', 'Good', 'Great', 'Excellent']

            render(<RatingPicker value={null} onChange={onChange} labels={labels} />)

            const buttons = screen.getAllByRole('button')
            expect(buttons[0]).toHaveAttribute('title', 'Poor')
            expect(buttons[4]).toHaveAttribute('title', 'Excellent')
        })
    })

    describe('Selection', () => {
        it('should highlight selected rating', () => {
            const onChange = vi.fn()
            render(<RatingPicker value={3} onChange={onChange} />)

            const selectedButton = screen.getByText('3')
            expect(selectedButton).toHaveClass('active')
        })

        it('should not highlight unselected ratings', () => {
            const onChange = vi.fn()
            render(<RatingPicker value={3} onChange={onChange} />)

            const unselectedButton = screen.getByText('1')
            expect(unselectedButton).not.toHaveClass('active')
        })

        it('should not highlight any rating when value is null', () => {
            const onChange = vi.fn()
            render(<RatingPicker value={null} onChange={onChange} />)

            const buttons = screen.getAllByRole('button')
            buttons.forEach(button => {
                expect(button).not.toHaveClass('active')
            })
        })
    })

    describe('User Interactions', () => {
        it('should call onChange with rating number when clicked', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<RatingPicker value={null} onChange={onChange} />)

            const button3 = screen.getByText('3')
            await user.click(button3)

            expect(onChange).toHaveBeenCalledWith(3)
            expect(onChange).toHaveBeenCalledTimes(1)
        })

        it('should call onChange with null when clicking selected rating (deselect)', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<RatingPicker value={3} onChange={onChange} />)

            const button3 = screen.getByText('3')
            await user.click(button3)

            expect(onChange).toHaveBeenCalledWith(null)
            expect(onChange).toHaveBeenCalledTimes(1)
        })

        it('should allow changing selection from one rating to another', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<RatingPicker value={2} onChange={onChange} />)

            const button5 = screen.getByText('5')
            await user.click(button5)

            expect(onChange).toHaveBeenCalledWith(5)
        })

        it('should work with custom labels', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()
            const labels = ['None', 'Slight', 'Moderate', 'Strong', 'Intense']

            render(<RatingPicker value={null} onChange={onChange} labels={labels} />)

            const moderateButton = screen.getByText('Moderate')
            await user.click(moderateButton)

            expect(onChange).toHaveBeenCalledWith(3)
        })
    })

    describe('Edge Cases', () => {
        it('should handle rapid clicks', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<RatingPicker value={null} onChange={onChange} />)

            const button1 = screen.getByText('1')
            const button5 = screen.getByText('5')

            await user.click(button1)
            await user.click(button5)
            await user.click(button1)

            expect(onChange).toHaveBeenCalledTimes(3)
            expect(onChange).toHaveBeenNthCalledWith(1, 1)
            expect(onChange).toHaveBeenNthCalledWith(2, 5)
            expect(onChange).toHaveBeenNthCalledWith(3, 1)
        })

        it('should handle all rating values 1-5', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<RatingPicker value={null} onChange={onChange} />)

            for (let i = 1; i <= 5; i++) {
                const button = screen.getByText(i.toString())
                await user.click(button)
                expect(onChange).toHaveBeenCalledWith(i)
            }

            expect(onChange).toHaveBeenCalledTimes(5)
        })

        it('should handle partial labels array gracefully', () => {
            const onChange = vi.fn()
            const labels = ['Low', 'High'] // Only 2 labels for 5 buttons

            // Should not crash
            render(<RatingPicker value={null} onChange={onChange} labels={labels} />)

            expect(screen.getByText('Low')).toBeInTheDocument()
            expect(screen.getByText('High')).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        it('should render buttons with type="button"', () => {
            const onChange = vi.fn()
            render(<RatingPicker value={null} onChange={onChange} />)

            const buttons = screen.getAllByRole('button')
            buttons.forEach(button => {
                expect(button).toHaveAttribute('type', 'button')
            })
        })

        it('should be keyboard navigable', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<RatingPicker value={null} onChange={onChange} />)

            // Tab to first button and press Enter
            await user.tab()
            await user.keyboard('{Enter}')

            expect(onChange).toHaveBeenCalled()
        })
    })
})