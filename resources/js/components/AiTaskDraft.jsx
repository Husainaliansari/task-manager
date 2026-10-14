import { useState } from 'react';
import { assistantApi } from '../api';
import { SparklesIcon } from './icons';

const EXAMPLES = [
  'Send the Q3 invoice to Acme by Friday, they are waiting on it',
  'Someday: read that book on system design Rahul recommended',
  'Call the electrician tomorrow about the kitchen lights',
];

/**
 * Task 7: "describe it and I'll fill in the form".
 * The suggestion opens in the normal task form, so the user always reviews it
 * before anything is saved.
 */
export default function AiTaskDraft({ onDraft }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [thinking, setThinking] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (text.trim().length < 3) {
      setError('Write a few words about the task first.');
      return;
    }

    setThinking(true);
    setError('');
    try {
      const { data } = await assistantApi.suggest(text.trim());
      const { reason, ...draft } = data;
      onDraft({ ...draft, status: 'todo' }, reason);
      setText('');
    } catch (err) {
      setError(err.fieldErrors?.text ?? err.message);
    } finally {
      setThinking(false);
    }
  }

  return (
    <form className="ai-draft" onSubmit={handleSubmit}>
      <div className="ai-draft__head">
        <span className="ai-draft__icon" aria-hidden="true">
          <SparklesIcon size={18} />
        </span>
        <div>
          <label htmlFor="ai-text" className="ai-draft__label">
            Describe a task in your own words
          </label>
          <p className="ai-draft__sub">The assistant fills in the form, and you check it before anything is saved.</p>
        </div>
      </div>
      <div className="ai-draft__row">
        <input
          id="ai-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={`e.g. "${EXAMPLES[0]}"`}
          maxLength={1000}
          disabled={thinking}
        />
        <button type="submit" className="btn btn--accent" disabled={thinking}>
          <SparklesIcon size={16} />
          {thinking ? 'Drafting…' : 'Draft it for me'}
        </button>
      </div>
      {error ? (
        <p className="field__error">{error}</p>
      ) : (
        <div className="ai-draft__examples">
          <span className="muted">Try:</span>
          {EXAMPLES.slice(1).map((example) => (
            <button key={example} type="button" className="example-chip" onClick={() => setText(example)}>
              {example}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
