import React from 'react';
import Reflux from 'reflux';
import Router from 'react-router';
import _ from 'lodash';
import {Modal, Input} from 'react-bootstrap';
import {ProjectActions, SprintActions, TaskFormActions} from '../../actions/actions';
import TaskFormStore from '../../stores/taskFormStore';

let TaskForm = React.createClass({
  mixins: [Reflux.ListenerMixin, Router.State],

  propTypes: {
    project: React.PropTypes.number.isRequired,
    users: React.PropTypes.array.isRequired,
    sprint: React.PropTypes.number // defaults to null
  },

  getInitialState() {
    return this.newTaskFormState;
  },

  componentDidMount() {
    this.listenTo(TaskFormStore, this.onStoreUpdate);
  },

  onStoreUpdate(params) {
    if (params.response && !params.response.error) {
      this.closeAndUpdate();
    }
    if (params.action === 'create') {
      let newState = Object.create(this.newTaskFormState);
      newState.show = true;
      this.setState(newState);
    }
    if (params.action === 'edit') {
      let taskProperties = {
        id: params.id,
        name: params.name,
        description: params.description || '',
        score: params.score || 1,
        sprintId: params.sprintId,
        userId: params.userId
      };
      this.setState({show: true, isNewTask: false, taskProperties: taskProperties});
    }
  },

  newTaskFormState: {
    disableCreate: true,
    show: false,
    isNewTask: true,
    taskProperties: {
      name: '',
      description: '',
      score: 1,
      userId: null
    }
  },

  createTask() {
    let taskProperties = _.extend({sprintId: this.props.sprint}, this.state.taskProperties);
    TaskFormActions.saveTask(this.props.project, taskProperties);
  },

  updateTask() {
    let projectId = this.props.project;
    let taskId = this.state.taskProperties.id;
    let taskProperties = _.chain(this.state.taskProperties)
      .extend({sprintId: this.props.sprint})
      .pick('name', 'score', 'description', 'userId', 'sprintId')
      .value();
    TaskFormActions.updateTask({
      projectId: projectId,
      taskId: taskId,
      taskProperties: taskProperties
    });
  },

  handleChanges(e) {
    let newProperties = _.extend({}, this.state.taskProperties);
    newProperties.name = React.findDOMNode(this.refs.taskName).value;
    newProperties.description = React.findDOMNode(this.refs.taskDescription).value;
    newProperties.userId = parseInt(this.refs.taskAssignment.getValue()) || null;
    newProperties.score = Math.min(999, Math.max(1, React.findDOMNode(this.refs.taskScore).value));

    this.setState({
      taskProperties: newProperties,
      disableCreate: !(newProperties.name && newProperties.score)
    });
  },

  close() {
    this.setState(this.newTaskFormState);
  },

  closeAndUpdate() {
    this.setState(this.newTaskFormState);
    // if this task form was opened in the project view, refresh the project view
    // if this task form was opened in the sprintboard view, refresh the sprint view
    if (this.isActive('project')) {
      ProjectActions.fetchProject(this.props.project);
    } else if (this.isActive('sprint')) {
      SprintActions.fetchSprint(this.props.project);
    }
  },

  render() {

    return (
      <Modal show={this.state.show} onHide={this.close} bsSize='sm'>
        <Modal.Header closeButton>
          <Modal.Title>Create a New Task</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form className='create-task'>
            <input
              type='text'
              className='name'
              ref='taskName'
              placeholder='Title'
              onChange={this.handleChanges}
              value={this.state.taskProperties.name}
            />

            <textarea
              className='description'
              ref='taskDescription'
              placeholder='Enter task description'
              onChange={this.handleChanges}
              value={this.state.taskProperties.description}
            >
            </textarea>

            <div className='assignment'>
              <Input
                type='select'
                ref='taskAssignment'
                onChange={this.handleChanges}
                value={this.state.taskProperties.userId}
                label='Assign to:'
              >
                <option value=''>None</option>
                {
                  this.props.users.map((user) => {
                    return <option key={user.id} value={user.id}>{user.username}</option>;
                  })
                }
              </Input>
            </div>

            <div className='score'>
              <label>Score:</label>
              <input
                type='number'
                className='score'
                ref='taskScore'
                min='1'
                onChange={this.handleChanges}
                value={this.state.taskProperties.score}
              />
            </div>
          </form>
        </Modal.Body>

        <Modal.Footer>
          <button
            className='btn block primary'
            disabled={this.state.disableCreate}
            onClick={this.state.isNewTask ?  this.createTask : this.updateTask}
          >
            {this.state.isNewTask ? 'Create task' : 'Update task'}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
});

export default TaskForm;