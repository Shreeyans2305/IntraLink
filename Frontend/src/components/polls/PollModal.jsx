import { useState } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

function PollModal({ open, onClose, onCreate, roomId }) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['Yes', 'No'])
  const [anonymous, setAnonymous] = useState(false)
  const [closeAt, setCloseAt] = useState('')

  const handleOptionChange = (index, nextValue) => {
    setOptions((current) => current.map((item, optionIndex) => (optionIndex === index ? nextValue : item)))
  }

  const handleCreate = () => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion) {
      return
    }

    const preparedOptions = options.map((option) => option.trim()).filter(Boolean)
    if (preparedOptions.length < 2) {
      return
    }

    onCreate({
      question: trimmedQuestion,
      roomId,
      anonymous,
      closeAt: closeAt || null,
      options: preparedOptions.map((option, index) => ({
        id: `opt-${Date.now()}-${index}`,
        label: option,
        votes: 0,
      })),
    })

    setQuestion('')
    setOptions(['Yes', 'No'])
    setAnonymous(false)
    setCloseAt('')
    onClose()
  }

  return (
    <Modal open={open} title="Create Poll" onClose={onClose}>
      <div className="space-y-3">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Question"
          className="w-full rounded-md border border-zinc-700 px-2 py-2 text-sm"
        />
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={`${option}-${index}`} className="flex gap-2">
              <input
                value={option}
                onChange={(event) => handleOptionChange(index, event.target.value)}
                placeholder={`Option ${index + 1}`}
                className="w-full rounded-md border border-zinc-700 px-2 py-2 text-sm"
              />
              {options.length > 2 ? (
                <Button
                  variant="ghost"
                  className="px-2"
                  onClick={() => setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          ))}
          <Button variant="secondary" onClick={() => setOptions((current) => [...current, ''])}>
            Add Option
          </Button>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
          Anonymous poll
        </label>

        <label className="block text-sm text-zinc-300">
          Close date/time
          <input
            type="datetime-local"
            value={closeAt}
            onChange={(event) => setCloseAt(event.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-700 px-2 py-2 text-sm"
          />
        </label>

        <Button onClick={handleCreate}>Create Poll</Button>
      </div>
    </Modal>
  )
}

export default PollModal