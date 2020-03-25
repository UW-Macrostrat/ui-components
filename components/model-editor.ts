/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component, createContext, useContext} from 'react';
import h from 'react-hyperscript';
import {DateInput} from '@blueprintjs/datetime';
import {EditableText} from '@blueprintjs/core';
import {EditButton, DeleteButton} from './buttons';
import {StatefulComponent} from './util';
import classNames from 'classnames';
import update from 'immutability-helper';
import T from 'prop-types';

import '@blueprintjs/datetime/lib/css/blueprint-datetime.css';

const ModelEditorContext = createContext({});

class ModelEditButton extends Component {
  static initClass() {
    this.contextType = ModelEditorContext;
  }
  render() {
    const {isEditing, actions} = this.context;
    return h(EditButton, {
      isEditing,
      onClick: actions.toggleEditing,
      ...this.props
    });
  }
}
ModelEditButton.initClass();

class ModelEditor extends StatefulComponent {
  static initClass() {
    this.defaultProps = {
      canEdit: true
    };
    this.propTypes = {
      model: T.object.isRequired,
      persistChanges: T.func
    };
  }
  constructor(props){
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) { super(); }
      let thisFn = (() => { return this; }).toString();
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      eval(`${thisName} = this;`);
    }
    this.getValue = this.getValue.bind(this);
    this.hasChanges = this.hasChanges.bind(this);
    this.onChange = this.onChange.bind(this);
    this.toggleEditing = this.toggleEditing.bind(this);
    this.onPersistChanges = this.onPersistChanges.bind(this);
    super(props);
    this.state = {
      isEditing: props.isEditing || false,
      isPersisting: null,
      error: null,
      model: props.model,
      initialModel: props.model
    };
  }

  render() {
    const {model} = this.state;
    const {canEdit} = this.props;
    const isEditing = this.state.isEditing && canEdit;
    const actions = (() => { let onChange, persistChanges, toggleEditing, updateState;
    return ({onChange, toggleEditing, updateState, persistChanges} = this); })();
    const value = {actions, model, isEditing, canEdit, hasChanges: this.hasChanges};
    return h(ModelEditorContext.Provider, {value}, this.props.children);
  }

  getValue(field){ return this.state.model[field]; }

  hasChanges(field){
    if ((field == null)) {
      return this.state.initialModel !== this.state.model;
    }
    return this.state.initialModel[field] !== this.state.model[field];
  }

  onChange(field){ return value=> {
    return this.updateState({model: {[field]: {$set: value}}});
  }; }

  toggleEditing() {
    const spec = {$toggle: ['isEditing']};
    if (this.state.isEditing) {
      spec.model = {$set: this.state.initialModel};
    }
    return this.updateState(spec);
  }

  onPersistChanges() {
    return this.persistChanges();
  }

  persistChanges = async spec=> {
    const {persistChanges} = this.props;
    // Persist changes expects a promise

    let updatedModel = this.state.model;
    if (spec != null) {
      // If changeset is provided, we need to integrate
      // it before proceeding
      console.log(spec);
      updatedModel = update(this.state.model, spec);
    }
    console.log(updatedModel);

    let ret = null;
    if (persistChanges == null) { return null; }
    try {
      this.updateState({isPersisting: {$set: true}});

      // Compute a shallow changeset of the model fields
      const changeset = {};
      for (let k in updatedModel) {
        const v = updatedModel[k];
        if (v === this.state.initialModel[k]) { continue; }
        changeset[k] = v;
      }

      return ret = await persistChanges(updatedModel, changeset);
    } catch (err) {
      return console.error(err);
    }
    finally {
      spec = {isPersisting: {$set: false}};

      if (ret != null) {
        const newModel = update(this.state.initialModel, {$merge: ret});
        console.log(newModel);
        spec.model = {$set: newModel};
        spec.initialModel = {$set: newModel};
      }
      this.updateState(spec);
    }
  };

  componentDidUpdate(prevProps){
    if (prevProps == null) { return; }
    if (prevProps === this.props) { return; }
    const spec = {};
    if ((this.props.isEditing !== prevProps.isEditing) && (this.props.isEditing !== this.state.isEditing)) {
      spec.isEditing = {$set: this.props.isEditing};
    }
    if (this.props.model !== prevProps.model) {
      spec.initialModel = {$set: this.props.model};
    }
    return this.updateState(spec);
  }
}
ModelEditor.initClass();

class EditableMultilineText extends Component {
  static initClass() {
    this.contextType = ModelEditorContext;
  }
  render() {
    let {field, className} = this.props;
    const {actions, model, isEditing} =  this.context;
    let value = model[field];
    const onChange = actions.onChange(field);
    className = classNames(className, `field-${field}`);

    if (isEditing) {
      value = h(EditableText, {
        placeholder: `Edit ${field}`,
        multiline: true,
        className,
        onChange,
        value
      });
    }
    return h('div.text', {className}, value);
  }
}
EditableMultilineText.initClass();

class EditableDateField extends Component {
  static initClass() {
    this.contextType = ModelEditorContext;
  }
  render() {
    const {field} = this.props;
    const {actions, model, isEditing} = this.context;
    const value = model[field];
    if (!isEditing) {
      return h('div.date-input.disabled', value);
    }
    return h(DateInput, {
      className: 'date-input',
      value: new Date(value),
      formatDate: date => date.toLocaleDateString(),
      placeholder: "MM/DD/YYYY",
      showActionsBar: true,
      onChange: actions.onChange(field),
      parseDate(d){ return new Date(d); }
    });
  }
}
EditableDateField.initClass();

const useModelEditor = () => useContext(ModelEditorContext);

export {
  ModelEditor,
  ModelEditorContext,
  ModelEditButton,
  EditableMultilineText,
  EditableDateField,
  useModelEditor
};
