// Component for creating new tasks and submitting them to the API
import React, { useState } from 'react';

const TaskCreator = ({ onTaskCreated }) => {
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('bug');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!goal.trim()) {
      setMessage({ type: 'error', text: 'Goal is required' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/v1/arq/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          description,
          taskType,
          tags: tags.split(',').map(t => t.trim()).filter(t => t)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `Task created: ${data.taskId}` });
        setGoal('');
        setDescription('');
        setTaskType('bug');
        setTags('');
        if (onTaskCreated) onTaskCreated(data);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create task' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-creator">
      <h3>Create New Task</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="goalField">Development Goal</label>
          <input
            id="goalField"
            type="text"
            placeholder="Enter a clear, measurable goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="descField">Description</label>
          <textarea
            id="descField"
            placeholder="Provide additional context"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="taskType">Task Type</label>
          <select
            id="taskType"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
          >
            <option value="bug">🐛 Bug</option>
            <option value="feature">✨ Feature</option>
            <option value="refactor">♻️ Refactor</option>
            <option value="research">🔬 Research</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="tagsInput">Tags</label>
          <input
            id="tagsInput"
            type="text"
            placeholder="Type tags separated by commas"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </form>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default TaskCreator;
