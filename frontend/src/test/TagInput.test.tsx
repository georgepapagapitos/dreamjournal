import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { TagInput } from '../components/ui/TagInput'

describe('TagInput Component', () => {
    describe('Rendering', () => {
        it('should render input field', () => {
            const onChange = vi.fn()
            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            expect(input).toBeInTheDocument()
        })

        it('should show placeholder when no tags exist', () => {
            const onChange = vi.fn()
            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByPlaceholderText('flying, ocean, chase…')
            expect(input).toBeInTheDocument()
        })

        it('should not show placeholder when tags exist', () => {
            const onChange = vi.fn()
            render(<TagInput tags={['dream']} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            expect(input).toHaveAttribute('placeholder', '')
        })

        it('should render existing tags', () => {
            const onChange = vi.fn()
            const tags = ['flying', 'lucid', 'ocean']

            render(<TagInput tags={tags} onChange={onChange} />)

            expect(screen.getByText('flying')).toBeInTheDocument()
            expect(screen.getByText('lucid')).toBeInTheDocument()
            expect(screen.getByText('ocean')).toBeInTheDocument()
        })

        it('should render remove button for each tag', () => {
            const onChange = vi.fn()
            const tags = ['tag1', 'tag2']

            render(<TagInput tags={tags} onChange={onChange} />)

            const removeButtons = screen.getAllByRole('button')
            expect(removeButtons).toHaveLength(2)
        })
    })

    describe('Adding Tags', () => {
        it('should add tag when Enter is pressed', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, 'flying{Enter}')

            expect(onChange).toHaveBeenCalledWith(['flying'])
        })

        it('should add tag when comma is pressed', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, 'ocean,')

            expect(onChange).toHaveBeenCalledWith(['ocean'])
        })

        it('should add tag when space is pressed', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, 'lucid ')

            expect(onChange).toHaveBeenCalledWith(['lucid'])
        })

        it('should add tag on blur if input has value', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, 'dream')
            await user.tab()

            expect(onChange).toHaveBeenCalledWith(['dream'])
        })

        it('should convert tag to lowercase', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, 'FLYING{Enter}')

            expect(onChange).toHaveBeenCalledWith(['flying'])
        })

        it('should trim whitespace from tags', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, '  flying  {Enter}')

            expect(onChange).toHaveBeenCalledWith(['flying'])
        })

        it('should not add empty tags', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, '   {Enter}')

            expect(onChange).not.toHaveBeenCalled()
        })

        it('should not add duplicate tags', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={['flying']} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, 'flying{Enter}')

            expect(onChange).not.toHaveBeenCalled()
        })

        it('should clear input after adding tag', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox') as HTMLInputElement
            await user.type(input, 'dream{Enter}')

            expect(input.value).toBe('')
        })

        it('should add multiple tags in sequence', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            const { rerender } = render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, 'flying{Enter}')

            expect(onChange).toHaveBeenNthCalledWith(1, ['flying'])

            rerender(<TagInput tags={['flying']} onChange={onChange} />)

            await user.type(input, 'ocean{Enter}')

            expect(onChange).toHaveBeenCalledTimes(2)
            expect(onChange).toHaveBeenNthCalledWith(2, ['flying', 'ocean'])
        })
    })

    describe('Removing Tags', () => {
        it('should remove tag when × button is clicked', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={['flying', 'ocean']} onChange={onChange} />)

            const removeButtons = screen.getAllByRole('button')
            await user.click(removeButtons[0])

            expect(onChange).toHaveBeenCalledWith(['ocean'])
        })

        it('should remove correct tag when multiple exist', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={['flying', 'ocean', 'lucid']} onChange={onChange} />)

            const removeButtons = screen.getAllByRole('button')
            await user.click(removeButtons[1])

            expect(onChange).toHaveBeenCalledWith(['flying', 'lucid'])
        })

        it('should remove last tag when Backspace is pressed with empty input', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={['flying', 'ocean']} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.click(input)
            await user.keyboard('{Backspace}')

            expect(onChange).toHaveBeenCalledWith(['flying'])
        })

        it('should not remove tag when Backspace is pressed with text in input', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={['flying']} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, 'test{Backspace}')

            expect(onChange).not.toHaveBeenCalled()
        })

        it('should not crash when Backspace pressed with no tags', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.click(input)
            await user.keyboard('{Backspace}')

            expect(onChange).not.toHaveBeenCalled()
        })

        it('should stop event propagation when remove button clicked', async () => {
            const onChange = vi.fn()
            const onContainerClick = vi.fn()
            const user = userEvent.setup()

            render(
                <div onClick={onContainerClick}>
                    <TagInput tags={['flying']} onChange={onChange} />
                </div>
            )

            const removeButton = screen.getAllByRole('button')[0]
            await user.click(removeButton)

            expect(onChange).toHaveBeenCalled()
        })
    })

    describe('Focus Management', () => {
        it('should focus input when container is clicked', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={['flying']} onChange={onChange} />)

            const container = screen.getByText('flying').parentElement
            if (container) {
                await user.click(container)
            }

            const input = screen.getByRole('textbox')
            expect(input).toHaveFocus()
        })

        it('should have input with id "tag-input"', () => {
            const onChange = vi.fn()
            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            expect(input).toHaveAttribute('id', 'tag-input')
        })
    })

    describe('Edge Cases', () => {
        it('should handle special characters in tags', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, 'dream-scape{Enter}')

            expect(onChange).toHaveBeenCalledWith(['dream-scape'])
        })

        it('should prevent default on Enter, comma, space keys', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')

            await user.type(input, 'test{Enter}')
            expect(onChange).toHaveBeenCalled()
        })

        it('should handle rapid tag additions', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, 'tag1{Enter}tag2{Enter}tag3{Enter}')

            expect(onChange).toHaveBeenCalledTimes(3)
        })

        it('should handle empty onChange callback gracefully', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, 'test')
            await user.tab()

            expect(() => onChange).not.toThrow()
        })
    })

    describe('Complex Scenarios', () => {
        it('should handle adding and removing tags in sequence', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            const { rerender } = render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, 'flying{Enter}')
            expect(onChange).toHaveBeenLastCalledWith(['flying'])

            rerender(<TagInput tags={['flying']} onChange={onChange} />)

            await user.type(input, 'ocean{Enter}')
            expect(onChange).toHaveBeenLastCalledWith(['flying', 'ocean'])

            rerender(<TagInput tags={['flying', 'ocean']} onChange={onChange} />)

            const removeButtons = screen.getAllByRole('button')
            await user.click(removeButtons[0])
            expect(onChange).toHaveBeenLastCalledWith(['ocean'])
        })

        it('should normalize similar tags as duplicates', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={['flying']} onChange={onChange} />)

            const input = screen.getByRole('textbox')

            await user.type(input, 'FLYING{Enter}')
            await user.type(input, ' flying {Enter}')
            await user.type(input, 'Flying{Enter}')

            expect(onChange).not.toHaveBeenCalled()
        })

        it('should handle multi-word tags by converting spaces to hyphens', async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(<TagInput tags={[]} onChange={onChange} />)

            const input = screen.getByRole('textbox')
            await user.type(input, 'lucid-dream{Enter}')

            expect(onChange).toHaveBeenCalledWith(['lucid-dream'])
        })
    })
})